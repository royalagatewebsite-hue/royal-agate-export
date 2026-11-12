from decimal import Decimal
from django.conf import settings

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        RAZORPAY = "RAZORPAY", "Razorpay"
        CASH = "CASH", "Cash"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        OTHER = "OTHER", "Other"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payments"
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    transaction_id = models.CharField(
        max_length=255,
        blank=True
    )

    gateway_order_id = models.CharField(
        max_length=255,
        blank=True
    )

    gateway_payment_id = models.CharField(
        max_length=255,
        blank=True
    )

    failure_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["order", "-created_at"],
                name="payment_order_created_idx"
            ),
            models.Index(
                fields=["status"],
                name="payment_status_idx"
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name="payment_amount_gt_0"
            ),
        ]

        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment - {self.order.order_number}"
    

class PaymentAttempt(models.Model):

    class AttemptStatus(models.TextChoices):
        INITIATED = "INITIATED", "Initiated"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="attempts",
    )

    attempt_number = models.PositiveIntegerField()

    payment_method = models.CharField(
        max_length=30,
        choices=Payment.PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=AttemptStatus.choices,
        default=AttemptStatus.INITIATED,
    )

    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
    )

    transaction_id = models.CharField(
        max_length=255,
        blank=True,
    )

    gateway_order_id = models.CharField(
        max_length=255,
        blank=True,
    )

    gateway_payment_id = models.CharField(
        max_length=255,
        blank=True,
    )

    failure_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["payment", "attempt_number"],
                name="unique_payment_attempt_number",
            ),
            models.UniqueConstraint(
                fields=["gateway_payment_id"],
                condition=~Q(gateway_payment_id=""),
                name="unique_attempt_gateway_payment",
            ),
        ]

        indexes = [
            models.Index(
                fields=["payment", "-created_at"],
                name="attempt_payment_created_idx",
            ),
            models.Index(
                fields=["status"],
                name="attempt_status_idx",
            ),
        ]

    def __str__(self):
        return (
            f"Payment {self.payment_id} - "
            f"Attempt #{self.attempt_number}"
        )


    
class Refund(models.Model):

    class RefundMethod(models.TextChoices):
        UPI = "UPI", "UPI"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

    class RefundStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="refunds",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    refund_method = models.CharField(
        max_length=20,
        choices=RefundMethod.choices,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=RefundStatus.choices,
        default=RefundStatus.PENDING,
    )

    transaction_reference = models.CharField(
        max_length=255,
        blank=True,
    )

    admin_note = models.TextField(blank=True)

    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_refunds",
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["payment", "-created_at"],
                name="refund_payment_created_idx",
            ),
            models.Index(
                fields=["status"],
                name="refund_status_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name="refund_amount_gt_0",
            ),
        ]

        verbose_name = "Refund"
        verbose_name_plural = "Refunds"

    def __str__(self):
        return f"Refund - {self.payment.order.order_number}"
    
class PaymentWebhookEvent(models.Model):

    class ProcessingStatus(models.TextChoices):
        RECEIVED = "RECEIVED", "Received"
        PROCESSED = "PROCESSED", "Processed"
        FAILED = "FAILED", "Failed"

    event_id = models.CharField(
        max_length=255,
        unique=True,
    )

    event_type = models.CharField(
        max_length=100,
    )

    payload = models.JSONField(
        default=dict,
    )

    status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.RECEIVED,
    )

    error_message = models.TextField(
        blank=True,
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status"],
                name="webhook_event_status_idx",
            ),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.event_id}"