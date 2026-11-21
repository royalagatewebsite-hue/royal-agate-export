from django.urls import path

from apps.shipping.views import (
    ShippingQuoteView,
    AdminCreateShipmentView,
    AdminAssignAWBView,
    AdminGenerateLabelView,
    AdminRefreshTrackingView,
)

urlpatterns = [
    path(
        "quote/",
        ShippingQuoteView.as_view(),
        name="shipping-quote",
    ),

    path(
        "orders/<int:order_id>/create/",
        AdminCreateShipmentView.as_view(),
        name="admin-create-shipment",
    ),

    path(
        "orders/<int:order_id>/assign-awb/",
        AdminAssignAWBView.as_view(),
        name="admin-assign-awb",
    ),
    
    path(
        "orders/<int:order_id>/generate-label/",
        AdminGenerateLabelView.as_view(),
        name="admin-generate-label",
    ),
    
    path(
        "orders/<int:order_id>/refresh-tracking/",
        AdminRefreshTrackingView.as_view(),
        name="admin-refresh-tracking",
    ),
]