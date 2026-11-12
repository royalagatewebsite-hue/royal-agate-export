from decimal import Decimal
import razorpay

from django.conf import settings

from django.db import transaction
from django.db.models import Sum, Max
from django.utils import timezone

from rest_framework.exceptions import ValidationError

from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.inventory.services import InventoryService

from .models import (
    Payment,
    PaymentAttempt,
    PaymentWebhookEvent,
    Refund,
)


class RefundService:

    ACTIVE_REFUND_STATUSES = [
        Refund.RefundStatus.PENDING,
        Refund.RefundStatus.PROCESSING,
        Refund.RefundStatus.COMPLETED,
    ]

    @staticmethod
    @transaction.atomic
    def create_refund(
        payment_id,
        amount,
        refund_method,
        admin_user,
        admin_note="",
    ):
        try:
            payment = (
                Payment.objects
                .select_for_update()
                .select_related("order")
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            raise ValidationError("Payment not found.")

        if payment.order.status != "CANCELLED":
            raise ValidationError(
                "Refund can only be created for cancelled orders."
            )

        if payment.status != Payment.PaymentStatus.SUCCESS:
            raise ValidationError(
                "Only successful payments can be refunded."
            )

        if refund_method not in Refund.RefundMethod.values:
            raise ValidationError("Invalid refund method.")

        try:
            amount = Decimal(str(amount))
        except Exception:
            raise ValidationError("Invalid refund amount.")

        if not amount.is_finite() or amount <= Decimal("0.00"):
            raise ValidationError("Refund amount must be greater than zero.")

        reserved_amount = (
            Refund.objects
            .filter(
                payment=payment,
                status__in=RefundService.ACTIVE_REFUND_STATUSES,
            )
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        remaining_amount = payment.amount - reserved_amount

        if amount > remaining_amount:
            raise ValidationError(
                f"Refund amount exceeds the remaining refundable amount "
                f"of {remaining_amount}."
            )

        return Refund.objects.create(
            payment=payment,
            amount=amount,
            refund_method=refund_method,
            status=Refund.RefundStatus.PENDING,
            admin_note=admin_note,
            processed_by=admin_user,
        )

    @staticmethod
    @transaction.atomic
    def start_refund(refund_id, admin_user):
        try:
            refund = Refund.objects.select_for_update().get(
                id=refund_id
            )
        except Refund.DoesNotExist:
            raise ValidationError("Refund not found.")

        if refund.status != Refund.RefundStatus.PENDING:
            raise ValidationError(
                "Only pending refunds can be moved to processing."
            )

        refund.status = Refund.RefundStatus.PROCESSING
        refund.processed_by = admin_user

        refund.save(
            update_fields=[
                "status",
                "processed_by",
                "updated_at",
            ]
        )

        return refund

    @staticmethod
    @transaction.atomic
    def complete_refund(
        refund_id,
        transaction_reference,
        admin_user,
        admin_note=None,
    ):
        try:
            refund = Refund.objects.select_for_update().get(
                id=refund_id
            )
        except Refund.DoesNotExist:
            raise ValidationError("Refund not found.")

        if refund.status != Refund.RefundStatus.PROCESSING:
            raise ValidationError(
                "Only processing refunds can be completed."
            )

        transaction_reference = transaction_reference.strip()

        if not transaction_reference:
            raise ValidationError(
                "Transaction reference is required."
            )

        refund.status = Refund.RefundStatus.COMPLETED
        refund.transaction_reference = transaction_reference
        refund.processed_by = admin_user
        refund.completed_at = timezone.now()

        if admin_note is not None:
            refund.admin_note = admin_note

        refund.save()

        return refund

    @staticmethod
    @transaction.atomic
    def fail_refund(
        refund_id,
        admin_user,
        admin_note="",
    ):
        try:
            refund = Refund.objects.select_for_update().get(
                id=refund_id
            )
        except Refund.DoesNotExist:
            raise ValidationError("Refund not found.")

        if refund.status not in [
            Refund.RefundStatus.PENDING,
            Refund.RefundStatus.PROCESSING,
        ]:
            raise ValidationError(
                "Only pending or processing refunds can be marked as failed."
            )

        refund.status = Refund.RefundStatus.FAILED
        refund.processed_by = admin_user
        refund.admin_note = admin_note

        refund.save(
            update_fields=[
                "status",
                "processed_by",
                "admin_note",
                "updated_at",
            ]
        )

        return refund
    
class PaymentService:

    ALLOWED_PAYMENT_METHODS = [
        Payment.PaymentMethod.CASH,
        Payment.PaymentMethod.BANK_TRANSFER,
    ]

    @staticmethod
    @transaction.atomic
    def initiate_attempt(
        order_id,
        user,
        payment_method,
        idempotency_key,
        transaction_id="",
    ):
        # 1. Lock customer's order.
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(pk=order_id, user=user)
            )
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        # 2. Validate order state.
        if order.status != Order.OrderStatus.PENDING:
            raise ValidationError(
                "Payment can only be initiated for pending orders."
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            raise ValidationError(
                "This order is not awaiting payment."
            )

        if order.stock_restored_at is not None:
            raise ValidationError(
                "Stock has already been restored for this order."
            )

        # 3. Validate payment method.
        if payment_method not in PaymentService.ALLOWED_PAYMENT_METHODS:
            raise ValidationError("Invalid payment method.")

        transaction_id = (transaction_id or "").strip()
        idempotency_key = (idempotency_key or "").strip()

        if not idempotency_key:
            raise ValidationError("Idempotency key is required.")

        if (
            payment_method == Payment.PaymentMethod.BANK_TRANSFER
            and not transaction_id
        ):
            raise ValidationError(
                "Bank transfer transaction reference is required."
            )

        # 4. Lock the order's payment record.
        try:
            payment = (
                Payment.objects
                .select_for_update()
                .get(order=order)
            )
        except Payment.DoesNotExist:
            raise ValidationError(
                "Payment record does not exist for this order."
            )
        except Payment.MultipleObjectsReturned:
            raise ValidationError(
                "Multiple payment records exist for this order."
            )

        if payment.status != Payment.PaymentStatus.PENDING:
            raise ValidationError(
                "This payment is no longer pending."
            )

        # 5. Handle idempotent requests.
        existing_attempt = PaymentAttempt.objects.filter(
            idempotency_key=idempotency_key
        ).first()

        if existing_attempt:
            if (
                existing_attempt.payment_id != payment.id
                or existing_attempt.payment_method != payment_method
                or existing_attempt.transaction_id != transaction_id
            ):
                raise ValidationError(
                    "Idempotency key has already been used."
                )

            return existing_attempt

        # 6. Generate the next attempt number.
        last_attempt = (
            PaymentAttempt.objects
            .filter(payment=payment)
            .aggregate(max_attempt=Max("attempt_number"))
        )

        attempt_number = (last_attempt["max_attempt"] or 0) + 1

        # 7. Create payment attempt.
        attempt = PaymentAttempt.objects.create(
            payment=payment,
            attempt_number=attempt_number,
            payment_method=payment_method,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key=idempotency_key,
            transaction_id=transaction_id,
        )

        # 8. Update payment method.
        payment.payment_method = payment_method
        payment.save(
            update_fields=["payment_method", "updated_at"]
        )

        return attempt
    
    @staticmethod
    @transaction.atomic
    def create_razorpay_order(order_id, user, idempotency_key):
        # 1. Validate Razorpay configuration.
        key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")

        if not key_id or not key_secret:
            raise ValidationError(
                "Razorpay is not configured. Please configure API credentials."
            )

        # 2. Lock and validate customer's order.
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(pk=order_id, user=user)
            )
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        if order.status != Order.OrderStatus.PENDING:
            raise ValidationError(
                "Payment can only be initiated for pending orders."
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            raise ValidationError("This order is not awaiting payment.")

        if order.stock_restored_at is not None:
            raise ValidationError(
                "Stock has already been restored for this order."
            )

        # 3. Validate idempotency key.
        idempotency_key = (idempotency_key or "").strip()

        if not idempotency_key:
            raise ValidationError("Idempotency key is required.")

        # 4. Lock payment record.
        try:
            payment = (
                Payment.objects
                .select_for_update()
                .get(order=order)
            )
        except Payment.DoesNotExist:
            raise ValidationError(
                "Payment record does not exist for this order."
            )

        if payment.status != Payment.PaymentStatus.PENDING:
            raise ValidationError("This payment is no longer pending.")

        # 5. Handle duplicate requests.
        existing_attempt = PaymentAttempt.objects.filter(
            idempotency_key=idempotency_key
        ).first()

        if existing_attempt:
            if (
                existing_attempt.payment_id != payment.id
                or existing_attempt.payment_method
                != Payment.PaymentMethod.RAZORPAY
            ):
                raise ValidationError(
                    "Idempotency key has already been used."
                )

            if not existing_attempt.gateway_order_id:
                raise ValidationError(
                    "Existing Razorpay attempt has no gateway order ID."
                )

            return existing_attempt

        # 6. Calculate amount in paise.
        amount_in_paise = int(payment.amount * 100)

        if amount_in_paise <= 0:
            raise ValidationError("Invalid payment amount.")

        if payment.amount != order.total_amount:
            raise ValidationError(
                "Payment amount does not match the order total."
            )

        # 7. Generate attempt number.
        last_attempt = (
            PaymentAttempt.objects
            .filter(payment=payment)
            .aggregate(max_attempt=Max("attempt_number"))
        )

        attempt_number = (last_attempt["max_attempt"] or 0) + 1

        # 8. Create payment attempt.
        attempt = PaymentAttempt.objects.create(
            payment=payment,
            attempt_number=attempt_number,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key=idempotency_key,
        )

        # 9. Create Razorpay order.
        client = razorpay.Client(
            auth=(key_id, key_secret)
        )

        try:
            razorpay_order = client.order.create(
                data={
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": order.order_number,
                    "notes": {
                        "order_number": order.order_number,
                        "payment_attempt_id": str(attempt.id),
                    },
                }
            )
        except Exception:
            raise ValidationError(
                "Unable to create Razorpay order. Please try again."
            )

        gateway_order_id = razorpay_order.get("id")

        if not gateway_order_id:
            raise ValidationError(
                "Razorpay did not return a valid order ID."
            )

        # 10. Save gateway details.
        attempt.gateway_order_id = gateway_order_id
        attempt.save(
            update_fields=["gateway_order_id", "updated_at"]
        )

        payment.payment_method = Payment.PaymentMethod.RAZORPAY
        payment.gateway_order_id = gateway_order_id
        payment.save(
            update_fields=[
                "payment_method",
                "gateway_order_id",
                "updated_at",
            ]
        )

        return attempt
    
    @staticmethod
    def verify_razorpay_payment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        user,
    ):
        key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")

        if not key_id or not key_secret:
            raise ValidationError("Razorpay is not configured.")

        if not all([
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        ]):
            raise ValidationError("Payment verification details are required.")

        client = razorpay.Client(auth=(key_id, key_secret))

        # 1. Verify checkout signature.
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        except Exception:
            raise ValidationError("Invalid Razorpay payment signature.")

        # 2. Fetch payment directly from Razorpay.
        try:
            gateway_payment = client.payment.fetch(razorpay_payment_id)
        except Exception:
            raise ValidationError(
                "Unable to verify payment with Razorpay."
            )

        # 3. Validate gateway payment details.
        if gateway_payment.get("order_id") != razorpay_order_id:
            raise ValidationError("Payment does not belong to this order.")

        if gateway_payment.get("status") != "captured":
            raise ValidationError("Payment has not been captured.")

        if gateway_payment.get("currency") != "INR":
            raise ValidationError("Invalid payment currency.")

        # 4. Find the corresponding payment attempt.
        # 4. Find the payment attempt belonging to this customer.
        try:
            attempt_info = (
                PaymentAttempt.objects
                .select_related("payment__order")
                .get(
                    gateway_order_id=razorpay_order_id,
                    payment__order__user=user,
                )
            )
        except PaymentAttempt.DoesNotExist:
            raise ValidationError(
                "Payment attempt does not exist."
            )

        payment_info = attempt_info.payment

        # Verify the gateway order ID against our database.
        if payment_info.gateway_order_id != razorpay_order_id:
            raise ValidationError(
                "Gateway order ID mismatch."
            )

        # 5. Verify amount against our database.
        expected_amount = int(payment_info.amount * 100)

        if gateway_payment.get("amount") != expected_amount:
            raise ValidationError("Payment amount mismatch.")

        # 6. Lock database records and update atomically.
        with transaction.atomic():

            order = (
                Order.objects
                .select_for_update()
                .get(pk=payment_info.order_id)
            )

            payment = (
                Payment.objects
                .select_for_update()
                .get(pk=attempt_info.payment_id)
            )

            attempt = (
                PaymentAttempt.objects
                .select_for_update()
                .get(pk=attempt_info.id, payment=payment)
            )

            # Handle duplicate verification requests.
            if (
                attempt.status == PaymentAttempt.AttemptStatus.SUCCESS
                and attempt.gateway_payment_id == razorpay_payment_id
                and payment.status == Payment.PaymentStatus.SUCCESS
                and payment.gateway_payment_id == razorpay_payment_id
            ):
                return attempt

            if attempt.status != PaymentAttempt.AttemptStatus.INITIATED:
                raise ValidationError(
                    "This payment attempt is no longer active."
                )

            if payment.status != Payment.PaymentStatus.PENDING:
                raise ValidationError("Payment is no longer pending.")

            if order.payment_status != Order.PaymentStatus.PENDING:
                raise ValidationError("Order is not awaiting payment.")

            if order.status != Order.OrderStatus.PENDING:
                raise ValidationError(
                    "Only pending orders can receive payment confirmation."
                )

            if order.stock_restored_at is not None:
                raise ValidationError("Order stock has already been restored.")

            # 7. Mark attempt successful.
            attempt.status = PaymentAttempt.AttemptStatus.SUCCESS
            attempt.gateway_payment_id = razorpay_payment_id
            attempt.transaction_id = razorpay_payment_id

            attempt.save(
                update_fields=[
                    "status",
                    "gateway_payment_id",
                    "transaction_id",
                    "updated_at",
                ]
            )

            # 8. Update payment record.
            payment.status = Payment.PaymentStatus.SUCCESS
            payment.payment_method = Payment.PaymentMethod.RAZORPAY
            payment.gateway_payment_id = razorpay_payment_id
            payment.transaction_id = razorpay_payment_id

            payment.save(
                update_fields=[
                    "status",
                    "payment_method",
                    "gateway_payment_id",
                    "transaction_id",
                    "updated_at",
                ]
            )

            # 9. Mark order as paid.
            order.payment_status = Order.PaymentStatus.PAID

            order.save(
                update_fields=["payment_status", "updated_at"]
            )

            # 10. Cancel other active attempts.
            PaymentAttempt.objects.filter(
                payment=payment,
                status=PaymentAttempt.AttemptStatus.INITIATED,
            ).exclude(
                pk=attempt.pk
            ).update(
                status=PaymentAttempt.AttemptStatus.CANCELLED,
                updated_at=timezone.now(),
            )

            return attempt
        
    @staticmethod
    def process_razorpay_webhook(
        event_id,
        event_data,
        payment_entity,
    ):
        event_type = event_data.get("event")

        if event_type not in [
            "payment.captured",
            "payment.failed",
        ]:
            raise ValidationError("Unsupported webhook event.")

        if not event_id:
            raise ValidationError("Webhook event ID is required.")

        gateway_order_id = payment_entity.get("order_id")
        gateway_payment_id = payment_entity.get("id")
        amount = payment_entity.get("amount")
        currency = payment_entity.get("currency")

        if currency != "INR":
            raise ValidationError("Invalid payment currency.")

        if not isinstance(amount, int) or isinstance(amount, bool):
            raise ValidationError("Invalid payment amount.")

        if not gateway_order_id or not gateway_payment_id:
            raise ValidationError("Invalid gateway payment details.")

        with transaction.atomic():

            # 1. Create or retrieve webhook event.
            event, created = PaymentWebhookEvent.objects.get_or_create(
                event_id=event_id,
                defaults={
                    "event_type": event_type,
                    "payload": event_data,
                },
            )

            event = (
                PaymentWebhookEvent.objects
                .select_for_update()
                .get(pk=event.pk)
            )

            # 2. Ignore already processed events.
            if event.status == PaymentWebhookEvent.ProcessingStatus.PROCESSED:
                return {
                    "processed": True,
                    "duplicate": True,
                }

            event.event_type = event_type
            event.payload = event_data
            event.status = PaymentWebhookEvent.ProcessingStatus.RECEIVED
            event.error_message = ""
            event.save(
                update_fields=[
                    "event_type",
                    "payload",
                    "status",
                    "error_message",
                    "updated_at",
                ]
            )

            try:
                # 3. Process payment inside a savepoint.
                with transaction.atomic():

                    attempt_info = (
                        PaymentAttempt.objects
                        .select_related("payment")
                        .get(gateway_order_id=gateway_order_id)
                    )

                    # 4. Lock order first.
                    order = (
                        Order.objects
                        .select_for_update()
                        .get(pk=attempt_info.payment.order_id)
                    )

                    # 5. Lock payment and attempt.
                    payment = (
                        Payment.objects
                        .select_for_update()
                        .get(pk=attempt_info.payment_id)
                    )

                    attempt = (
                        PaymentAttempt.objects
                        .select_for_update()
                        .get(
                            pk=attempt_info.pk,
                            payment=payment,
                        )
                    )

                    # 6. Validate gateway references and amount.
                    if payment.gateway_order_id != gateway_order_id:
                        raise ValidationError("Gateway order ID mismatch.")

                    if payment.amount * 100 != amount:
                        raise ValidationError("Payment amount mismatch.")

                    # 7. Handle payment.captured.
                    if event_type == "payment.captured":

                        if payment_entity.get("status") != "captured":
                            raise ValidationError(
                                "Payment is not captured."
                            )

                        # Idempotent handling of an already successful payment.
                        if (
                            payment.status == Payment.PaymentStatus.SUCCESS
                            and payment.gateway_payment_id == gateway_payment_id
                        ):
                            pass

                        else:
                            if payment.status != Payment.PaymentStatus.PENDING:
                                raise ValidationError(
                                    "Payment is no longer pending. "
                                    "Manual reconciliation may be required."
                                )

                            if order.payment_status != Order.PaymentStatus.PENDING:
                                raise ValidationError(
                                    "Order is not awaiting payment."
                                )

                            if order.status != Order.OrderStatus.PENDING:
                                raise ValidationError(
                                    "Order is not in pending status."
                                )

                            if order.stock_restored_at is not None:
                                raise ValidationError(
                                    "Order stock has already been restored."
                                )

                            if attempt.status not in [
                                PaymentAttempt.AttemptStatus.INITIATED,
                                PaymentAttempt.AttemptStatus.FAILED,
                            ]:
                                raise ValidationError(
                                    "Payment attempt cannot be captured."
                                )

                            attempt.status = PaymentAttempt.AttemptStatus.SUCCESS
                            attempt.gateway_payment_id = gateway_payment_id
                            attempt.transaction_id = gateway_payment_id

                            attempt.save(
                                update_fields=[
                                    "status",
                                    "gateway_payment_id",
                                    "transaction_id",
                                    "updated_at",
                                ]
                            )

                            payment.status = Payment.PaymentStatus.SUCCESS
                            payment.payment_method = Payment.PaymentMethod.RAZORPAY
                            payment.gateway_payment_id = gateway_payment_id
                            payment.transaction_id = gateway_payment_id

                            payment.save(
                                update_fields=[
                                    "status",
                                    "payment_method",
                                    "gateway_payment_id",
                                    "transaction_id",
                                    "updated_at",
                                ]
                            )

                            order.payment_status = Order.PaymentStatus.PAID
                            order.save(
                                update_fields=[
                                    "payment_status",
                                    "updated_at",
                                ]
                            )

                            # Cancel other active attempts.
                            PaymentAttempt.objects.filter(
                                payment=payment,
                                status=PaymentAttempt.AttemptStatus.INITIATED,
                            ).exclude(
                                pk=attempt.pk
                            ).update(
                                status=PaymentAttempt.AttemptStatus.CANCELLED,
                                updated_at=timezone.now(),
                            )

                    # 8. Handle payment.failed.
                    elif event_type == "payment.failed":

                        if payment_entity.get("status") != "failed":
                            raise ValidationError(
                                "Invalid failed payment event."
                            )

                        # Never downgrade a successful payment.
                        if payment.status == Payment.PaymentStatus.SUCCESS:
                            if payment.gateway_payment_id == gateway_payment_id:
                                pass
                            else:
                                raise ValidationError(
                                    "A different payment is already successful."
                                )

                        elif attempt.status == PaymentAttempt.AttemptStatus.INITIATED:
                            attempt.status = PaymentAttempt.AttemptStatus.FAILED
                            attempt.gateway_payment_id = gateway_payment_id
                            attempt.failure_reason = (
                                payment_entity.get("error_description")
                                or "Razorpay payment failed."
                            )

                            attempt.save(
                                update_fields=[
                                    "status",
                                    "gateway_payment_id",
                                    "failure_reason",
                                    "updated_at",
                                ]
                            )

                        # Payment remains PENDING for retry.
                        # Stock is not restored here.

                # 9. Mark webhook event processed.
                event.status = PaymentWebhookEvent.ProcessingStatus.PROCESSED
                event.processed_at = timezone.now()
                event.error_message = ""
                event.save(
                    update_fields=[
                        "status",
                        "processed_at",
                        "error_message",
                        "updated_at",
                    ]
                )

                return {
                    "processed": True,
                    "duplicate": False,
                }

            except Exception as exc:
                # Preserve the event record for debugging and retry.
                event.status = PaymentWebhookEvent.ProcessingStatus.FAILED
                event.error_message = str(exc)[:5000]
                event.save(
                    update_fields=[
                        "status",
                        "error_message",
                        "updated_at",
                    ]
                )

                return {
                    "processed": False,
                    "duplicate": False,
                }
    

    @staticmethod
    @transaction.atomic
    def mark_attempt_success(
        attempt_id,
        admin_user,
    ):
        # 1. Find payment and order.
        try:
            attempt_info = PaymentAttempt.objects.only(
                "payment_id",
                "payment__order_id",
            ).get(pk=attempt_id)
        except PaymentAttempt.DoesNotExist:
            raise ValidationError("Payment attempt does not exist.")

        # 2. Lock order first.
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(pk=attempt_info.payment.order_id)
            )
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        # 3. Lock payment.
        payment = (
            Payment.objects
            .select_for_update()
            .get(pk=attempt_info.payment_id)
        )

        # 4. Lock attempt.
        attempt = (
            PaymentAttempt.objects
            .select_for_update()
            .get(pk=attempt_id, payment=payment)
        )

        if attempt.status != PaymentAttempt.AttemptStatus.INITIATED:
            raise ValidationError(
                "Only initiated payment attempts can be verified."
            )

        if payment.status != Payment.PaymentStatus.PENDING:
            raise ValidationError(
                "Payment is no longer pending."
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            raise ValidationError(
                "Order is not awaiting payment."
            )

        if order.status != Order.OrderStatus.PENDING:
            raise ValidationError(
                "Only pending orders can receive payment confirmation."
            )

        if order.stock_restored_at is not None:
            raise ValidationError(
                "Stock has already been restored."
            )

        # 5. Mark attempt successful.
        attempt.status = PaymentAttempt.AttemptStatus.SUCCESS
        attempt.save(
            update_fields=["status", "updated_at"]
        )

        # 6. Update payment and order.
        payment.status = Payment.PaymentStatus.SUCCESS
        payment.transaction_id = attempt.transaction_id

        payment.save(
            update_fields=[
                "status",
                "transaction_id",
                "updated_at",
            ]
        )

        order.payment_status = Order.PaymentStatus.PAID
        order.save(
            update_fields=["payment_status", "updated_at"]
        )

        # 7. Cancel other pending attempts.
        PaymentAttempt.objects.filter(
            payment=payment,
            status=PaymentAttempt.AttemptStatus.INITIATED,
        ).exclude(
            pk=attempt.id
        ).update(
            status=PaymentAttempt.AttemptStatus.CANCELLED,
            updated_at=timezone.now(),
        )

        return attempt

    @staticmethod
    @transaction.atomic
    def mark_attempt_failed(
        attempt_id,
        admin_user,
        failure_reason="",
    ):
        # 1. Find payment and order.
        try:
            attempt_info = PaymentAttempt.objects.only(
                "payment_id",
                "payment__order_id",
            ).get(pk=attempt_id)
        except PaymentAttempt.DoesNotExist:
            raise ValidationError("Payment attempt does not exist.")

        # 2. Lock order first.
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(pk=attempt_info.payment.order_id)
            )
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        # 3. Lock payment and attempt.
        payment = (
            Payment.objects
            .select_for_update()
            .get(pk=attempt_info.payment_id)
        )

        attempt = (
            PaymentAttempt.objects
            .select_for_update()
            .get(pk=attempt_id, payment=payment)
        )

        if attempt.status != PaymentAttempt.AttemptStatus.INITIATED:
            raise ValidationError(
                "Only initiated attempts can be marked as failed."
            )

        if payment.status != Payment.PaymentStatus.PENDING:
            raise ValidationError(
                "Payment is no longer pending."
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            raise ValidationError(
                "Order is not awaiting payment."
            )

        # 4. Mark individual attempt as failed.
        attempt.status = PaymentAttempt.AttemptStatus.FAILED
        attempt.failure_reason = failure_reason.strip()

        attempt.save(
            update_fields=[
                "status",
                "failure_reason",
                "updated_at",
            ]
        )

        # Payment remains pending to allow retries.
        # Stock is NOT restored here.

        return attempt

    @staticmethod
    @transaction.atomic
    def finalize_payment_failure(
        payment_id,
        admin_user,
        failure_reason="",
    ):
        # 1. Find order ID.
        try:
            payment_info = Payment.objects.only(
                "order_id"
            ).get(pk=payment_id)
        except Payment.DoesNotExist:
            raise ValidationError("Payment does not exist.")

        # 2. Lock order first.
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(pk=payment_info.order_id)
            )
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        # 3. Lock payment.
        payment = (
            Payment.objects
            .select_for_update()
            .get(pk=payment_id)
        )

        # 4. Validate payment state.
        if payment.status == Payment.PaymentStatus.FAILED:
            return payment

        if payment.status != Payment.PaymentStatus.PENDING:
            raise ValidationError(
                "Only pending payments can be finalized as failed."
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            raise ValidationError(
                "Order payment is no longer pending."
            )

        if order.status not in [
            Order.OrderStatus.PENDING,
            Order.OrderStatus.CANCELLED,
        ]:
            raise ValidationError(
                "This order cannot be finalized as payment failed."
            )

        # 5. Prevent final failure while attempts are active.
        active_attempts = PaymentAttempt.objects.filter(
            payment=payment,
            status=PaymentAttempt.AttemptStatus.INITIATED,
        ).exists()

        if active_attempts:
            raise ValidationError(
                "All initiated payment attempts must be resolved first."
            )

        successful_attempt = PaymentAttempt.objects.filter(
            payment=payment,
            status=PaymentAttempt.AttemptStatus.SUCCESS,
        ).exists()

        if successful_attempt:
            raise ValidationError(
                "A successful payment cannot be finalized as failed."
            )

        # 6. Restore stock only if it has not already been restored.
        if (
            order.stock_deducted_at is not None
            and order.stock_restored_at is None
        ):
            order_items = list(
                OrderItem.objects
                .select_related("product")
                .filter(order=order)
                .order_by("product_id", "pk")
            )

            if not order_items:
                raise ValidationError(
                    "Cannot restore stock without order items."
                )

            product_quantities = {}

            for item in order_items:
                if item.product_id is None:
                    raise ValidationError(
                        f"Product for order item '{item.product_name}' "
                        "no longer exists."
                    )

                if item.product_id not in product_quantities:
                    product_quantities[item.product_id] = {
                        "product": item.product,
                        "quantity": 0,
                    }

                product_quantities[item.product_id]["quantity"] += (
                    item.quantity
                )

            for product_id in sorted(product_quantities):
                stock_data = product_quantities[product_id]

                InventoryService.increase_stock(
                    product=stock_data["product"],
                    quantity=stock_data["quantity"],
                    reason=(
                        f"Stock restored due to payment failure "
                        f"for order {order.order_number}"
                    ),
                    created_by=admin_user,
                )

            order.stock_restored_at = timezone.now()

        # 7. Cancel remaining initiated attempts.
        PaymentAttempt.objects.filter(
            payment=payment,
            status=PaymentAttempt.AttemptStatus.INITIATED,
        ).update(
            status=PaymentAttempt.AttemptStatus.CANCELLED,
            updated_at=timezone.now(),
        )

        # 8. Update payment.
        payment.status = Payment.PaymentStatus.FAILED
        payment.failure_reason = failure_reason.strip()

        payment.save(
            update_fields=[
                "status",
                "failure_reason",
                "updated_at",
            ]
        )

        # 9. Update order.
        previous_status = order.status

        order.status = Order.OrderStatus.CANCELLED
        order.payment_status = Order.PaymentStatus.FAILED

        order.save(
            update_fields=[
                "status",
                "payment_status",
                "stock_restored_at",
                "updated_at",
            ]
        )

        # 10. Record order history.
        if previous_status != Order.OrderStatus.CANCELLED:
            OrderStatusHistory.objects.create(
                order=order,
                previous_status=previous_status,
                new_status=Order.OrderStatus.CANCELLED,
                changed_by=admin_user,
                note=(
                    "Order cancelled due to payment failure. "
                    f"{failure_reason.strip()}"
                ),
            )

        return payment