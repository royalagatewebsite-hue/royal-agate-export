import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCurrencyRates } from "../services/currencyService";

const CurrencyContext = createContext(null);

const STORAGE_KEY = "royal_agate_currency";

export const SUPPORTED_CURRENCIES = {
  INR: {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    flag: "🇮🇳",
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    flag: "🇬🇧",
  },
  AED: {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    flag: "🇦🇪",
  },
};

const DEFAULT_CURRENCY = "INR";

function getSavedCurrency() {
  try {
    const savedCurrency = localStorage.getItem(STORAGE_KEY);

    if (
      savedCurrency &&
      Object.prototype.hasOwnProperty.call(
        SUPPORTED_CURRENCIES,
        savedCurrency
      )
    ) {
      return savedCurrency;
    }
  } catch (error) {
    console.error("Currency preference loading failed:", error);
  }

  return DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(getSavedCurrency);

  const [rates, setRates] = useState({
    INR: 1,
  });

  const [rateDate, setRateDate] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [ratesStale, setRatesStale] = useState(false);

  // Fetch exchange rates from Django backend
  useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      try {
        setRatesLoading(true);
        setRatesError(false);

        const data = await getCurrencyRates();

        if (!isMounted) return;

        const normalizedRates = {
          INR: 1,
        };

        Object.entries(data.rates).forEach(([code, rate]) => {
          const numericRate = Number(rate);

          if (
            Object.prototype.hasOwnProperty.call(
              SUPPORTED_CURRENCIES,
              code
            ) &&
            Number.isFinite(numericRate) &&
            numericRate > 0
          ) {
            normalizedRates[code] = numericRate;
          }
        });

        setRates(normalizedRates);
        setRateDate(data.date || null);
        setRatesStale(Boolean(data.stale));

      } catch (error) {
        console.error("Currency rates loading failed:", error);

        if (isMounted) {
          setRatesError(true);
        }

      } finally {
        if (isMounted) {
          setRatesLoading(false);
        }
      }
    }

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected currency
  const setCurrency = useCallback((newCurrency) => {
    if (
      !Object.prototype.hasOwnProperty.call(
        SUPPORTED_CURRENCIES,
        newCurrency
      )
    ) {
      return;
    }

    setCurrencyState(newCurrency);

    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch (error) {
      console.error("Currency preference saving failed:", error);
    }
  }, []);

  // Convert INR price into selected currency
  const convertPrice = useCallback(
    (amount) => {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount)) {
        return null;
      }

      if (currency === "INR") {
        return numericAmount;
      }

      const exchangeRate = rates[currency];

      if (!exchangeRate) {
        return null;
      }

      return numericAmount * exchangeRate;
    },
    [currency, rates]
  );

  // Format price according to selected currency
  const formatPrice = useCallback(
    (amount) => {
      const convertedAmount = convertPrice(amount);

      if (convertedAmount === null) {
        return "Price unavailable";
      }

      try {
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(convertedAmount);

      } catch {
        return `${SUPPORTED_CURRENCIES[currency].symbol}${convertedAmount.toFixed(2)}`;
      }
    },
    [currency, convertPrice]
  );

  const contextValue = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      rateDate,
      ratesLoading,
      ratesError,
      ratesStale,
      convertPrice,
      formatPrice,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    }),
    [
      currency,
      setCurrency,
      rates,
      rateDate,
      ratesLoading,
      ratesError,
      ratesStale,
      convertPrice,
      formatPrice,
    ]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom hook
export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error(
      "useCurrency must be used within CurrencyProvider."
    );
  }

  return context;
}