from decimal import Decimal, ROUND_UP
from apps.shipping.clients import ShiprocketClient
from rest_framework.exceptions import ValidationError

from django.db import transaction
from rest_framework.exceptions import APIException

from apps.shipping.models import ShippingQuote, Shipment

from datetime import timedelta

from django.utils import timezone

from apps.cart.services import CartService


class ShippingService:

    PICKUP_POSTCODE = "388620"

    @staticmethod
    def calculate_total_weight(checkout_data):
        total_weight_kg = Decimal("0.000")

        for item_data in checkout_data["items"]:
            cart_item = item_data["cart_item"]
            product = cart_item.product

            if product.weight is None:
                raise ValidationError({
                    "shipping": (
                        f"Weight is missing for product: {product.name}"
                    )
                })

            product_weight = Decimal(str(product.weight))
            if product_weight <= 0:
                raise ValidationError({
                    "shipping": f"Invalid weight for product: {product.name}"
                })

            if product.weight_unit == "g":
                product_weight /= Decimal("1000")

            elif product.weight_unit != "kg":
                raise ValidationError({
                    "shipping": (
                        f"Invalid weight unit for product: {product.name}"
                    )
                })

            total_weight_kg += (
                product_weight * cart_item.quantity
            )

        if total_weight_kg <= 0:
            raise ValidationError({
                "shipping": "Invalid shipment weight."
            })

        return total_weight_kg.quantize(
            Decimal("0.001"),
            rounding=ROUND_UP
        )
    
    @staticmethod
    def get_shipping_rates(delivery_postcode, weight):
        """
        Fetch live prepaid shipping rates from Shiprocket.
        """

        if not delivery_postcode or not str(delivery_postcode).isdigit():
            raise ValidationError({
                "shipping": "Invalid delivery pincode."
            })

        if len(str(delivery_postcode)) != 6:
            raise ValidationError({
                "shipping": "Delivery pincode must be 6 digits."
            })

        if weight <= 0:
            raise ValidationError({
                "shipping": "Invalid package weight."
            })

        params = {
            "pickup_postcode": ShippingService.PICKUP_POSTCODE,
            "delivery_postcode": str(delivery_postcode),
            "weight": str(weight),
            "cod": 0,
        }

        response = ShiprocketClient.request(
            "GET",
            "courier/serviceability/",
            params=params,
        )

        courier_data = (
            response.get("data", {})
            .get("available_courier_companies", [])
        )

        if not courier_data:
            raise ValidationError({
                "shipping": (
                    "No courier service is available for this destination."
                )
            })

        rates = []

        for courier in courier_data:
            rate = courier.get("rate")
            courier_id = courier.get("courier_company_id")

            if rate is None or not courier_id:
                continue

            rates.append({
                "courier_id": str(courier_id),
                "courier_name": courier.get("courier_name"),
                "shipping_charge": str(rate),
                "estimated_delivery_days": courier.get(
                    "estimated_delivery_days"
                ),
                "rating": courier.get("rating"),
            })

        if not rates:
            raise ValidationError({
                "shipping": "No valid courier rates were returned."
            })

        return sorted(
            rates,
            key=lambda courier: Decimal(courier["shipping_charge"])
        )
        
    @staticmethod
    def create_quote(user, address_id):
        """
        Validate checkout, fetch live Shiprocket rates
        and create a customer-specific shipping quote.
        """

        # 1. Validate cart and customer address.
        checkout_data = CartService.validate_checkout(
            user=user,
            address_id=address_id,
        )

        address = checkout_data["address"]

        # 2. Calculate total product weight.
        weight = ShippingService.calculate_total_weight(
            checkout_data
        )

        # 3. Fetch live Shiprocket courier rates.
        rates = ShippingService.get_shipping_rates(
            delivery_postcode=address.pincode,
            weight=weight,
        )

        # 4. Select the cheapest available courier.
        selected_courier = rates[0]

        # 5. Create permanent address snapshot.
        address_snapshot = {
            "address_id": address.id,
            "full_name": address.full_name,
            "phone_number": address.phone_number,
            "address_line_1": address.address_line_1,
            "district": address.district,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "country": address.country,
        }

        # 6. Create cart snapshot.
        cart_items_snapshot = []

        for item_data in checkout_data["items"]:
            cart_item = item_data["cart_item"]
            product = cart_item.product

            cart_items_snapshot.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "purchase_mode": cart_item.purchase_mode,
                "quantity": cart_item.quantity,
                "unit_price": str(item_data["unit_price"]),
                "subtotal": str(item_data["subtotal"]),
            })

        cart_snapshot = {
            "items": cart_items_snapshot,
            "total_items": checkout_data["total_items"],
            "subtotal": str(checkout_data["subtotal"]),
        }

        # 7. Save shipping quote.
        quote = ShippingQuote.objects.create(
            user=user,
            address_snapshot=address_snapshot,
            cart_snapshot=cart_snapshot,
            pickup_postcode=ShippingService.PICKUP_POSTCODE,
            delivery_postcode=address.pincode,
            package_weight=weight,
            courier_id=selected_courier["courier_id"],
            courier_name=selected_courier["courier_name"],
            shipping_charge=Decimal(
                selected_courier["shipping_charge"]
            ),
            estimated_delivery_days=(
                int(selected_courier["estimated_delivery_days"])
                if selected_courier["estimated_delivery_days"]
                else None
            ),
            shiprocket_response={
                "available_couriers": rates,
                "selected_courier": selected_courier,
            },
            status=ShippingQuote.Status.QUOTED,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

        return quote
    
    @staticmethod
    def create_shipment(
        order_id,
        package_length,
        package_breadth,
        package_height,
        package_weight,
    ):
        """
        Create a Shiprocket order for an admin-confirmed,
        successfully paid order.

        External API calls are made outside database transactions.
        """

        from apps.orders.models import Order
        from apps.payments.models import CheckoutPaymentSession

        # STEP 1: Fetch and validate order.
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            raise ValidationError("Order does not exist.")

        if order.status != Order.OrderStatus.CONFIRMED:
            raise ValidationError(
                "Only confirmed orders can be shipped."
            )

        if order.payment_status != Order.PaymentStatus.PAID:
            raise ValidationError(
                "Only successfully paid orders can be shipped."
            )

        if order.stock_restored_at is not None:
            raise ValidationError(
                "Cannot ship an order whose stock has been restored."
            )

        # STEP 2: Find the original checkout session.
        try:
            checkout_session = (
                CheckoutPaymentSession.objects.get(order=order)
            )
        except CheckoutPaymentSession.DoesNotExist:
            raise ValidationError(
                "Checkout payment session not found for this order."
            )

        if checkout_session.status != (
            CheckoutPaymentSession.SessionStatus.SUCCESS
        ):
            raise ValidationError(
                "Checkout payment session is not successful."
            )

        shipping_quote_id = (
            checkout_session.checkout_snapshot.get("shipping_quote_id")
        )

        if not shipping_quote_id:
            raise ValidationError(
                "Shipping quote is missing from checkout session."
            )

        try:
            shipping_quote = ShippingQuote.objects.get(
                id=shipping_quote_id,
                user=order.user,
            )
        except ShippingQuote.DoesNotExist:
            raise ValidationError(
                "Original shipping quote could not be found."
            )

        if shipping_quote.status != ShippingQuote.Status.USED:
            raise ValidationError(
                "Shipping quote is not in USED status."
            )

        if shipping_quote.delivery_postcode != order.shipping_pincode:
            raise ValidationError(
                "Shipping quote pincode does not match the order."
            )

        # STEP 3: Validate admin-entered package specifications.
        try:
            package_length = Decimal(str(package_length))
            package_breadth = Decimal(str(package_breadth))
            package_height = Decimal(str(package_height))
            package_weight = Decimal(str(package_weight))

        except (TypeError, ValueError, ArithmeticError):
            raise ValidationError({
                "shipping": "Valid package dimensions and weight are required."
            })

        if any(value <= 0 for value in [
            package_length,
            package_breadth,
            package_height,
        ]):
            raise ValidationError({
                "shipping": "Package dimensions must be greater than zero."
            })

        if package_weight <= 0:
            raise ValidationError({
                "shipping": "Package weight must be greater than zero."
            })

        # STEP 4: Prepare order items.
        order_items = list(order.items.all())

        if not order_items:
            raise ValidationError(
                "Cannot create shipment without order items."
            )

        shiprocket_items = []

        for item in order_items:
            shiprocket_items.append({
                "name": item.product_name,
                "sku": item.product_sku,
                "units": item.quantity,
                "selling_price": str(item.unit_price),
            })

        # STEP 5: Validate customer details.
        full_name = order.shipping_full_name.strip()
        name_parts = full_name.split(maxsplit=1)

        customer_first_name = name_parts[0]
        customer_last_name = (
            name_parts[1] if len(name_parts) > 1 else ""
        )

        customer_email = (order.user.email or "").strip()

        phone = "".join(
            character
            for character in order.shipping_phone_number
            if character.isdigit()
        )

        if not customer_email:
            raise ValidationError(
                "Customer email is required for shipment creation."
            )

        if len(phone) < 10:
            raise ValidationError(
                "Valid customer phone number is required."
            )

        # STEP 6: Prepare Shiprocket payload.
        payload = {
            "order_id": order.order_number,
            "order_date": order.created_at.strftime(
                "%Y-%m-%d %H:%M"
            ),

            "billing_customer_name": customer_first_name,
            "billing_last_name": customer_last_name,
            "billing_address": order.shipping_address_line_1,
            "billing_address_2": order.shipping_address_line_2 or "",
            "billing_city": order.shipping_city,
            "billing_pincode": order.shipping_pincode,
            "billing_state": order.shipping_state,
            "billing_country": order.shipping_country,
            "billing_email": customer_email,
            "billing_phone": phone,

            "shipping_is_billing": True,

            "order_items": shiprocket_items,

            "payment_method": "Prepaid",
            "sub_total": str(order.subtotal),
            "shipping_charges": str(order.shipping_charge),
            "total_discount": str(order.discount),

            "length": str(package_length),
            "breadth": str(package_breadth),
            "height": str(package_height),
            "weight": str(package_weight),
        }
        # STEP 7: Create a shipment record safely.
        with transaction.atomic():

            locked_order = (
                Order.objects
                .select_for_update()
                .get(pk=order_id)
            )

            if locked_order.status != Order.OrderStatus.CONFIRMED:
                raise ValidationError(
                    "Order status changed. Shipment creation cancelled."
                )

            existing_shipment = (
                Shipment.objects
                .filter(order=locked_order)
                .first()
            )

            if existing_shipment:

                if existing_shipment.shiprocket_shipment_id:
                    return existing_shipment

                if existing_shipment.status == Shipment.Status.CREATING:
                    raise ValidationError(
                        "Shipment creation is already in progress "
                        "or requires reconciliation."
                    )

                if existing_shipment.status == Shipment.Status.FAILED:
                    raise ValidationError(
                        "Failed shipment requires manual reconciliation "
                        "before another creation attempt."
                    )

                raise ValidationError(
                    "Existing shipment record requires review."
                )

            shipment = Shipment.objects.create(
                order=locked_order,
                shipping_quote=shipping_quote,
                package_length=package_length,
                package_breadth=package_breadth,
                package_height=package_height,
                package_weight=package_weight,
                status=Shipment.Status.CREATING,
                attempt_count=1,
                last_attempt_at=timezone.now(),
            )

        # STEP 8: Call Shiprocket outside database transaction.
        try:
            response = ShiprocketClient.request(
                "POST",
                "orders/create/adhoc",
                json=payload,
            )

        except Exception as exc:

            # Keep CREATING because the remote API may have
            # accepted the request even if the response was lost.
            shipment.last_error = str(exc)
            shipment.save(
                update_fields=["last_error", "updated_at"]
            )

            raise

        # STEP 9: Validate Shiprocket response.
        shiprocket_order_id = response.get("order_id")
        shiprocket_shipment_id = response.get("shipment_id")

        if not shiprocket_order_id or not shiprocket_shipment_id:

            shipment.raw_create_response = response
            shipment.last_error = (
                "Shiprocket response did not contain required order "
                "and shipment identifiers. Manual reconciliation required."
            )

            shipment.save(
                update_fields=[
                    "raw_create_response",
                    "last_error",
                    "updated_at",
                ]
            )

            raise APIException(
                "Shiprocket returned an incomplete shipment response."
            )

        # STEP 10: Persist successful response.
        shipment.shiprocket_order_id = str(shiprocket_order_id)
        shipment.shiprocket_shipment_id = str(
            shiprocket_shipment_id
        )

        shipment.raw_create_response = response
        shipment.status = Shipment.Status.CREATED
        shipment.last_error = ""

        shipment.save(
            update_fields=[
                "shiprocket_order_id",
                "shiprocket_shipment_id",
                "raw_create_response",
                "status",
                "last_error",
                "updated_at",
            ]
        )

        return shipment
    
    @staticmethod
    def assign_awb(order_id):
        """
        Assign an AWB to an existing Shiprocket shipment.
        Prevents duplicate AWB assignment attempts.
        """

        # STEP 1: Lock shipment and mark AWB assignment in progress.
        with transaction.atomic():
            try:
                shipment = (
                    Shipment.objects
                    .select_for_update()
                    .select_related("shipping_quote")
                    .get(order_id=order_id)
                )
            except Shipment.DoesNotExist:
                raise ValidationError("Shipment does not exist for this order.")

            if shipment.status == Shipment.Status.AWB_ASSIGNED and shipment.awb_code:
                return shipment

            if shipment.status == Shipment.Status.AWB_ASSIGNING:
                raise ValidationError(
                    "AWB assignment is already in progress or requires manual reconciliation."
                )

            if shipment.status != Shipment.Status.CREATED:
                raise ValidationError(
                    "AWB can only be assigned to a CREATED shipment."
                )

            if not shipment.shiprocket_shipment_id:
                raise ValidationError("Shiprocket shipment ID is missing.")

            courier_id = shipment.shipping_quote.courier_id

            if not courier_id:
                raise ValidationError("Selected courier ID is missing.")

            shipment.status = Shipment.Status.AWB_ASSIGNING
            shipment.last_attempt_at = timezone.now()
            shipment.attempt_count += 1
            shipment.last_error = ""

            shipment.save(update_fields=[
                "status",
                "last_attempt_at",
                "attempt_count",
                "last_error",
                "updated_at",
            ])

        # STEP 2: Call Shiprocket outside the database transaction.
        payload = {
            "shipment_id": shipment.shiprocket_shipment_id,
            "courier_id": courier_id,
        }

        try:
            response = ShiprocketClient.request(
                "POST",
                "courier/assign/awb",
                json=payload,
            )
        except Exception as exc:
            shipment.last_error = str(exc)
            shipment.save(update_fields=["last_error", "updated_at"])
            raise

        # STEP 3: Extract AWB details.
        response_data = response.get("response", {}).get("data", {})

        if not response_data:
            response_data = response.get("data", response)

        awb_code = response_data.get("awb_code")

        if not awb_code:
            shipment.raw_awb_response = response
            shipment.last_error = (
                "AWB code missing in Shiprocket response. "
                "Manual reconciliation required."
            )
            shipment.save(update_fields=[
                "raw_awb_response",
                "last_error",
                "updated_at",
            ])

            raise APIException(
                "Shiprocket did not return an AWB code. Manual reconciliation required."
            )

        # STEP 4: Save AWB details.
        shipment.awb_code = str(awb_code)
        shipment.courier_company_id = (
            response_data.get("courier_company_id")
            or shipment.courier_company_id
        )
        shipment.courier_name = (
            response_data.get("courier_name")
            or shipment.courier_name
        )
        shipment.raw_awb_response = response
        shipment.status = Shipment.Status.AWB_ASSIGNED
        shipment.last_error = ""

        shipment.save(update_fields=[
            "awb_code",
            "courier_company_id",
            "courier_name",
            "raw_awb_response",
            "status",
            "last_error",
            "updated_at",
        ])

        return shipment
    
    @staticmethod
    def generate_label(order_id):
        """
        Generate and save the Shiprocket shipping label.
        Returns the existing label if already generated.
        """

        # STEP 1: Fetch shipment.
        try:
            shipment = Shipment.objects.get(order_id=order_id)
        except Shipment.DoesNotExist:
            raise ValidationError("Shipment does not exist for this order.")

        # STEP 2: Idempotency check.
        if shipment.label_url:
            return shipment

        # STEP 3: Validate AWB.
        if shipment.status != Shipment.Status.AWB_ASSIGNED:
            raise ValidationError(
                "Shipping label can only be generated after AWB assignment."
            )

        if not shipment.awb_code:
            raise ValidationError("AWB code is missing.")

        if not shipment.shiprocket_shipment_id:
            raise ValidationError("Shiprocket shipment ID is missing.")

        # STEP 4: Call Shiprocket API.
        try:
            response = ShiprocketClient.request(
                "POST",
                "courier/generate/label",
                json={
                    "shipment_id": [
                        str(shipment.shiprocket_shipment_id)
                    ]
                },
            )

        except Exception as exc:
            shipment.last_error = str(exc)
            shipment.save(update_fields=["last_error", "updated_at"])
            raise

        # STEP 5: Extract label URL.
        label_url = response.get("label_url")

        if not label_url:
            shipment.last_error = (
                "Label URL missing in Shiprocket response."
            )
            shipment.save(update_fields=["last_error", "updated_at"])

            raise APIException(
                "Shiprocket did not return a shipping label URL."
            )

        # STEP 6: Save label.
        shipment.label_url = label_url
        shipment.last_error = ""

        shipment.save(
            update_fields=[
                "label_url",
                "last_error",
                "updated_at",
            ]
        )

        return shipment
    
    @staticmethod
    def track_shipment(order_id):
        """
        Fetch the latest tracking details from Shiprocket
        and update the local shipment record.
        """

        try:
            shipment = Shipment.objects.get(order_id=order_id)
        except Shipment.DoesNotExist:
            raise ValidationError("Shipment does not exist for this order.")

        if not shipment.awb_code:
            raise ValidationError("AWB code is not available for this shipment.")

        # Fetch tracking details from Shiprocket.
        response = ShiprocketClient.request(
            "GET",
            f"courier/track/awb/{shipment.awb_code}",
        )

        tracking_data = response.get("tracking_data")

        if not isinstance(tracking_data, dict) or not tracking_data:
            raise APIException(
                "Shiprocket returned invalid tracking information."
            )

        # Extract shipment status.
        shiprocket_status = tracking_data.get("shipment_status")

        status_mapping = {
            # Pickup stage
            3: Shipment.Status.PICKUP_SCHEDULED,
            4: Shipment.Status.PICKUP_SCHEDULED,
            5: Shipment.Status.PICKUP_SCHEDULED,
            15: Shipment.Status.PICKUP_SCHEDULED,
            19: Shipment.Status.PICKUP_SCHEDULED,
            27: Shipment.Status.PICKUP_SCHEDULED,
            52: Shipment.Status.PICKUP_SCHEDULED,

            # Transit stage
            6: Shipment.Status.IN_TRANSIT,
            17: Shipment.Status.IN_TRANSIT,
            18: Shipment.Status.IN_TRANSIT,
            21: Shipment.Status.IN_TRANSIT,
            22: Shipment.Status.IN_TRANSIT,
            38: Shipment.Status.IN_TRANSIT,
            39: Shipment.Status.IN_TRANSIT,
            42: Shipment.Status.IN_TRANSIT,
            50: Shipment.Status.IN_TRANSIT,
            51: Shipment.Status.IN_TRANSIT,

            # Delivered
            7: Shipment.Status.DELIVERED,

            # Cancelled
            8: Shipment.Status.CANCELLED,
            45: Shipment.Status.CANCELLED,

            # Return to origin
            9: Shipment.Status.RTO,
            10: Shipment.Status.RTO,
            14: Shipment.Status.RTO,
            40: Shipment.Status.RTO,
            41: Shipment.Status.RTO,
            46: Shipment.Status.RTO,
        }

        try:
            shiprocket_status = int(shiprocket_status)
        except (TypeError, ValueError):
            shiprocket_status = None

        new_status = status_mapping.get(shiprocket_status)

        # Do not downgrade terminal shipment statuses.
        terminal_statuses = {
            Shipment.Status.DELIVERED,
            Shipment.Status.RTO,
            Shipment.Status.CANCELLED,
        }

        update_fields = ["raw_tracking_response", "last_error", "updated_at"]

        shipment.raw_tracking_response = response
        shipment.last_error = ""

        if new_status and shipment.status not in terminal_statuses:
            shipment.status = new_status
            update_fields.append("status")

        # Save Shiprocket's public tracking URL.
        tracking_url = tracking_data.get("track_url")

        if tracking_url:
            shipment.tracking_url = tracking_url
            update_fields.append("tracking_url")

        shipment.save(update_fields=update_fields)

        return shipment