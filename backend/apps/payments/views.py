from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from apps.accounts.permissions import IsAdmin

from .models import Payment, Refund
from .serializers import (
    PaymentAttemptCreateSerializer,
    PaymentAttemptSerializer,
    PaymentDetailSerializer,
    PaymentAttemptFailSerializer,
    PaymentFailureFinalizeSerializer,
    RefundCreateSerializer,
    RefundSerializer,
    RefundCompleteSerializer,
    RefundFailSerializer,
    RazorpayOrderCreateSerializer,
    RazorpayPaymentVerifySerializer,
)
from .services import PaymentService, RefundService

from rest_framework.permissions import AllowAny

from .webhooks import (
    WebhookVerificationError,
    verify_webhook_signature,
    parse_webhook_payload,
    extract_payment_entity,
)


# =========================================================
# CUSTOMER PAYMENT APIs
# =========================================================

class PaymentAttemptCreateView(APIView):
    """
    Customer initiates a Cash or Bank Transfer payment attempt.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentAttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = PaymentService.initiate_attempt(
            order_id=serializer.validated_data["order_id"],
            user=request.user,
            payment_method=serializer.validated_data["payment_method"],
            idempotency_key=serializer.validated_data["idempotency_key"],
            transaction_id=serializer.validated_data.get("transaction_id", ""),
        )

        return Response(
            {
                "message": "Payment attempt created successfully.",
                "attempt": PaymentAttemptSerializer(attempt).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentDetailView(APIView):
    """
    Customer can retrieve payment details for their own order.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        payment = (
            Payment.objects
            .select_related("order")
            .prefetch_related("attempts")
            .filter(
                order_id=order_id,
                order__user=request.user,
            )
            .first()
        )

        if payment is None:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PaymentDetailSerializer(payment)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RazorpayOrderCreateView(APIView):
    """
    Creates a Razorpay order for an authenticated customer's order.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RazorpayOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = PaymentService.create_razorpay_order(
            order_id=serializer.validated_data["order_id"],
            user=request.user,
            idempotency_key=serializer.validated_data["idempotency_key"],
        )

        amount_in_paise = int(attempt.payment.amount * 100)

        return Response(
            {
                "message": "Razorpay order created successfully.",
                "key_id": settings.RAZORPAY_KEY_ID,
                "razorpay_order_id": attempt.gateway_order_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "attempt": PaymentAttemptSerializer(attempt).data,
            },
            status=status.HTTP_201_CREATED,
        )
        
class RazorpayPaymentVerifyView(APIView):
    """
    Verifies Razorpay payment for the authenticated customer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RazorpayPaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = PaymentService.verify_razorpay_payment(
            razorpay_order_id=serializer.validated_data[
                "razorpay_order_id"
            ],
            razorpay_payment_id=serializer.validated_data[
                "razorpay_payment_id"
            ],
            razorpay_signature=serializer.validated_data[
                "razorpay_signature"
            ],
            user=request.user,
        )

        return Response(
            {
                "message": "Razorpay payment verified successfully.",
                "attempt": PaymentAttemptSerializer(attempt).data,
            },
            status=status.HTTP_200_OK,
        )
    


# =========================================================
# ADMIN PAYMENT APIs
# =========================================================

class PaymentAttemptVerifyView(APIView):
    """
    Admin verifies a payment attempt as successful.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        attempt = PaymentService.mark_attempt_success(
            attempt_id=pk,
            admin_user=request.user,
        )

        return Response(
            {
                "message": "Payment attempt verified successfully.",
                "attempt": PaymentAttemptSerializer(attempt).data,
            },
            status=status.HTTP_200_OK,
        )


class PaymentAttemptFailView(APIView):
    """
    Admin marks an individual payment attempt as failed.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        serializer = PaymentAttemptFailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = PaymentService.mark_attempt_failed(
            attempt_id=pk,
            admin_user=request.user,
            failure_reason=serializer.validated_data.get(
                "failure_reason", ""
            ),
        )

        return Response(
            {
                "message": "Payment attempt marked as failed.",
                "attempt": PaymentAttemptSerializer(attempt).data,
            },
            status=status.HTTP_200_OK,
        )


