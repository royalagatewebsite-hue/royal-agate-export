import { apiRequest } from "./api";

const CART_ENDPOINT = "/cart/";

// Get customer cart
export const getCart = async () => {
  return apiRequest(CART_ENDPOINT);
};

// Add product to cart
export const addToCart = async (productData) => {
  return apiRequest(`${CART_ENDPOINT}items/`, {
    method: "POST",
    body: productData,
  });
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  return apiRequest(`${CART_ENDPOINT}items/${itemId}/`, {
    method: "PATCH",
    body: { quantity },
  });
};

// Remove cart item
export const removeCartItem = async (itemId) => {
  return apiRequest(`${CART_ENDPOINT}items/${itemId}/`, {
    method: "DELETE",
  });
};

// Clear entire cart
export const clearCart = async () => {
  return apiRequest(`${CART_ENDPOINT}clear/`, {
    method: "DELETE",
  });
};
