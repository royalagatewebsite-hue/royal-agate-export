import { apiRequest } from "./api";

const CURRENCY_ENDPOINT = "/currency/rates/";

export async function getCurrencyRates() {
  const response = await apiRequest(CURRENCY_ENDPOINT);

  if (!response?.success || !response?.data?.rates) {
    throw new Error("Unable to retrieve currency exchange rates.");
  }

  return response.data;
}