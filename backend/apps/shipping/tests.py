from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.test import APIClient

from apps.orders.models import Order, OrderItem
from apps.payments.models import CheckoutPaymentSession
from apps.shipping.models import ShippingQuote, Shipment
from apps.shipping.services import ShippingService



User = get_user_model()


class ShippingServiceTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="shipping_customer",
            email="customer@example.com",
            password="StrongPassword@123",
        )
        self.order = Order.objects.create(
            order_number="RA-SHIP-0001",
            user=self.customer,
            shipping_full_name="Test Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="123 Test Street",
            shipping_city="Ahmedabad",
            shipping_state="Gujarat",
            shipping_pincode="380001",
            shipping_country="India",
            subtotal=Decimal("200.00"),
            shipping_charge=Decimal("50.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("250.00"),
            status=Order.OrderStatus.CONFIRMED,
            payment_status=Order.PaymentStatus.PAID,
        )
        OrderItem.objects.create(
            order=self.order,
            product=None,
            product_name="Ruby Stone",
            product_sku="RUBY-001",
            purchase_mode="RETAIL",
            quantity=2,
            unit_price=Decimal("100.00"),
            subtotal=Decimal("200.00"),
        )
        self.quote = ShippingQuote.objects.create(
            user=self.customer,
            address_snapshot={"pincode": "380001"},
            cart_snapshot={"items": []},
            pickup_postcode="388620",
            delivery_postcode="380001",
            package_weight=Decimal("1.000"),
            courier_id="123",
            courier_name="Test Courier",
            shipping_charge=Decimal("50.00"),
            status=ShippingQuote.Status.USED,
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )
        self.session = CheckoutPaymentSession.objects.create(
            user=self.customer,
            address_snapshot={"pincode": "380001"},
            checkout_snapshot={"shipping_quote_id": str(self.quote.id)},
            amount=Decimal("250.00"),
            status=CheckoutPaymentSession.SessionStatus.SUCCESS,
            idempotency_key="shipping-test-session-1",
            order=self.order,
        )

    def package_data(self):
        return {
            "package_length": Decimal("20.00"),
            "package_breadth": Decimal("15.00"),
            "package_height": Decimal("10.00"),
            "package_weight": Decimal("1.250"),
        }

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_create_shipment_success_saves_shiprocket_response(self, mock_request):
        mock_request.return_value = {
            "order_id": 98765,
            "shipment_id": 87654,
        }

        shipment = ShippingService.create_shipment(
            order_id=self.order.id,
            **self.package_data(),
        )

        self.assertEqual(shipment.status, Shipment.Status.CREATED)
        self.assertEqual(shipment.shiprocket_order_id, "98765")
        self.assertEqual(shipment.shiprocket_shipment_id, "87654")
        self.assertEqual(shipment.package_weight, Decimal("1.250"))
        self.assertEqual(shipment.raw_create_response, mock_request.return_value)
        mock_request.assert_called_once()
        self.assertEqual(mock_request.call_args.args[:2], ("POST", "orders/create/adhoc"))
        self.assertEqual(mock_request.call_args.kwargs["json"]["weight"], "1.250")

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_create_shipment_api_failure_keeps_creating_to_prevent_duplicate(self, mock_request):
        mock_request.side_effect = APIException("Shiprocket unavailable")

        with self.assertRaises(APIException):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        shipment = Shipment.objects.get(order=self.order)
        self.assertEqual(shipment.status, Shipment.Status.CREATING)
        self.assertIn("Shiprocket unavailable", shipment.last_error)
        self.assertEqual(shipment.attempt_count, 1)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_incomplete_shiprocket_response_requires_reconciliation(self, mock_request):
        mock_request.return_value = {"order_id": 123}

        with self.assertRaises(APIException):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        shipment = Shipment.objects.get(order=self.order)
        self.assertEqual(shipment.status, Shipment.Status.CREATING)
        self.assertEqual(shipment.raw_create_response, {"order_id": 123})
        self.assertIn("Manual reconciliation", shipment.last_error)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_existing_created_shipment_is_returned_without_duplicate_api_call(self, mock_request):
        existing = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_order_id="111",
            shiprocket_shipment_id="222",
            status=Shipment.Status.CREATED,
            **self.package_data(),
        )

        result = ShippingService.create_shipment(
            order_id=self.order.id,
            **self.package_data(),
        )

        self.assertEqual(result.pk, existing.pk)
        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_existing_creating_shipment_blocks_retry(self, mock_request):
        Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            status=Shipment.Status.CREATING,
            **self.package_data(),
        )

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_failed_shipment_blocks_automatic_retry(self, mock_request):
        Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            status=Shipment.Status.FAILED,
            **self.package_data(),
        )

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_unconfirmed_order_is_rejected(self, mock_request):
        self.order.status = Order.OrderStatus.PENDING
        self.order.save(update_fields=["status"])

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_unpaid_order_is_rejected(self, mock_request):
        self.order.payment_status = Order.PaymentStatus.PENDING
        self.order.save(update_fields=["payment_status"])

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_order_with_restored_stock_is_rejected(self, mock_request):
        self.order.stock_restored_at = timezone.now()
        self.order.save(update_fields=["stock_restored_at"])

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_missing_checkout_session_is_rejected(self, mock_request):
        self.session.delete()

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_non_successful_checkout_session_is_rejected(self, mock_request):
        self.session.status = CheckoutPaymentSession.SessionStatus.FAILED
        self.session.save(update_fields=["status"])

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_quote_must_be_used(self, mock_request):
        self.quote.status = ShippingQuote.Status.QUOTED
        self.quote.save(update_fields=["status"])

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(
                order_id=self.order.id,
                **self.package_data(),
            )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_invalid_package_dimensions_are_rejected(self, mock_request):
        data = self.package_data()
        data["package_length"] = Decimal("0")

        with self.assertRaises(ValidationError):
            ShippingService.create_shipment(order_id=self.order.id, **data)

        self.assertFalse(Shipment.objects.filter(order=self.order).exists())
        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_assign_awb_success(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_order_id="111",
            shiprocket_shipment_id="222",
            status=Shipment.Status.CREATED,
            **self.package_data(),
        )
        mock_request.return_value = {
            "response": {
                "data": {
                    "awb_code": "AWB123456",
                    "courier_company_id": 123,
                    "courier_name": "Test Courier",
                }
            }
        }

        result = ShippingService.assign_awb(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(result.pk, shipment.pk)
        self.assertEqual(shipment.awb_code, "AWB123456")
        self.assertEqual(shipment.status, Shipment.Status.AWB_ASSIGNED)
        self.assertEqual(shipment.courier_name, "Test Courier")
        self.assertEqual(shipment.raw_awb_response, mock_request.return_value)
        mock_request.assert_called_once_with(
            "POST",
            "courier/assign/awb",
            json={"shipment_id": "222", "courier_id": "123"},
        )

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_awb_api_failure_keeps_assigning_state(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            status=Shipment.Status.CREATED,
            **self.package_data(),
        )
        mock_request.side_effect = APIException("Shiprocket unavailable")

        with self.assertRaises(APIException):
            ShippingService.assign_awb(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(shipment.status, Shipment.Status.AWB_ASSIGNING)
        self.assertIn("Shiprocket unavailable", shipment.last_error)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_awb_missing_from_response_requires_reconciliation(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            status=Shipment.Status.CREATED,
            **self.package_data(),
        )
        mock_request.return_value = {"response": {"data": {}}}

        with self.assertRaises(APIException):
            ShippingService.assign_awb(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(shipment.status, Shipment.Status.AWB_ASSIGNING)
        self.assertEqual(shipment.raw_awb_response, mock_request.return_value)
        self.assertIn("AWB code missing", shipment.last_error)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_awb_already_assigned_is_idempotent(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            awb_code="AWB-EXISTING",
            status=Shipment.Status.AWB_ASSIGNED,
            **self.package_data(),
        )

        result = ShippingService.assign_awb(self.order.id)

        self.assertEqual(result.pk, shipment.pk)
        self.assertEqual(result.awb_code, "AWB-EXISTING")
        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_awb_assigning_state_blocks_duplicate_attempt(self, mock_request):
        Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            status=Shipment.Status.AWB_ASSIGNING,
            **self.package_data(),
        )

        with self.assertRaises(ValidationError):
            ShippingService.assign_awb(self.order.id)

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_awb_requires_created_shipment(self, mock_request):
        Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            status=Shipment.Status.PENDING,
            **self.package_data(),
        )

        with self.assertRaises(ValidationError):
            ShippingService.assign_awb(self.order.id)

        mock_request.assert_not_called()
        
    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_generate_label_success(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            awb_code="AWB123",
            status=Shipment.Status.AWB_ASSIGNED,
            **self.package_data(),
        )

        mock_request.return_value = {
            "label_url": "https://example.com/label.pdf"
        }

        result = ShippingService.generate_label(self.order.id)

        self.assertEqual(result.pk, shipment.pk)
        self.assertEqual(
            result.label_url,
            "https://example.com/label.pdf"
        )

        mock_request.assert_called_once_with(
            "POST",
            "courier/generate/label",
            json={"shipment_id": ["222"]}
        )

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_generate_label_returns_existing_label(self, mock_request):
        shipment = Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            awb_code="AWB123",
            label_url="https://example.com/existing.pdf",
            status=Shipment.Status.AWB_ASSIGNED,
            **self.package_data(),
        )

        result = ShippingService.generate_label(self.order.id)

        self.assertEqual(result.pk, shipment.pk)
        self.assertEqual(
            result.label_url,
            "https://example.com/existing.pdf"
        )

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_generate_label_requires_awb_assignment(self, mock_request):
        Shipment.objects.create(
            order=self.order,
            shipping_quote=self.quote,
            shiprocket_shipment_id="222",
            status=Shipment.Status.CREATED,
            **self.package_data(),
        )

        with self.assertRaises(ValidationError):
            ShippingService.generate_label(self.order.id)

        mock_request.assert_not_called()


    def create_tracking_shipment(self, **overrides):
        data = {
            "order": self.order,
            "shipping_quote": self.quote,
            "shiprocket_order_id": "111",
            "shiprocket_shipment_id": "222",
            "awb_code": "AWB123456",
            "status": Shipment.Status.AWB_ASSIGNED,
            **self.package_data(),
        }
        data.update(overrides)
        return Shipment.objects.create(**data)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_track_shipment_success_saves_response_status_and_url(self, mock_request):
        shipment = self.create_tracking_shipment()
        tracking_response = {
            "tracking_data": {
                "shipment_status": 7,
                "track_url": "https://example.com/track/AWB123456",
                "shipment_track": [{"current_status": "Delivered"}],
            }
        }
        mock_request.return_value = tracking_response

        result = ShippingService.track_shipment(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(result.pk, shipment.pk)
        self.assertEqual(shipment.status, Shipment.Status.DELIVERED)
        self.assertEqual(shipment.tracking_url, tracking_response["tracking_data"]["track_url"])
        self.assertEqual(shipment.raw_tracking_response, tracking_response)
        mock_request.assert_called_once_with(
            "GET",
            "courier/track/awb/AWB123456",
        )

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_track_shipment_unknown_status_preserves_current_status(self, mock_request):
        shipment = self.create_tracking_shipment()
        tracking_response = {
            "tracking_data": {
                "shipment_status": 999,
                "track_url": "https://example.com/track/AWB123456",
            }
        }
        mock_request.return_value = tracking_response

        ShippingService.track_shipment(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(shipment.status, Shipment.Status.AWB_ASSIGNED)
        self.assertEqual(shipment.raw_tracking_response, tracking_response)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_tracking_does_not_downgrade_delivered_shipment(self, mock_request):
        shipment = self.create_tracking_shipment(
            status=Shipment.Status.DELIVERED,
        )
        mock_request.return_value = {
            "tracking_data": {
                "shipment_status": 6,
                "track_url": "https://example.com/track/AWB123456",
            }
        }

        ShippingService.track_shipment(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(shipment.status, Shipment.Status.DELIVERED)

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_tracking_rejects_shipment_without_awb(self, mock_request):
        self.create_tracking_shipment(awb_code="")

        with self.assertRaises(ValidationError):
            ShippingService.track_shipment(self.order.id)

        mock_request.assert_not_called()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_tracking_rejects_empty_tracking_data(self, mock_request):
        shipment = self.create_tracking_shipment()
        mock_request.return_value = {"tracking_data": {}}

        with self.assertRaises(APIException):
            ShippingService.track_shipment(self.order.id)

        shipment.refresh_from_db()
        self.assertEqual(shipment.raw_tracking_response, {})
        mock_request.assert_called_once()

    @patch("apps.shipping.services.ShiprocketClient.request")
    def test_tracking_api_failure_is_propagated(self, mock_request):
        self.create_tracking_shipment()
        mock_request.side_effect = APIException("Shiprocket unavailable")

        with self.assertRaises(APIException):
            ShippingService.track_shipment(self.order.id)

        mock_request.assert_called_once()


class ShippingAPITests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="api_customer",
            email="api-customer@example.com",
            password="StrongPassword@123",
        )
        self.admin = User.objects.create_user(
            username="shipping_admin",
            email="admin@example.com",
            password="StrongPassword@123",
        )
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.admin.groups.add(admin_group)

        self.order = Order.objects.create(
            order_number="RA-API-SHIP-0001",
            user=self.customer,
            shipping_full_name="API Customer",
            shipping_phone_number="9876543210",
            shipping_address_line_1="123 Test Street",
            shipping_city="Ahmedabad",
            shipping_state="Gujarat",
            shipping_pincode="380001",
            shipping_country="India",
            subtotal=Decimal("200.00"),
            shipping_charge=Decimal("50.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("250.00"),
            status=Order.OrderStatus.CONFIRMED,
            payment_status=Order.PaymentStatus.PAID,
        )

    def test_admin_create_shipment_endpoint_calls_service(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        expected = type("ShipmentResult", (), {
            "shiprocket_shipment_id": "222",
            "shiprocket_order_id": "111",
            "status": Shipment.Status.CREATED,
            "package_length": Decimal("20.00"),
            "package_breadth": Decimal("15.00"),
            "package_height": Decimal("10.00"),
            "package_weight": Decimal("1.250"),
        })()

        with patch("apps.shipping.views.ShippingService.create_shipment", return_value=expected) as service:
            response = self.client.post(
                f"/api/v1/shipping/orders/{self.order.id}/create/",
                {
                    "package_length": "20.00",
                    "package_breadth": "15.00",
                    "package_height": "10.00",
                    "package_weight": "1.250",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 201)
        service.assert_called_once()

    def test_customer_cannot_create_shipment(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.customer)

        with patch("apps.shipping.views.ShippingService.create_shipment") as service:
            response = self.client.post(
                f"/api/v1/shipping/orders/{self.order.id}/create/",
                {
                    "package_length": "20.00",
                    "package_breadth": "15.00",
                    "package_height": "10.00",
                    "package_weight": "1.250",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 403)
        service.assert_not_called()

    def test_invalid_package_data_is_rejected_by_endpoint(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        with patch("apps.shipping.views.ShippingService.create_shipment") as service:
            response = self.client.post(
                f"/api/v1/shipping/orders/{self.order.id}/create/",
                {
                    "package_length": "0",
                    "package_breadth": "15.00",
                    "package_height": "10.00",
                    "package_weight": "1.250",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 400)
        service.assert_not_called()

    def test_unauthenticated_user_cannot_create_shipment(self):
        response = APIClient().post(
            f"/api/v1/shipping/orders/{self.order.id}/create/",
            {
                "package_length": "20.00",
                "package_breadth": "15.00",
                "package_height": "10.00",
                "package_weight": "1.250",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)
