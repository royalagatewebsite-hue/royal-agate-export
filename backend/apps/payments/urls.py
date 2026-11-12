from django.urls import path

from .views import (
    # Payment views
    PaymentAttemptCreateView,
    PaymentDetailView,
    PaymentAttemptVerifyView,
    PaymentAttemptFailView,
    PaymentFailureFinalizeView,
    RazorpayWebhookView,
    RazorpayOrderCreateView,
    RazorpayPaymentVerifyView,

    # Refund views
    RefundListCreateView,
    RefundProcessView,
    RefundCompleteView,
    RefundFailView,
)

app_name = "payments"

urlpatterns = [
    # ==========================================
    # CUSTOMER PAYMENT ENDPOINTS
    # ==========================================

    path(
        "attempts/",
        PaymentAttemptCreateView.as_view(),
        name="payment-attempt-create",
    ),
    
    path(
        "razorpay/create-order/",
        RazorpayOrderCreateView.as_view(),
        name="razorpay-create-order",
    ),

    path(
        "razorpay/verify/",
        RazorpayPaymentVerifyView.as_view(),
        name="razorpay-payment-verify",
    ),

    path(
        "orders/<int:order_id>/",
        PaymentDetailView.as_view(),
        name="payment-detail",
    ),
    
    path(
        "webhooks/razorpay/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),

    # ==========================================
    # ADMIN PAYMENT ENDPOINTS
    # ==========================================

    path(
        "attempts/<int:pk>/verify/",
        PaymentAttemptVerifyView.as_view(),
        name="payment-attempt-verify",
    ),

    path(
        "attempts/<int:pk>/fail/",
        PaymentAttemptFailView.as_view(),
        name="payment-attempt-fail",
    ),

    path(
        "<int:payment_id>/finalize-failure/",
        PaymentFailureFinalizeView.as_view(),
        name="payment-finalize-failure",
    ),

    # ==========================================
    # REFUND ENDPOINTS
    # ==========================================

    path(
        "refunds/",
        RefundListCreateView.as_view(),
        name="refund-list-create",
    ),

    path(
        "refunds/<int:pk>/process/",
        RefundProcessView.as_view(),
        name="refund-process",
    ),

    path(
        "refunds/<int:pk>/complete/",
        RefundCompleteView.as_view(),
        name="refund-complete",
    ),

    path(
        "refunds/<int:pk>/fail/",
        RefundFailView.as_view(),
        name="refund-fail",
    ),
]