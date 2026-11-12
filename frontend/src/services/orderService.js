import { apiRequest } from "./api";

const ORDER_ENDPOINT = "/orders/";

// ==========================================
// CUSTOMER ORDER APIs
// ==========================================

// Create a new order
export const createOrder = async (addressId, notes = "") => {
  return apiRequest(ORDER_ENDPOINT, {
    method: "POST",
    body: {
      address_id: addressId,
      notes,
    },
  });
};

// Get logged-in customer's orders
export const getMyOrders = async () => {
  return apiRequest(`${ORDER_ENDPOINT}my-orders/`);
};

// Get logged-in customer's cancellation history
export const getMyCancellations = async () => {
  return apiRequest(`${ORDER_ENDPOINT}my-cancellations/`);
};

// Get customer order details
export const getOrderById = async (orderId) => {
  return apiRequest(`${ORDER_ENDPOINT}${orderId}/`);
};

// Get customer order timeline
export const getOrderTimeline = async (orderId) => {
  return apiRequest(`${ORDER_ENDPOINT}${orderId}/timeline/`);
};

// Cancel customer order
export const cancelOrder = async (orderId, reason) => {
  return apiRequest(`${ORDER_ENDPOINT}${orderId}/cancel/`, {
    method: "POST",
    body: { reason },
  });
};

// ==========================================
// ADMIN ORDER APIs
// ==========================================

// Get all orders with filters and pagination
export const getAdminOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const query = queryParams.toString();

  return apiRequest(
    `${ORDER_ENDPOINT}admin/${query ? `?${query}` : ""}`
  );
};

// Get specific order details
export const getAdminOrderById = async (orderId) => {
  return apiRequest(`${ORDER_ENDPOINT}admin/${orderId}/`);
};

// Confirm order
export const confirmAdminOrder = async (orderId) => {
  return apiRequest(`${ORDER_ENDPOINT}${orderId}/confirm/`, {
    method: "POST",
  });
};

// Update order status
export const updateAdminOrderStatus = async (
  orderId,
  status,
  note = ""
) => {
  return apiRequest(`${ORDER_ENDPOINT}${orderId}/status/`, {
    method: "POST",
    body: {
      status,
      note,
    },
  });
};

// Get all cancellation requests
export const getAdminCancellations = async (status = "") => {
  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return apiRequest(
    `${ORDER_ENDPOINT}admin/cancellations/${query}`
  );
};

// Approve cancellation
export const approveAdminCancellation = async (
  cancellationId,
  adminNote = ""
) => {
  return apiRequest(
    `${ORDER_ENDPOINT}admin/cancellations/${cancellationId}/approve/`,
    {
      method: "POST",
      body: { admin_note: adminNote },
    }
  );
};

// Reject cancellation
export const rejectAdminCancellation = async (
  cancellationId,
  adminNote = ""
) => {
  return apiRequest(
    `${ORDER_ENDPOINT}admin/cancellations/${cancellationId}/reject/`,
    {
      method: "POST",
      body: { admin_note: adminNote },
    }
  );
};

// Get admin dashboard statistics
export const getAdminDashboardStats = async () => {
  return apiRequest(`${ORDER_ENDPOINT}admin/dashboard-stats/`);
};

// Get admin order timeline
export const getAdminOrderTimeline = async (orderId) => {
  return apiRequest(
    `${ORDER_ENDPOINT}admin/${orderId}/timeline/`
  );
};