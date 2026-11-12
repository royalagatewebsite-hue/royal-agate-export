from decimal import Decimal
from django.contrib.auth.models import Group

from rest_framework.test import APIClient

from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.exceptions import ValidationError

from apps.orders.models import Order

from django.utils import timezone

from apps.catalogue.models import Category, Product
from apps.inventory.models import Inventory, StockMovement
from apps.inventory.services import InventoryService
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment, PaymentAttempt, Refund
from apps.payments.services import PaymentService, RefundService

from unittest.mock import patch

import hashlib
import hmac
import json

from django.test import override_settings

from apps.payments.models import PaymentWebhookEvent


User = get_user_model()


class RefundServiceTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="TestPassword123!",
        )

        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="AdminPassword123!",
        )

        self.order = Order.objects.create(
            order_number="ORD-REFUND-001",
            user=self.customer,
            shipping_full_name="Test Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("1000.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("1000.00"),
            status=Order.OrderStatus.CANCELLED,
            payment_status=Order.PaymentStatus.PAID,
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=Payment.PaymentStatus.SUCCESS,
            amount=Decimal("1000.00"),
            transaction_id="PAY-TEST-001",
        )

    def create_refund(self, amount="100.00"):
        return RefundService.create_refund(
            payment_id=self.payment.id,
            amount=Decimal(amount),
            refund_method=Refund.RefundMethod.UPI,
            admin_user=self.admin,
        )

    # --------------------------------------------------
    # REFUND CREATION TESTS
    # --------------------------------------------------

    def test_create_refund_successfully(self):
        refund = self.create_refund("200.00")

        self.assertEqual(refund.amount, Decimal("200.00"))
        self.assertEqual(refund.status, Refund.RefundStatus.PENDING)
        self.assertEqual(refund.payment, self.payment)

    def test_refund_rejected_for_non_cancelled_order(self):
        self.order.status = Order.OrderStatus.PENDING
        self.order.save()

        with self.assertRaises(ValidationError):
            self.create_refund()

    def test_refund_rejected_for_failed_payment(self):
        self.payment.status = Payment.PaymentStatus.FAILED
        self.payment.save()

        with self.assertRaises(ValidationError):
            self.create_refund()

    def test_partial_refunds_are_allowed(self):
        refund1 = self.create_refund("400.00")
        refund2 = self.create_refund("300.00")

        self.assertEqual(refund1.amount, Decimal("400.00"))
        self.assertEqual(refund2.amount, Decimal("300.00"))

    def test_full_refund_is_allowed(self):
        refund = self.create_refund("1000.00")

        self.assertEqual(refund.amount, Decimal("1000.00"))

    def test_over_refunding_is_rejected(self):
        self.create_refund("700.00")

        with self.assertRaises(ValidationError):
            self.create_refund("400.00")

    def test_pending_refund_amount_is_reserved(self):
        self.create_refund("600.00")

        with self.assertRaises(ValidationError):
            self.create_refund("500.00")

    def test_failed_refund_amount_becomes_available_again(self):
        refund = self.create_refund("600.00")

        RefundService.fail_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        new_refund = self.create_refund("600.00")

        self.assertEqual(
            new_refund.amount,
            Decimal("600.00"),
        )

    def test_zero_refund_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.create_refund("0.00")

    def test_invalid_refund_method_is_rejected(self):
        with self.assertRaises(ValidationError):
            RefundService.create_refund(
                payment_id=self.payment.id,
                amount=Decimal("100.00"),
                refund_method="INVALID",
                admin_user=self.admin,
            )

    # --------------------------------------------------
    # REFUND PROCESSING TESTS
    # --------------------------------------------------

    def test_start_refund_successfully(self):
        refund = self.create_refund()

        updated_refund = RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        self.assertEqual(
            updated_refund.status,
            Refund.RefundStatus.PROCESSING,
        )

    def test_only_pending_refund_can_be_started(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            RefundService.start_refund(
                refund_id=refund.id,
                admin_user=self.admin,
            )

    def test_complete_refund_successfully(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        completed_refund = RefundService.complete_refund(
            refund_id=refund.id,
            transaction_reference="UPI-REF-123456",
            admin_user=self.admin,
        )

        self.assertEqual(
            completed_refund.status,
            Refund.RefundStatus.COMPLETED,
        )

        self.assertEqual(
            completed_refund.transaction_reference,
            "UPI-REF-123456",
        )

        self.assertIsNotNone(completed_refund.completed_at)

    def test_completion_requires_transaction_reference(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            RefundService.complete_refund(
                refund_id=refund.id,
                transaction_reference="   ",
                admin_user=self.admin,
            )

    def test_completed_refund_cannot_be_completed_again(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        RefundService.complete_refund(
            refund_id=refund.id,
            transaction_reference="UPI-REF-123",
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            RefundService.complete_refund(
                refund_id=refund.id,
                transaction_reference="UPI-REF-456",
                admin_user=self.admin,
            )

    def test_fail_refund_successfully(self):
        refund = self.create_refund()

        failed_refund = RefundService.fail_refund(
            refund_id=refund.id,
            admin_user=self.admin,
            admin_note="Bank transaction failed.",
        )

        self.assertEqual(
            failed_refund.status,
            Refund.RefundStatus.FAILED,
        )

        self.assertEqual(
            failed_refund.admin_note,
            "Bank transaction failed.",
        )

    def test_completed_refund_cannot_be_failed(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        RefundService.complete_refund(
            refund_id=refund.id,
            transaction_reference="UPI-REF-123",
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            RefundService.fail_refund(
                refund_id=refund.id,
                admin_user=self.admin,
            )

    def test_original_payment_status_remains_success(self):
        refund = self.create_refund()

        RefundService.start_refund(
            refund_id=refund.id,
            admin_user=self.admin,
        )

        RefundService.complete_refund(
            refund_id=refund.id,
            transaction_reference="UPI-REF-123",
            admin_user=self.admin,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )
        
class RefundAPITests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="api_customer",
            email="api_customer@example.com",
            password="TestPassword123!",
        )

        self.admin = User.objects.create_superuser(
            username="api_admin",
            email="api_admin@example.com",
            password="AdminPassword123!",
        )
        
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.admin.groups.add(admin_group)

        self.order = Order.objects.create(
            order_number="ORD-API-001",
            user=self.customer,
            shipping_full_name="API Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("1000.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("1000.00"),
            status=Order.OrderStatus.CANCELLED,
            payment_status=Order.PaymentStatus.PAID,
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=Payment.PaymentStatus.SUCCESS,
            amount=Decimal("1000.00"),
            transaction_id="API-PAY-001",
        )

        self.client = APIClient()

        self.refunds_url = "/api/v1/payments/refunds/"

    def authenticate_admin(self):
        self.client.force_authenticate(user=self.admin)

    def authenticate_customer(self):
        self.client.force_authenticate(user=self.customer)

    def create_refund(self):
        return RefundService.create_refund(
            payment_id=self.payment.id,
            amount=Decimal("200.00"),
            refund_method=Refund.RefundMethod.UPI,
            admin_user=self.admin,
        )

    # ------------------------------------------
    # ACCESS CONTROL TESTS
    # ------------------------------------------

    def test_unauthenticated_user_cannot_list_refunds(self):
        response = self.client.get(self.refunds_url)

        self.assertEqual(response.status_code, 401)

    def test_customer_cannot_list_refunds(self):
        self.authenticate_customer()

        response = self.client.get(self.refunds_url)

        self.assertEqual(response.status_code, 403)

    def test_customer_cannot_create_refund(self):
        self.authenticate_customer()

        response = self.client.post(
            self.refunds_url,
            {
                "payment_id": self.payment.id,
                "amount": "200.00",
                "refund_method": "UPI",
            },
        )

        self.assertEqual(response.status_code, 403)

    # ------------------------------------------
    # REFUND CREATION AND LIST TESTS
    # ------------------------------------------

    def test_admin_can_create_refund(self):
        self.authenticate_admin()

        response = self.client.post(
            self.refunds_url,
            {
                "payment_id": self.payment.id,
                "amount": "200.00",
                "refund_method": "UPI",
                "admin_note": "Customer order cancelled.",
            },
        )

        self.assertEqual(response.status_code, 201)

        self.assertEqual(
            response.data["refund"]["status"],
            Refund.RefundStatus.PENDING,
        )

    def test_admin_can_list_refunds(self):
        self.authenticate_admin()

        self.create_refund()

        response = self.client.get(self.refunds_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_invalid_refund_data_is_rejected(self):
        self.authenticate_admin()

        response = self.client.post(
            self.refunds_url,
            {
                "payment_id": self.payment.id,
                "amount": "0.00",
                "refund_method": "UPI",
            },
        )

        self.assertEqual(response.status_code, 400)

    # ------------------------------------------
    # REFUND PROCESSING API TESTS
    # ------------------------------------------

    def test_admin_can_start_refund_processing(self):
        self.authenticate_admin()

        refund = self.create_refund()

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/process/"
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["refund"]["status"],
            Refund.RefundStatus.PROCESSING,
        )

    def test_admin_can_complete_refund(self):
        self.authenticate_admin()

        refund = self.create_refund()

        self.client.post(
            f"{self.refunds_url}{refund.id}/process/"
        )

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/complete/",
            {
                "transaction_reference": "UPI-API-12345",
                "admin_note": "Refund transferred successfully.",
            },
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["refund"]["status"],
            Refund.RefundStatus.COMPLETED,
        )

        self.assertEqual(
            response.data["refund"]["transaction_reference"],
            "UPI-API-12345",
        )

    def test_admin_can_mark_refund_failed(self):
        self.authenticate_admin()

        refund = self.create_refund()

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/fail/",
            {
                "admin_note": "Bank transfer failed.",
            },
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["refund"]["status"],
            Refund.RefundStatus.FAILED,
        )

    def test_refund_completion_requires_transaction_reference(self):
        self.authenticate_admin()

        refund = self.create_refund()

        self.client.post(
            f"{self.refunds_url}{refund.id}/process/"
        )

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/complete/",
            {
                "transaction_reference": "   ",
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_customer_cannot_process_refund(self):
        refund = self.create_refund()

        self.authenticate_customer()

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/process/"
        )

        self.assertEqual(response.status_code, 403)

    def test_customer_cannot_complete_refund(self):
        refund = self.create_refund()

        self.authenticate_customer()

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/complete/",
            {
                "transaction_reference": "UPI-12345",
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_customer_cannot_fail_refund(self):
        refund = self.create_refund()

        self.authenticate_customer()

        response = self.client.post(
            f"{self.refunds_url}{refund.id}/fail/",
            {
                "admin_note": "Failed",
            },
        )

        self.assertEqual(response.status_code, 403)
        


class PaymentServiceTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="payment_customer",
            email="payment_customer@example.com",
            password="TestPassword123!",
        )

        self.admin = User.objects.create_superuser(
            username="payment_admin",
            email="payment_admin@example.com",
            password="AdminPassword123!",
        )

        self.other_customer = User.objects.create_user(
            username="other_customer",
            email="other_customer@example.com",
            password="TestPassword123!",
        )

        self.category = Category.objects.create(
            name="Payment Test Category",
        )

        self.product = Product.objects.create(
            name="Payment Test Product",
            sku="PAY-TEST-001",
            category=self.category,
            retail_price=Decimal("100.00"),
            selling_modes=["RETAIL"],
            retail_moq=1,
        )

        self.inventory = Inventory.objects.create(
            product=self.product,
            quantity=10,
        )

        # Simulate stock reservation during order creation.
        InventoryService.decrease_stock(
            product=self.product,
            quantity=3,
            reason="Order stock reservation",
            created_by=self.customer,
        )

        self.order = Order.objects.create(
            order_number="ORD-PAY-TEST-001",
            user=self.customer,
            shipping_full_name="Test Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("300.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("300.00"),
            status=Order.OrderStatus.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
            stock_deducted_at=timezone.now(),
        )

        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            product_sku=self.product.sku,
            purchase_mode=OrderItem.PurchaseMode.RETAIL,
            quantity=3,
            unit_price=Decimal("100.00"),
            subtotal=Decimal("300.00"),
        )

        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("300.00"),
            status=Payment.PaymentStatus.PENDING,
        )

    def create_attempt(
        self,
        payment_method=Payment.PaymentMethod.CASH,
        idempotency_key="payment-test-key-001",
        transaction_id="",
    ):
        return PaymentService.initiate_attempt(
            order_id=self.order.id,
            user=self.customer,
            payment_method=payment_method,
            idempotency_key=idempotency_key,
            transaction_id=transaction_id,
        )

    # -----------------------------------------
    # PAYMENT INITIATION TESTS
    # -----------------------------------------

    def test_cash_payment_attempt_created(self):
        attempt = self.create_attempt()

        self.assertEqual(
            attempt.payment_method,
            Payment.PaymentMethod.CASH,
        )
        self.assertEqual(
            attempt.status,
            PaymentAttempt.AttemptStatus.INITIATED,
        )
        self.assertEqual(attempt.attempt_number, 1)

    def test_bank_transfer_requires_transaction_reference(self):
        with self.assertRaises(ValidationError):
            self.create_attempt(
                payment_method=Payment.PaymentMethod.BANK_TRANSFER,
            )

    def test_bank_transfer_attempt_created(self):
        attempt = self.create_attempt(
            payment_method=Payment.PaymentMethod.BANK_TRANSFER,
            transaction_id="BANK-REF-123",
        )

        self.assertEqual(
            attempt.payment_method,
            Payment.PaymentMethod.BANK_TRANSFER,
        )
        self.assertEqual(
            attempt.transaction_id,
            "BANK-REF-123",
        )

    def test_invalid_payment_method_rejected(self):
        with self.assertRaises(ValidationError):
            self.create_attempt(
                payment_method="INVALID",
            )

    def test_order_cannot_be_paid_by_another_customer(self):
        with self.assertRaises(ValidationError):
            PaymentService.initiate_attempt(
                order_id=self.order.id,
                user=self.other_customer,
                payment_method=Payment.PaymentMethod.CASH,
                idempotency_key="unauthorized-key",
            )

    def test_idempotent_request_returns_existing_attempt(self):
        first = self.create_attempt()

        second = self.create_attempt()

        self.assertEqual(first.id, second.id)

        self.assertEqual(
            PaymentAttempt.objects.filter(
                payment=self.payment
            ).count(),
            1,
        )

    def test_idempotency_key_cannot_be_reused_with_different_data(self):
        self.create_attempt()

        with self.assertRaises(ValidationError):
            self.create_attempt(
                payment_method=Payment.PaymentMethod.BANK_TRANSFER,
                idempotency_key="payment-test-key-001",
                transaction_id="BANK-REF-123",
            )

    def test_new_attempt_gets_incremented_attempt_number(self):
        first = self.create_attempt()

        PaymentService.mark_attempt_failed(
            attempt_id=first.id,
            admin_user=self.admin,
            failure_reason="Cash collection failed.",
        )

        second = self.create_attempt(
            idempotency_key="payment-test-key-002",
        )

        self.assertEqual(first.attempt_number, 1)
        self.assertEqual(second.attempt_number, 2)

    # -----------------------------------------
    # PAYMENT SUCCESS TESTS
    # -----------------------------------------

    def test_admin_can_verify_payment_success(self):
        attempt = self.create_attempt()

        verified = PaymentService.mark_attempt_success(
            attempt_id=attempt.id,
            admin_user=self.admin,
        )

        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            verified.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PAID,
        )

    def test_success_cancels_other_initiated_attempts(self):
        first = self.create_attempt()

        second = self.create_attempt(
            idempotency_key="payment-test-key-002",
        )

        PaymentService.mark_attempt_success(
            attempt_id=first.id,
            admin_user=self.admin,
        )

        second.refresh_from_db()

        self.assertEqual(
            second.status,
            PaymentAttempt.AttemptStatus.CANCELLED,
        )

    def test_successful_attempt_cannot_be_verified_again(self):
        attempt = self.create_attempt()

        PaymentService.mark_attempt_success(
            attempt_id=attempt.id,
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            PaymentService.mark_attempt_success(
                attempt_id=attempt.id,
                admin_user=self.admin,
            )

    # -----------------------------------------
    # PAYMENT FAILURE TESTS
    # -----------------------------------------

    def test_attempt_can_be_marked_failed(self):
        attempt = self.create_attempt()

        failed = PaymentService.mark_attempt_failed(
            attempt_id=attempt.id,
            admin_user=self.admin,
            failure_reason="Payment not received.",
        )

        self.payment.refresh_from_db()
        self.inventory.refresh_from_db()

        self.assertEqual(
            failed.status,
            PaymentAttempt.AttemptStatus.FAILED,
        )

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )

        # Individual attempt failure must not restore stock.
        self.assertEqual(self.inventory.quantity, 7)

    def test_failed_attempt_can_be_retried(self):
        first = self.create_attempt()

        PaymentService.mark_attempt_failed(
            attempt_id=first.id,
            admin_user=self.admin,
            failure_reason="First attempt failed.",
        )

        second = self.create_attempt(
            idempotency_key="payment-test-key-002",
        )

        self.assertEqual(second.attempt_number, 2)
        self.assertEqual(
            second.status,
            PaymentAttempt.AttemptStatus.INITIATED,
        )

    def test_final_failure_rejected_while_attempt_is_active(self):
        self.create_attempt()

        with self.assertRaises(ValidationError):
            PaymentService.finalize_payment_failure(
                payment_id=self.payment.id,
                admin_user=self.admin,
                failure_reason="Payment failed.",
            )

    def test_final_failure_rejected_after_successful_attempt(self):
        attempt = self.create_attempt()

        PaymentService.mark_attempt_success(
            attempt_id=attempt.id,
            admin_user=self.admin,
        )

        with self.assertRaises(ValidationError):
            PaymentService.finalize_payment_failure(
                payment_id=self.payment.id,
                admin_user=self.admin,
                failure_reason="Payment failed.",
            )

    # -----------------------------------------
    # INVENTORY RESTORATION TESTS
    # -----------------------------------------

    def test_final_failure_restores_inventory(self):
        attempt = self.create_attempt()

        PaymentService.mark_attempt_failed(
            attempt_id=attempt.id,
            admin_user=self.admin,
            failure_reason="Payment not received.",
        )

        failed_payment = PaymentService.finalize_payment_failure(
            payment_id=self.payment.id,
            admin_user=self.admin,
            failure_reason="All payment attempts failed.",
        )

        self.inventory.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            failed_payment.status,
            Payment.PaymentStatus.FAILED,
        )

        self.assertEqual(
            self.order.status,
            Order.OrderStatus.CANCELLED,
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.FAILED,
        )

        self.assertEqual(self.inventory.quantity, 10)

        self.assertIsNotNone(self.order.stock_restored_at)

        self.assertEqual(
            StockMovement.objects.filter(
                inventory=self.inventory,
                movement_type=StockMovement.MovementType.INCREASE,
            ).count(),
            1,
        )

    def test_final_failure_is_idempotent(self):
        attempt = self.create_attempt()

        PaymentService.mark_attempt_failed(
            attempt_id=attempt.id,
            admin_user=self.admin,
            failure_reason="Payment failed.",
        )

        first = PaymentService.finalize_payment_failure(
            payment_id=self.payment.id,
            admin_user=self.admin,
            failure_reason="Final failure.",
        )

        second = PaymentService.finalize_payment_failure(
            payment_id=self.payment.id,
            admin_user=self.admin,
            failure_reason="Repeated request.",
        )

        self.inventory.refresh_from_db()

        self.assertEqual(first.id, second.id)
        self.assertEqual(self.inventory.quantity, 10)

        self.assertEqual(
            StockMovement.objects.filter(
                inventory=self.inventory,
                movement_type=StockMovement.MovementType.INCREASE,
            ).count(),
            1,
        )

    def test_final_failure_records_order_status_history(self):
        attempt = self.create_attempt()

        PaymentService.mark_attempt_failed(
            attempt_id=attempt.id,
            admin_user=self.admin,
        )

        PaymentService.finalize_payment_failure(
            payment_id=self.payment.id,
            admin_user=self.admin,
            failure_reason="Payment failed.",
        )

        self.assertTrue(
            OrderStatusHistory.objects.filter(
                order=self.order,
                new_status=Order.OrderStatus.CANCELLED,
            ).exists()
        )


