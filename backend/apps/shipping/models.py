import uuid

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class ShippingQuote(models.Model):

    class Status(models.TextChoices):
        QUOTED = "QUOTED", "Quoted"
        USED = "USED", "Used"
        EXPIRED = "EXPIRED", "Expired"
        FAILED = "FAILED", "Failed"

    # Unique quote identifier
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Customer
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shipping_quotes"
    )

    # Address and cart snapshots
    address_snapshot = models.JSONField()
    cart_snapshot = models.JSONField()

    # Pickup and delivery
    pickup_postcode = models.CharField(max_length=10)
    delivery_postcode = models.CharField(max_length=10)

    # Package specifications
    package_weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(0.001)]
    )

    package_length = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )

    package_breadth = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )

    package_height = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Selected courier
    courier_id = models.CharField(max_length=50)
    courier_name = models.CharField(max_length=150)

    # Shipping amount
    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    estimated_delivery_days = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    # Original Shiprocket response
    shiprocket_response = models.JSONField(default=dict, blank=True)

    # Quote lifecycle
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.QUOTED,
        db_index=True
    )

    expires_at = models.DateTimeField(db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["user", "status", "expires_at"],
                name="shipping_quote_lookup_idx"
            )
        ]

        verbose_name = "Shipping Quote"
        verbose_name_plural = "Shipping Quotes"

    def __str__(self):
        return (
            f"Shipping Quote - {self.user} - "
            f"{self.shipping_charge}"
        )
        
class Shipment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CREATING = "CREATING", "Creating"
        CREATED = "CREATED", "Created"
        AWB_ASSIGNING = "AWB_ASSIGNING", "AWB Assigning"
        AWB_ASSIGNED = "AWB_ASSIGNED", "AWB Assigned"
        PICKUP_SCHEDULED = "PICKUP_SCHEDULED", "Pickup Scheduled"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        DELIVERED = "DELIVERED", "Delivered"
        RTO = "RTO", "Return to Origin"
        CANCELLED = "CANCELLED", "Cancelled"
        FAILED = "FAILED", "Failed"
        

    # Internal order and shipping quote
    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="shipment",
    )

    shipping_quote = models.OneToOneField(
        ShippingQuote,
        on_delete=models.PROTECT,
        related_name="shipment",
    )

    # Shiprocket identifiers
    shiprocket_order_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    shiprocket_shipment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    awb_code = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    # Courier details
    courier_company_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    courier_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )
    
    # Package specifications (entered by admin)
    package_length = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.01)],
    )

    package_breadth = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.01)],
    )

    package_height = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.01)],
    )

    package_weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.001)],
    )

    # Shipment documents and tracking
    label_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
    )

    tracking_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
    )

    # Shipment lifecycle
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    pickup_scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # API responses for audit and troubleshooting
    raw_create_response = models.JSONField(
        default=dict,
        blank=True,
    )

    raw_awb_response = models.JSONField(
        default=dict,
        blank=True,
    )

    raw_tracking_response = models.JSONField(
        default=dict,
        blank=True,
    )

    # Retry and error handling
    attempt_count = models.PositiveIntegerField(default=0)

    last_attempt_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_error = models.TextField(
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "created_at"],
                name="shipment_status_date_idx",
            ),
        ]

    def __str__(self):
        return f"Shipment - {self.order.order_number}"