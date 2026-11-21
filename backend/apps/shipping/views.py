from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import ValidationError
from decimal import Decimal

from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.common.permissions import IsCustomer, IsAdmin
from apps.shipping.services import ShippingService


class ShippingQuoteView(APIView):

    permission_classes = [IsAuthenticated, IsCustomer]
    
    @extend_schema(
        request=inline_serializer(
            name="ShippingQuoteRequest",
            fields={
                "address_id": serializers.IntegerField(),
            },
        )
    )

    def post(self, request):

        address_id = request.data.get("address_id")

        if not address_id:
            raise ValidationError({
                "address_id": "Address ID is required."
            })

        quote = ShippingService.create_quote(
            user=request.user,
            address_id=address_id,
        )

        return Response(
            {
                "success": True,
                "message": "Shipping quote generated successfully.",
                "data": {
                    "quote_id": str(quote.id),
                    "shipping_charge": str(quote.shipping_charge),
                    "courier_name": quote.courier_name,
                    "estimated_delivery_days": (
                        quote.estimated_delivery_days
                    ),
                    "package_weight": str(quote.package_weight),
                    "expires_at": quote.expires_at,
                },
            },
            status=status.HTTP_200_OK,
        )
        
class PackageDimensionsSerializer(serializers.Serializer):
    package_length = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=Decimal("0.01")
    )
    package_breadth = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=Decimal("0.01")
    )
    package_height = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=Decimal("0.01")
    )
    package_weight = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal("0.01")
    )


class AdminCreateShipmentView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        request=PackageDimensionsSerializer
    )
    def post(self, request, order_id):

        serializer = PackageDimensionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment = ShippingService.create_shipment(
            order_id=order_id,
            **serializer.validated_data
        )

        return Response(
            {
                "success": True,
                "message": "Shipment created successfully.",
                "data": {
                    "order_id": order_id,
                    "shipment_id": shipment.shiprocket_shipment_id,
                    "shiprocket_order_id": shipment.shiprocket_order_id,
                    "status": shipment.status,
                    "package_length": str(shipment.package_length),
                    "package_breadth": str(shipment.package_breadth),
                    "package_height": str(shipment.package_height),
                    "package_weight": str(shipment.package_weight),
                }
            },
            status=status.HTTP_201_CREATED
        )


class AdminAssignAWBView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, order_id):

        shipment = ShippingService.assign_awb(
            order_id=order_id
        )

        return Response(
            {
                "success": True,
                "message": "AWB assigned successfully.",
                "data": {
                    "order_id": order_id,
                    "awb_code": shipment.awb_code,
                    "courier_name": shipment.courier_name,
                    "tracking_url": shipment.tracking_url,
                    "status": shipment.status,
                }
            },
            status=status.HTTP_200_OK
        )
        
class AdminGenerateLabelView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, order_id):

        shipment = ShippingService.generate_label(
            order_id=order_id
        )

        return Response(
            {
                "success": True,
                "message": "Shipping label generated successfully.",
                "data": {
                    "order_id": order_id,
                    "shipment_id": shipment.shiprocket_shipment_id,
                    "awb_code": shipment.awb_code,
                    "label_url": shipment.label_url,
                },
            },
            status=status.HTTP_200_OK,
        )
        
class AdminRefreshTrackingView(APIView):

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, order_id):

        shipment = ShippingService.track_shipment(
            order_id=order_id
        )

        return Response(
            {
                "success": True,
                "message": "Shipment tracking refreshed successfully.",
                "data": {
                    "order_id": order_id,
                    "shipment_id": shipment.shiprocket_shipment_id,
                    "awb_code": shipment.awb_code,
                    "courier_name": shipment.courier_name,
                    "status": shipment.status,
                    "tracking_url": shipment.tracking_url,
                    "tracking_response": shipment.raw_tracking_response,
                },
            },
            status=status.HTTP_200_OK,
        )