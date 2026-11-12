import hashlib
import hmac
import json

from django.conf import settings


class WebhookVerificationError(Exception):
    """Raised when Razorpay webhook verification fails."""
    pass


def verify_webhook_signature(payload, signature):
    """
    Verify Razorpay webhook signature using HMAC-SHA256.
    """

    webhook_secret = getattr(
        settings,
        "RAZORPAY_WEBHOOK_SECRET",
        "",
    )

    if not webhook_secret:
        raise WebhookVerificationError(
            "Razorpay webhook secret is not configured."
        )

    if not signature:
        raise WebhookVerificationError(
            "Webhook signature is missing."
        )

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        signature,
    ):
        raise WebhookVerificationError(
            "Invalid Razorpay webhook signature."
        )

    return True


def parse_webhook_payload(payload):
    """
    Parse and validate Razorpay webhook JSON payload.
    """

    try:
        event_data = json.loads(payload)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise WebhookVerificationError(
            "Invalid webhook JSON payload."
        )

    if not isinstance(event_data, dict):
        raise WebhookVerificationError(
            "Invalid webhook payload structure."
        )

    event_type = event_data.get("event")

    if not event_type:
        raise WebhookVerificationError(
            "Webhook event type is missing."
        )

    return event_data


def extract_payment_entity(event_data):
    """
    Extract payment entity from Razorpay webhook payload.
    """

    try:
        payment_entity = (
            event_data["payload"]["payment"]["entity"]
        )
    except (KeyError, TypeError):
        raise WebhookVerificationError(
            "Payment entity is missing from webhook payload."
        )

    if not isinstance(payment_entity, dict):
        raise WebhookVerificationError(
            "Invalid payment entity."
        )

    required_fields = [
        "id",
        "order_id",
        "amount",
        "currency",
    ]

    for field in required_fields:
        if payment_entity.get(field) is None:
            raise WebhookVerificationError(
                f"Payment entity is missing {field}."
            )

    return payment_entity