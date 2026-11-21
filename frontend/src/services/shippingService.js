import { apiRequest } from "./api";

const SHIPPING_QUOTE_ENDPOINT = "/shipping/quote/";

export const createShippingQuote = async (addressId) => {
  return apiRequest(SHIPPING_QUOTE_ENDPOINT, {
    method: "POST",
    body: {
      address_id: addressId,
    },
  });
};