class PaymentFailureFinalizeView(APIView):
    """
    Admin finalizes payment failure and restores deducted inventory.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, payment_id):
        serializer = PaymentFailureFinalizeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = PaymentService.finalize_payment_failure(
            payment_id=payment_id,
            admin_user=request.user,
            failure_reason=serializer.validated_data.get(
                "failure_reason", ""
            ),
        )

        return Response(
            {
                "message": "Payment failure finalized successfully.",
                "payment": PaymentDetailSerializer(payment).data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# REFUND APIs
# =========================================================

class RefundListCreateView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        refunds = (
            Refund.objects
            .select_related(
                "payment",
                "payment__order",
                "processed_by",
            )
            .all()
        )

        serializer = RefundSerializer(refunds, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = RefundCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund = RefundService.create_refund(
            payment_id=serializer.validated_data["payment_id"],
            amount=serializer.validated_data["amount"],
            refund_method=serializer.validated_data["refund_method"],
            admin_user=request.user,
            admin_note=serializer.validated_data.get("admin_note", ""),
        )

        return Response(
            {
                "message": "Refund created successfully.",
                "refund": RefundSerializer(refund).data,
            },
            status=status.HTTP_201_CREATED,
        )


class RefundProcessView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        refund = RefundService.start_refund(
            refund_id=pk,
            admin_user=request.user,
        )

        return Response(
            {
                "message": "Refund moved to processing.",
                "refund": RefundSerializer(refund).data,
            },
            status=status.HTTP_200_OK,
        )


class RefundCompleteView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        serializer = RefundCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund = RefundService.complete_refund(
            refund_id=pk,
            transaction_reference=serializer.validated_data[
                "transaction_reference"
            ],
            admin_user=request.user,
            admin_note=serializer.validated_data.get("admin_note"),
        )

        return Response(
            {
                "message": "Refund completed successfully.",
                "refund": RefundSerializer(refund).data,
            },
            status=status.HTTP_200_OK,
        )


class RefundFailView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        serializer = RefundFailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund = RefundService.fail_refund(
            refund_id=pk,
            admin_user=request.user,
            admin_note=serializer.validated_data.get("admin_note", ""),
        )

        return Response(
            {
                "message": "Refund marked as failed.",
                "refund": RefundSerializer(refund).data,
            },
            status=status.HTTP_200_OK,
        )
        
class RazorpayWebhookView(APIView):
    """
    Handles Razorpay webhook events securely.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        # 1. Get raw request body.
        payload = request.body

        # 2. Get Razorpay signature.
        signature = request.headers.get(
            "X-Razorpay-Signature",
            "",
        )

        # 3. Verify webhook signature.
        try:
            verify_webhook_signature(
                payload=payload,
                signature=signature,
            )

            event_data = parse_webhook_payload(payload)

        except WebhookVerificationError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Ignore unsupported events.
        event_type = event_data.get("event")

        if event_type not in [
            "payment.captured",
            "payment.failed",
        ]:
            return Response(
                {
                    "message": "Event ignored.",
                    "event": event_type,
                },
                status=status.HTTP_200_OK,
            )

        # 5. Get Razorpay event ID.
        event_id = request.headers.get(
            "X-Razorpay-Event-Id",
            "",
        )

        if not event_id:
            return Response(
                {"detail": "Webhook event ID is missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 6. Extract payment information.
        try:
            payment_entity = extract_payment_entity(event_data)

        except WebhookVerificationError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 7. Process event.
        result = PaymentService.process_razorpay_webhook(
            event_id=event_id,
            event_data=event_data,
            payment_entity=payment_entity,
        )

        # 8. Return failure so Razorpay can retry.
        if not result["processed"]:
            return Response(
                {
                    "detail": "Webhook processing failed."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Webhook processed successfully.",
                "duplicate": result["duplicate"],
            },
            status=status.HTTP_200_OK,
        )