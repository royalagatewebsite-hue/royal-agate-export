import os
import requests

from django.core.cache import cache
from rest_framework.exceptions import APIException


class ShiprocketClient:
    BASE_URL = "https://apiv2.shiprocket.in/v1/external"
    TOKEN_CACHE_KEY = "shiprocket_auth_token"
    TOKEN_TIMEOUT = 9 * 24 * 60 * 60  # 9 days

    @classmethod
    def get_token(cls):
        token = cache.get(cls.TOKEN_CACHE_KEY)

        if token:
            return token

        email = os.getenv("SHIPROCKET_EMAIL")
        password = os.getenv("SHIPROCKET_PASSWORD")

        if not email or not password:
            raise APIException(
                "Shiprocket credentials are not configured."
            )

        try:
            response = requests.post(
                f"{cls.BASE_URL}/auth/login",
                json={
                    "email": email,
                    "password": password,
                },
                headers={
                    "Content-Type": "application/json",
                },
                timeout=20,
            )

            response.raise_for_status()
            data = response.json()

            token = data.get("token")

            if not token:
                raise APIException(
                    "Shiprocket authentication failed."
                )

            cache.set(
                cls.TOKEN_CACHE_KEY,
                token,
                cls.TOKEN_TIMEOUT,
            )

            return token

        except requests.RequestException:
            raise APIException(
                "Unable to connect to Shiprocket."
            )

    @classmethod
    def request(cls, method, endpoint, **kwargs):
        token = cls.get_token()

        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        headers["Content-Type"] = "application/json"

        try:
            response = requests.request(
                method=method,
                url=f"{cls.BASE_URL}/{endpoint.lstrip('/')}",
                headers=headers,
                timeout=30,
                **kwargs,
            )

            if response.status_code == 401:
                cache.delete(cls.TOKEN_CACHE_KEY)

                token = cls.get_token()
                headers["Authorization"] = f"Bearer {token}"

                response = requests.request(
                    method=method,
                    url=f"{cls.BASE_URL}/{endpoint.lstrip('/')}",
                    headers=headers,
                    timeout=30,
                    **kwargs,
                )

            response.raise_for_status()
            return response.json()

        except requests.RequestException:
            raise APIException(
                "Shiprocket API request failed."
            )