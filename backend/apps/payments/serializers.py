from decimal import Decimal

from rest_framework import serializers

from .models import Payment, PaymentAttempt, Refund


# =====================================================
# PAYMENT ATTEMPT CREATE SERIALIZER
# =====================================================

class PaymentAttemptCreateSerializer(serializers.Serializer):

    order_id = serializers.IntegerField(min_value=1)

    payment_method = serializers.ChoiceField(
        choices=[
            Payment.PaymentMethod.CASH,
            Payment.PaymentMethod.BANK_TRANSFER,
        ]
    )

    idempotency_key = serializers.CharField(
        max_length=100,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    transaction_id = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        payment_method = attrs["payment_method"]
        transaction_id = attrs.get("transaction_id", "")

        if (
            payment_method == Payment.PaymentMethod.BANK_TRANSFER
            and not transaction_id
        ):
            raise serializers.ValidationError({
                "transaction_id": (
                    "Bank transfer transaction reference is required."
                )
            })

        return attrs
    
# =====================================================
# RAZORPAY ORDER CREATE SERIALIZER
# =====================================================

class RazorpayOrderCreateSerializer(serializers.Serializer):

    order_id = serializers.IntegerField(min_value=1)

    idempotency_key = serializers.CharField(
        max_length=100,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )
    
# =====================================================
# RAZORPAY PAYMENT VERIFY SERIALIZER
# =====================================================

class RazorpayPaymentVerifySerializer(serializers.Serializer):

    razorpay_order_id = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    razorpay_payment_id = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    razorpay_signature = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )


# =====================================================
# PAYMENT ATTEMPT SERIALIZER
# =====================================================

class PaymentAttemptSerializer(serializers.ModelSerializer):

    class Meta:
        model = PaymentAttempt

        fields = (
            "id",
            "attempt_number",
            "payment_method",
            "status",
            "transaction_id",
            "failure_reason",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields


# =====================================================
# PAYMENT DETAIL SERIALIZER
# =====================================================

class PaymentDetailSerializer(serializers.ModelSerializer):

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    order_status = serializers.CharField(
        source="order.status",
        read_only=True,
    )

    order_payment_status = serializers.CharField(
        source="order.payment_status",
        read_only=True,
    )

    attempts = PaymentAttemptSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Payment

        fields = (
            "id",
            "order",
            "order_number",
            "order_status",
            "order_payment_status",
            "payment_method",
            "status",
            "amount",
            "transaction_id",
            "failure_reason",
            "attempts",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields


# =====================================================
# PAYMENT ATTEMPT FAILURE SERIALIZER
# =====================================================

class PaymentAttemptFailSerializer(serializers.Serializer):

    failure_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
        trim_whitespace=True,
    )


# =====================================================
# PAYMENT FAILURE FINALIZATION SERIALIZER
# =====================================================

class PaymentFailureFinalizeSerializer(serializers.Serializer):

    failure_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
        trim_whitespace=True,
    )


# =====================================================
# EXISTING REFUND SERIALIZERS
# =====================================================

class RefundCreateSerializer(serializers.Serializer):

    payment_id = serializers.IntegerField()

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    refund_method = serializers.ChoiceField(
        choices=Refund.RefundMethod.choices,
    )

    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )


class RefundSerializer(serializers.ModelSerializer):

    order_number = serializers.CharField(
        source="payment.order.order_number",
        read_only=True,
    )

    payment_amount = serializers.DecimalField(
        source="payment.amount",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    payment_status = serializers.CharField(
        source="payment.status",
        read_only=True,
    )

    class Meta:
        model = Refund

        fields = (
            "id",
            "payment",
            "order_number",
            "payment_amount",
            "payment_status",
            "amount",
            "refund_method",
            "status",
            "transaction_reference",
            "admin_note",
            "processed_by",
            "completed_at",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields


class RefundCompleteSerializer(serializers.Serializer):

    transaction_reference = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=255,
        trim_whitespace=True,
    )

    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )


class RefundFailSerializer(serializers.Serializer):

    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )