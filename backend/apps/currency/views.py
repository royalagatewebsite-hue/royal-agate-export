import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .services import get_exchange_rates


logger = logging.getLogger(__name__)


class CurrencyRatesView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):

        try:
            exchange_data = get_exchange_rates()

            return Response(
                {
                    "success": True,
                    "data": exchange_data,
                },
                status=status.HTTP_200_OK,
            )

        except RuntimeError:

            logger.exception(
                "Unable to retrieve currency exchange rates."
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "Currency exchange rates are temporarily unavailable."
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )