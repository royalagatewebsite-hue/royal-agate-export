import { apiRequest } from "./api";

const INVENTORY_ENDPOINT = "/inventory/stock/";
const ADJUSTMENT_ENDPOINT = "/inventory/adjust/";
const MOVEMENTS_ENDPOINT = "/inventory/movements/";

// Build query parameters
const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
};

const inventoryService = {

  // Get inventory list with search, filters and pagination
  getInventory(params = {}) {
    return apiRequest(
      `${INVENTORY_ENDPOINT}${buildQueryString(params)}`
    );
  },

  // Get inventory details
  getInventoryDetail(id) {
    return apiRequest(`${INVENTORY_ENDPOINT}${id}/`);
  },

  // Create inventory
  createInventory(payload) {
    return apiRequest(INVENTORY_ENDPOINT, {
      method: "POST",
      body: payload,
    });
  },

  // Update low stock threshold
  updateThreshold(id, payload) {
    return apiRequest(`${INVENTORY_ENDPOINT}${id}/`, {
      method: "PATCH",
      body: payload,
    });
  },

  // Increase or decrease stock
  adjustStock(payload) {
    return apiRequest(ADJUSTMENT_ENDPOINT, {
      method: "POST",
      body: payload,
    });
  },

  // Get stock movement history
  getMovements(params = {}) {
    return apiRequest(
      `${MOVEMENTS_ENDPOINT}${buildQueryString(params)}`
    );
  },

};

export default inventoryService;