class PaymentAPITests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="payment_api_customer",
            email="payment_api_customer@example.com",
            password="TestPassword123!",
        )

        self.other_customer = User.objects.create_user(
            username="payment_api_other",
            email="payment_api_other@example.com",
            password="TestPassword123!",
        )

        self.admin = User.objects.create_superuser(
            username="payment_api_admin",
            email="payment_api_admin@example.com",
            password="AdminPassword123!",
        )
        
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.admin.groups.add(admin_group)

        self.category = Category.objects.create(
            name="Payment API Category",
        )

        self.product = Product.objects.create(
            name="Payment API Product",
            sku="PAY-API-001",
            category=self.category,
            retail_price=Decimal("100.00"),
            selling_modes=["RETAIL"],
            retail_moq=1,
        )

        self.inventory = Inventory.objects.create(
            product=self.product,
            quantity=10,
        )

        # Simulate stock deduction during order creation.
        InventoryService.decrease_stock(
            product=self.product,
            quantity=3,
            reason="Order stock reservation",
            created_by=self.customer,
        )

        self.order = Order.objects.create(
            order_number="ORD-PAY-API-001",
            user=self.customer,
            shipping_full_name="API Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("300.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("300.00"),
            status=Order.OrderStatus.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
            stock_deducted_at=timezone.now(),
        )

        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            product_sku=self.product.sku,
            purchase_mode=OrderItem.PurchaseMode.RETAIL,
            quantity=3,
            unit_price=Decimal("100.00"),
            subtotal=Decimal("300.00"),
        )

        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("300.00"),
            status=Payment.PaymentStatus.PENDING,
        )

        self.client = APIClient()

        self.attempts_url = "/api/v1/payments/attempts/"
        self.payment_url = (
            f"/api/v1/payments/orders/{self.order.id}/"
        )

    def authenticate_customer(self):
        self.client.force_authenticate(user=self.customer)

    def authenticate_other_customer(self):
        self.client.force_authenticate(user=self.other_customer)

    def authenticate_admin(self):
        self.client.force_authenticate(user=self.admin)

    def create_cash_attempt(self):
        self.authenticate_customer()

        return self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.CASH,
                "idempotency_key": "api-cash-payment-001",
            },
            format="json",
        )

    # =================================================
    # PAYMENT ATTEMPT CREATION
    # =================================================

    def test_customer_can_create_cash_payment_attempt(self):
        response = self.create_cash_attempt()

        self.assertEqual(response.status_code, 201)

        self.assertEqual(
            response.data["attempt"]["payment_method"],
            Payment.PaymentMethod.CASH,
        )

        self.assertEqual(
            response.data["attempt"]["status"],
            PaymentAttempt.AttemptStatus.INITIATED,
        )

    def test_customer_can_create_bank_transfer_attempt(self):
        self.authenticate_customer()

        response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.BANK_TRANSFER,
                "transaction_id": "BANK-REF-API-001",
                "idempotency_key": "api-bank-payment-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertEqual(
            response.data["attempt"]["transaction_id"],
            "BANK-REF-API-001",
        )

    def test_bank_transfer_requires_transaction_reference(self):
        self.authenticate_customer()

        response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.BANK_TRANSFER,
                "idempotency_key": "api-bank-payment-002",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_payment_method_is_rejected(self):
        self.authenticate_customer()

        response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": "INVALID",
                "idempotency_key": "api-invalid-payment-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    # =================================================
    # AUTHENTICATION AND OWNERSHIP
    # =================================================

    def test_unauthenticated_user_cannot_create_payment_attempt(self):
        response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.CASH,
                "idempotency_key": "api-unauth-payment-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_customer_cannot_create_attempt_for_another_customers_order(self):
        self.authenticate_other_customer()

        response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.CASH,
                "idempotency_key": "api-other-payment-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_customer_can_view_own_payment(self):
        self.authenticate_customer()

        response = self.client.get(self.payment_url)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["order"],
            self.order.id,
        )

    def test_customer_cannot_view_another_customers_payment(self):
        self.authenticate_other_customer()

        response = self.client.get(self.payment_url)

        self.assertEqual(response.status_code, 404)

    # =================================================
    # ADMIN PAYMENT VERIFICATION
    # =================================================

    def test_customer_cannot_verify_payment(self):
        attempt_response = self.create_cash_attempt()

        attempt_id = attempt_response.data["attempt"]["id"]

        self.authenticate_customer()

        response = self.client.post(
            f"{self.attempts_url}{attempt_id}/verify/",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_can_verify_payment(self):
        attempt_response = self.create_cash_attempt()

        attempt_id = attempt_response.data["attempt"]["id"]

        self.authenticate_admin()

        response = self.client.post(
            f"{self.attempts_url}{attempt_id}/verify/",
        )
        
        print("RESPONSE STATUS:", response.status_code)
        print("RESPONSE DATA:", response.data)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["attempt"]["status"],
            PaymentAttempt.AttemptStatus.SUCCESS,
        )

        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PAID,
        )

    # =================================================
    # PAYMENT FAILURE AND RETRY
    # =================================================

    def test_admin_can_mark_payment_attempt_failed(self):
        attempt_response = self.create_cash_attempt()

        attempt_id = attempt_response.data["attempt"]["id"]

        self.authenticate_admin()

        response = self.client.post(
            f"{self.attempts_url}{attempt_id}/fail/",
            {
                "failure_reason": "Cash payment not received.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["attempt"]["status"],
            PaymentAttempt.AttemptStatus.FAILED,
        )

    def test_customer_can_retry_after_failed_attempt(self):
        first_response = self.create_cash_attempt()

        first_attempt_id = first_response.data["attempt"]["id"]

        self.authenticate_admin()

        self.client.post(
            f"{self.attempts_url}{first_attempt_id}/fail/",
            {
                "failure_reason": "First attempt failed.",
            },
            format="json",
        )

        self.authenticate_customer()

        second_response = self.client.post(
            self.attempts_url,
            {
                "order_id": self.order.id,
                "payment_method": Payment.PaymentMethod.CASH,
                "idempotency_key": "api-cash-payment-002",
            },
            format="json",
        )

        self.assertEqual(second_response.status_code, 201)

        self.assertEqual(
            second_response.data["attempt"]["attempt_number"],
            2,
        )

    # =================================================
    # FINAL PAYMENT FAILURE AND INVENTORY
    # =================================================

    def test_admin_can_finalize_payment_failure_and_restore_stock(self):
        attempt_response = self.create_cash_attempt()

        attempt_id = attempt_response.data["attempt"]["id"]

        self.authenticate_admin()

        self.client.post(
            f"{self.attempts_url}{attempt_id}/fail/",
            {
                "failure_reason": "Payment not received.",
            },
            format="json",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/finalize-failure/",
            {
                "failure_reason": "All payment attempts failed.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.inventory.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.FAILED,
        )

        self.assertEqual(
            self.order.status,
            Order.OrderStatus.CANCELLED,
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.FAILED,
        )

        self.assertEqual(self.inventory.quantity, 10)

        self.assertIsNotNone(self.order.stock_restored_at)
        
        
@override_settings(RAZORPAY_WEBHOOK_SECRET="test_webhook_secret")
class RazorpayWebhookTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="razorpay_customer",
            email="razorpay@example.com",
            password="TestPassword123!",
        )

        self.order = Order.objects.create(
            order_number="ORD-RAZORPAY-001",
            user=self.customer,
            shipping_full_name="Test Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("300.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("300.00"),
            status=Order.OrderStatus.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=Payment.PaymentStatus.PENDING,
            amount=Decimal("300.00"),
            gateway_order_id="order_razorpay_001",
        )

        self.attempt = PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="razorpay-test-key-001",
            gateway_order_id="order_razorpay_001",
        )

        self.client = APIClient()
        self.url = "/api/v1/payments/webhooks/razorpay/"

    def build_payload(
        self,
        event_type="payment.captured",
        payment_id="pay_razorpay_001",
        amount=30000,
        payment_status="captured",
        order_id="order_razorpay_001",
    ):
        return {
            "event": event_type,
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "order_id": order_id,
                        "amount": amount,
                        "currency": "INR",
                        "status": payment_status,
                        "error_description": (
                            "Payment failed for testing"
                            if payment_status == "failed"
                            else ""
                        ),
                    }
                }
            },
        }

    def post_webhook(self, payload, event_id="event_test_001"):
        raw_body = json.dumps(
            payload,
            separators=(",", ":"),
        ).encode("utf-8")

        signature = hmac.new(
            b"test_webhook_secret",
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        return self.client.post(
            self.url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
            HTTP_X_RAZORPAY_EVENT_ID=event_id,
        )

    def test_payment_captured_successfully(self):
        response = self.post_webhook(
            self.build_payload()
        )

        self.assertEqual(response.status_code, 200)

        self.attempt.refresh_from_db()
        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.attempt.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )
        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )
        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PAID,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.get().status,
            PaymentWebhookEvent.ProcessingStatus.PROCESSED,
        )

    def test_payment_failed_does_not_finalize_order(self):
        payload = self.build_payload(
            event_type="payment.failed",
            payment_status="failed",
        )

        response = self.post_webhook(payload)

        self.assertEqual(response.status_code, 200)

        self.attempt.refresh_from_db()
        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.attempt.status,
            PaymentAttempt.AttemptStatus.FAILED,
        )
        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )
        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PENDING,
        )

    def test_invalid_webhook_signature_is_rejected(self):
        payload = self.build_payload()

        raw_body = json.dumps(
            payload,
            separators=(",", ":"),
        ).encode("utf-8")

        response = self.client.post(
            self.url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE="invalid_signature",
            HTTP_X_RAZORPAY_EVENT_ID="event_invalid_001",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(PaymentWebhookEvent.objects.count(), 0)

    def test_duplicate_webhook_event_is_not_processed_twice(self):
        payload = self.build_payload()

        first_response = self.post_webhook(
            payload,
            event_id="event_duplicate_001",
        )

        second_response = self.post_webhook(
            payload,
            event_id="event_duplicate_001",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)

        self.assertEqual(PaymentWebhookEvent.objects.count(), 1)

        self.attempt.refresh_from_db()

        self.assertEqual(
            self.attempt.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )

    def test_amount_mismatch_is_rejected(self):
        payload = self.build_payload(amount=29999)

        response = self.post_webhook(
            payload,
            event_id="event_amount_mismatch_001",
        )

        self.assertEqual(response.status_code, 500)

        self.attempt.refresh_from_db()
        self.payment.refresh_from_db()

        self.assertEqual(
            self.attempt.status,
            PaymentAttempt.AttemptStatus.INITIATED,
        )
        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )

        event = PaymentWebhookEvent.objects.get(
            event_id="event_amount_mismatch_001"
        )

        self.assertEqual(
            event.status,
            PaymentWebhookEvent.ProcessingStatus.FAILED,
        )

    def test_failed_webhook_can_be_retried(self):
        event_id = "event_retry_001"

        # First request: incorrect amount.
        first_response = self.post_webhook(
            self.build_payload(amount=29999),
            event_id=event_id,
        )

        self.assertEqual(first_response.status_code, 500)

        # Second request: corrected amount, same event ID.
        second_response = self.post_webhook(
            self.build_payload(),
            event_id=event_id,
        )

        self.assertEqual(second_response.status_code, 200)

        self.attempt.refresh_from_db()
        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.attempt.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )
        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )
        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PAID,
        )

        self.assertEqual(PaymentWebhookEvent.objects.count(), 1)

    def test_unsupported_event_is_ignored(self):
        payload = {
            "event": "order.paid",
            "payload": {},
        }

        response = self.post_webhook(
            payload,
            event_id="event_unsupported_001",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(PaymentWebhookEvent.objects.count(), 0)
        
@override_settings(
    RAZORPAY_KEY_ID="rzp_test_123456",
    RAZORPAY_KEY_SECRET="test_secret_123456",
)
class RazorpayCheckoutTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username="checkout_customer",
            email="checkout@example.com",
            password="TestPassword123!",
        )
        
        self.other_customer = User.objects.create_user(
            username="checkout_other_customer",
            email="checkout_other@example.com",
            password="TestPassword123!",
        )

        self.order = Order.objects.create(
            order_number="ORD-CHECKOUT-001",
            user=self.customer,
            shipping_full_name="Test Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="Test Address",
            shipping_city="Surat",
            shipping_state="Gujarat",
            shipping_pincode="395007",
            subtotal=Decimal("300.00"),
            shipping_charge=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("300.00"),
            status=Order.OrderStatus.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=Payment.PaymentStatus.PENDING,
            amount=Decimal("300.00"),
        )

    @patch("apps.payments.services.razorpay.Client")
    def test_create_razorpay_order_successfully(self, mock_client):
        mock_client.return_value.order.create.return_value = {
            "id": "order_created_001"
        }

        attempt = PaymentService.create_razorpay_order(
            order_id=self.order.id,
            user=self.customer,
            idempotency_key="checkout-key-001",
        )

        self.assertEqual(
            attempt.status,
            PaymentAttempt.AttemptStatus.INITIATED,
        )

        self.assertEqual(
            attempt.payment_method,
            Payment.PaymentMethod.RAZORPAY,
        )

        self.assertEqual(
            attempt.gateway_order_id,
            "order_created_001",
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.gateway_order_id,
            "order_created_001",
        )

        mock_client.return_value.order.create.assert_called_once()

    @patch("apps.payments.services.razorpay.Client")
    def test_create_razorpay_order_uses_amount_in_paise(
        self, mock_client
    ):
        mock_client.return_value.order.create.return_value = {
            "id": "order_created_002"
        }

        PaymentService.create_razorpay_order(
            order_id=self.order.id,
            user=self.customer,
            idempotency_key="checkout-key-002",
        )

        call_data = (
            mock_client.return_value.order.create.call_args.kwargs["data"]
        )

        self.assertEqual(call_data["amount"], 30000)
        self.assertEqual(call_data["currency"], "INR")

    @patch("apps.payments.services.razorpay.Client")
    def test_duplicate_idempotency_key_returns_existing_attempt(
        self, mock_client
    ):
        mock_client.return_value.order.create.return_value = {
            "id": "order_created_003"
        }

        first_attempt = PaymentService.create_razorpay_order(
            order_id=self.order.id,
            user=self.customer,
            idempotency_key="checkout-duplicate-001",
        )

        second_attempt = PaymentService.create_razorpay_order(
            order_id=self.order.id,
            user=self.customer,
            idempotency_key="checkout-duplicate-001",
        )

        self.assertEqual(first_attempt.id, second_attempt.id)

        mock_client.return_value.order.create.assert_called_once()

        self.assertEqual(PaymentAttempt.objects.count(), 1)

    @patch("apps.payments.services.razorpay.Client")
    @override_settings(
        RAZORPAY_KEY_ID="",
        RAZORPAY_KEY_SECRET="",
    )
    def test_create_order_rejects_missing_razorpay_config(
        self, mock_client
    ):
        with self.assertRaises(ValidationError):
            PaymentService.create_razorpay_order(
                order_id=self.order.id,
                user=self.customer,
                idempotency_key="checkout-config-001",
            )

        self.assertEqual(PaymentAttempt.objects.count(), 0)
        mock_client.assert_not_called()

    @patch("apps.payments.services.razorpay.Client")
    def test_create_order_rejects_mismatched_payment_amount(
        self, mock_client
    ):
        self.payment.amount = Decimal("200.00")
        self.payment.save()

        with self.assertRaises(ValidationError):
            PaymentService.create_razorpay_order(
                order_id=self.order.id,
                user=self.customer,
                idempotency_key="checkout-mismatch-001",
            )

        self.assertEqual(PaymentAttempt.objects.count(), 0)

    @patch("apps.payments.services.razorpay.Client")
    def test_verify_razorpay_payment_successfully(self, mock_client):
        attempt = PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="verify-key-001",
            gateway_order_id="order_verify_001",
        )

        self.payment.gateway_order_id = "order_verify_001"
        self.payment.save()

        mock_client.return_value.payment.fetch.return_value = {
            "id": "pay_verify_001",
            "order_id": "order_verify_001",
            "amount": 30000,
            "currency": "INR",
            "status": "captured",
        }

        verified_attempt = PaymentService.verify_razorpay_payment(
            razorpay_order_id="order_verify_001",
            razorpay_payment_id="pay_verify_001",
            razorpay_signature="valid_test_signature",
            user=self.customer,
        )

        self.assertEqual(verified_attempt.id, attempt.id)

        attempt.refresh_from_db()
        self.payment.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            attempt.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.SUCCESS,
        )

        self.assertEqual(
            self.payment.gateway_payment_id,
            "pay_verify_001",
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PAID,
        )

        mock_client.return_value.utility.verify_payment_signature.assert_called_once()
        
    @patch("apps.payments.services.razorpay.Client")
    def test_customer_cannot_verify_another_customers_payment(
        self, mock_client
    ):
        attempt = PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="verify-owner-security-001",
            gateway_order_id="order_owner_001",
        )

        self.payment.gateway_order_id = "order_owner_001"
        self.payment.save()

        mock_client.return_value.payment.fetch.return_value = {
            "id": "pay_owner_001",
            "order_id": "order_owner_001",
            "amount": 30000,
            "currency": "INR",
            "status": "captured",
        }

        with self.assertRaises(ValidationError):
            PaymentService.verify_razorpay_payment(
                razorpay_order_id="order_owner_001",
                razorpay_payment_id="pay_owner_001",
                razorpay_signature="valid_test_signature",
                user=self.other_customer,
            )

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        attempt.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )

        self.assertEqual(
            self.order.payment_status,
            Order.PaymentStatus.PENDING,
        )

        self.assertEqual(
            attempt.status,
            PaymentAttempt.AttemptStatus.INITIATED,
        )

    @patch("apps.payments.services.razorpay.Client")
    def test_verify_rejects_invalid_signature(self, mock_client):
        mock_client.return_value.utility.verify_payment_signature.side_effect = (
            Exception("Invalid signature")
        )

        with self.assertRaises(ValidationError):
            PaymentService.verify_razorpay_payment(
                razorpay_order_id="order_invalid_001",
                razorpay_payment_id="pay_invalid_001",
                razorpay_signature="invalid_signature",
                user=self.customer,
            )

        self.assertEqual(PaymentAttempt.objects.count(), 0)

    @patch("apps.payments.services.razorpay.Client")
    def test_verify_rejects_uncaptured_payment(self, mock_client):
        PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="verify-uncaptured-001",
            gateway_order_id="order_uncaptured_001",
        )

        self.payment.gateway_order_id = "order_uncaptured_001"
        self.payment.save()

        mock_client.return_value.payment.fetch.return_value = {
            "id": "pay_uncaptured_001",
            "order_id": "order_uncaptured_001",
            "amount": 30000,
            "currency": "INR",
            "status": "authorized",
        }

        with self.assertRaises(ValidationError):
            PaymentService.verify_razorpay_payment(
                razorpay_order_id="order_uncaptured_001",
                razorpay_payment_id="pay_uncaptured_001",
                razorpay_signature="valid_test_signature",
                user=self.customer,
            )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )

    @patch("apps.payments.services.razorpay.Client")
    def test_verify_rejects_amount_mismatch(self, mock_client):
        PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="verify-amount-001",
            gateway_order_id="order_amount_001",
        )

        self.payment.gateway_order_id = "order_amount_001"
        self.payment.save()

        mock_client.return_value.payment.fetch.return_value = {
            "id": "pay_amount_001",
            "order_id": "order_amount_001",
            "amount": 29999,
            "currency": "INR",
            "status": "captured",
        }

        with self.assertRaises(ValidationError):
            PaymentService.verify_razorpay_payment(
                razorpay_order_id="order_amount_001",
                razorpay_payment_id="pay_amount_001",
                razorpay_signature="valid_test_signature",
                user=self.customer,
            )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.PaymentStatus.PENDING,
        )

    @patch("apps.payments.services.razorpay.Client")
    def test_duplicate_payment_verification_is_idempotent(
        self, mock_client
    ):
        attempt = PaymentAttempt.objects.create(
            payment=self.payment,
            attempt_number=1,
            payment_method=Payment.PaymentMethod.RAZORPAY,
            status=PaymentAttempt.AttemptStatus.INITIATED,
            idempotency_key="verify-duplicate-001",
            gateway_order_id="order_duplicate_001",
        )

        self.payment.gateway_order_id = "order_duplicate_001"
        self.payment.save()

        mock_client.return_value.payment.fetch.return_value = {
            "id": "pay_duplicate_001",
            "order_id": "order_duplicate_001",
            "amount": 30000,
            "currency": "INR",
            "status": "captured",
        }

        first = PaymentService.verify_razorpay_payment(
            "order_duplicate_001",
            "pay_duplicate_001",
            "valid_signature",
            user=self.customer,
            
        )

        second = PaymentService.verify_razorpay_payment(
            "order_duplicate_001",
            "pay_duplicate_001",
            "valid_signature",
            user=self.customer,
        )

        self.assertEqual(first.id, second.id)

        attempt.refresh_from_db()

        self.assertEqual(
            attempt.status,
            PaymentAttempt.AttemptStatus.SUCCESS,
        )