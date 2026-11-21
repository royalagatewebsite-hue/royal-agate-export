from django.contrib import admin
from .models import Shipment, ShippingQuote


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "status",
        "awb_code",
        "courier_name",
        "created_at",
    )

    list_filter = ("status", "created_at")
    search_fields = (
        "order__order_number",
        "awb_code",
        "shiprocket_shipment_id",
    )
    readonly_fields = (
        "shiprocket_order_id",
        "shiprocket_shipment_id",
        "awb_code",
        "raw_create_response",
        "raw_awb_response",
        "raw_tracking_response",
        "created_at",
        "updated_at",
    )


@admin.register(ShippingQuote)
class ShippingQuoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "shipping_charge",
        "created_at",
    )

    list_filter = ("status", "created_at")

    search_fields = (
        "user__email",
        "courier_name",
        "pickup_postcode",
        "delivery_postcode",
    )

    readonly_fields = (
        "id",
        "shiprocket_response",
        "created_at",
        "updated_at",
    )