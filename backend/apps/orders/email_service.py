import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


def _send_single_notification(order, notification_type):
    from apps.orders.models import OrderEmailNotification

    # Create or retrieve the unique notification record.
    notification, created = OrderEmailNotification.objects.get_or_create(
        order=order,
        notification_type=notification_type,
    )

    # Atomically claim the notification before sending.
    with transaction.atomic():
        notification = (
            OrderEmailNotification.objects
            .select_for_update()
            .get(pk=notification.pk)
        )

        if notification.status in [
            OrderEmailNotification.NotificationStatus.SENT,
            OrderEmailNotification.NotificationStatus.SENDING,
        ]:
            logger.info(
                "Skipping %s notification for order %s. Status: %s",
                notification_type,
                order.order_number,
                notification.status,
            )
            return

        notification.status = (
            OrderEmailNotification.NotificationStatus.SENDING
        )
        notification.attempts += 1
        notification.last_error = ""

        notification.save(
            update_fields=[
                "status",
                "attempts",
                "last_error",
                "updated_at",
            ]
        )

    try:
        context = {
            "order": order,
            "items": order.items.all(),
        }

        if notification_type == OrderEmailNotification.NotificationType.ADMIN:
            recipient = settings.ADMIN_NOTIFICATION_EMAIL
            template = "emails/admin_new_order.html"
            subject = f"New Order Received - {order.order_number}"
            body = f"New order received: {order.order_number}"

        else:
            recipient = getattr(order.user, "email", None)

            if not recipient:
                raise ValueError("Customer email address is missing.")

            template = "emails/customer_order_confirmation.html"
            subject = f"Order Confirmation - {order.order_number}"
            body = f"Your order {order.order_number} has been received."

        html_content = render_to_string(template, context)

        message = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )

        message.attach_alternative(html_content, "text/html")
        message.send(fail_silently=False)

        OrderEmailNotification.objects.filter(
            pk=notification.pk,
            status=OrderEmailNotification.NotificationStatus.SENDING,
        ).update(
            status=OrderEmailNotification.NotificationStatus.SENT,
            sent_at=timezone.now(),
            last_error="",
        )

        logger.info(
            "%s notification sent for order %s",
            notification_type,
            order.order_number,
        )

    except Exception as exc:
        OrderEmailNotification.objects.filter(
            pk=notification.pk,
        ).update(
            status=OrderEmailNotification.NotificationStatus.FAILED,
            last_error=str(exc)[:2000],
        )

        logger.exception(
            "Failed to send %s notification for order %s",
            notification_type,
            order.order_number,
        )


def send_order_emails(order_id):
    from apps.orders.models import Order, OrderEmailNotification

    try:
        order = (
            Order.objects
            .select_related("user")
            .prefetch_related("items")
            .get(pk=order_id)
        )

        _send_single_notification(
            order,
            OrderEmailNotification.NotificationType.ADMIN,
        )

        _send_single_notification(
            order,
            OrderEmailNotification.NotificationType.CUSTOMER,
        )

    except Exception:
        logger.exception(
            "Failed to process order notifications for order ID %s",
            order_id,
        )