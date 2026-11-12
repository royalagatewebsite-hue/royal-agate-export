import { apiRequest } from "./api";

const ADDRESS_ENDPOINT = "/cart/addresses/";

// Get all saved addresses
export const getAddresses = async () => {
  return apiRequest(ADDRESS_ENDPOINT);
};

// Add new address
export const createAddress = async (addressData) => {
  return apiRequest(ADDRESS_ENDPOINT, {
    method: "POST",
    body: addressData,
  });
};

// Get address details
export const getAddressById = async (addressId) => {
  return apiRequest(`${ADDRESS_ENDPOINT}${addressId}/`);
};

// Update address
export const updateAddress = async (addressId, addressData) => {
  return apiRequest(`${ADDRESS_ENDPOINT}${addressId}/`, {
    method: "PATCH",
    body: addressData,
  });
};

// Delete address
export const deleteAddress = async (addressId) => {
  return apiRequest(`${ADDRESS_ENDPOINT}${addressId}/`, {
    method: "DELETE",
  });
};

// Validate checkout
export const getCheckoutPreview = async (addressId) => {
  return apiRequest("/cart/checkout/preview/", {
    method: "POST",
    body: {
      address_id: addressId,
    },
  });
};
