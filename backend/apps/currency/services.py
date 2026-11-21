import json
import logging
from decimal import Decimal, InvalidOperation
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.cache import cache


logger = logging.getLogger(__name__)


# ==========================================
# CURRENCY CONFIGURATION
# ==========================================

FRANKFURTER_API_URL = "https://api.frankfurter.dev/v2/rates"

BASE_CURRENCY = "INR"

SUPPORTED_CURRENCIES = {
    "INR",
    "USD",
    "EUR",
    "GBP",
    "AED",
}

CACHE_TIMEOUT = 60 * 60  # 1 hour
STALE_CACHE_TIMEOUT = 60 * 60 * 24 * 7  # 7 days

CACHE_KEY = "currency_rates_inr_v1"
STALE_CACHE_KEY = "currency_rates_inr_stale_v1"


# ==========================================
# EXCHANGE RATE SERVICE
# ==========================================

def fetch_exchange_rates():

    target_currencies = sorted(
        SUPPORTED_CURRENCIES - {BASE_CURRENCY}
    )

    params = (
        f"?base={BASE_CURRENCY}"
        f"&quotes={','.join(target_currencies)}"
    )

    request = Request(
        f"{FRANKFURTER_API_URL}{params}",
        headers={
            "User-Agent": "RoyalAgateExport/1.0",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        logger.exception(
            "Frankfurter API request failed: %s", exc
        )
        raise RuntimeError("Exchange rate service unavailable.") from exc

    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.exception(
            "Invalid Frankfurter API response: %s", exc
        )
        raise RuntimeError("Invalid exchange rate response.") from exc

    if not isinstance(data, list):
        raise RuntimeError("Unexpected exchange rate response format.")

    rates = {}
    rate_date = None

    for item in data:

        currency = item.get("quote")
        raw_rate = item.get("rate")

        if currency not in target_currencies:
            continue

        try:
            rate = Decimal(str(raw_rate))

        except (InvalidOperation, TypeError, ValueError):
            continue

        if not rate.is_finite() or rate <= 0:
            continue

        rates[currency] = str(rate)

        item_date = item.get("date")

        if item_date and (
            rate_date is None or item_date > rate_date
        ):
            rate_date = item_date

    if set(rates.keys()) != set(target_currencies):
        raise RuntimeError("Incomplete exchange rate data.")

    result = {
        "base": BASE_CURRENCY,
        "date": rate_date,
        "rates": rates,
    }

    return result


# ==========================================
# CACHED EXCHANGE RATES
# ==========================================

def get_exchange_rates():

    cached_rates = cache.get(CACHE_KEY)

    if cached_rates:
        return {
            **cached_rates,
            "stale": False,
        }

    try:
        rates = fetch_exchange_rates()

        cache.set(
            CACHE_KEY,
            rates,
            CACHE_TIMEOUT,
        )

        cache.set(
            STALE_CACHE_KEY,
            rates,
            STALE_CACHE_TIMEOUT,
        )

        return {
            **rates,
            "stale": False,
        }

    except RuntimeError:

        logger.warning(
            "Using previously cached exchange rates."
        )

        stale_rates = cache.get(STALE_CACHE_KEY)

        if stale_rates:
            return {
                **stale_rates,
                "stale": True,
            }

        raise


# ==========================================
# CURRENCY VALIDATION
# ==========================================

def is_supported_currency(currency):

    if not isinstance(currency, str):
        return False

    return currency.upper() in SUPPORTED_CURRENCIES


# ==========================================
# PRICE CONVERSION
# ==========================================

def convert_price(amount, target_currency):

    if not is_supported_currency(target_currency):
        raise ValueError("Unsupported currency.")

    amount = Decimal(str(amount))

    if not amount.is_finite() or amount < 0:
        raise ValueError("Invalid price amount.")

    target_currency = target_currency.upper()

    if target_currency == BASE_CURRENCY:
        return amount

    exchange_data = get_exchange_rates()

    rate = Decimal(
        exchange_data["rates"][target_currency]
    )

    converted_amount = amount * rate

    return converted_amount.quantize(
        Decimal("0.01")
    )