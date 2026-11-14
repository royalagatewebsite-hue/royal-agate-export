import { apiRequest } from "./api";

const PAYMENT_ATTEMPTS_ENDPOINT = "/payments/attempts/";

// Create a payment attempt for an existing order
export const createPaymentAttempt = async ({
  orderId,
  paymentMethod,
  idempotencyKey,
  transactionId = "",
}) => {
  const body = {
    order_id: orderId,
    payment_method: paymentMethod,
    idempotency_key: idempotencyKey,
  };

  if (paymentMethod === "BANK_TRANSFER") {
    body.transaction_id = transactionId;
  }

  return apiRequest(PAYMENT_ATTEMPTS_ENDPOINT, {
    method: "POST",
    body,
  });
};

const RAZORPAY_CREATE_ORDER_ENDPOINT = "/payments/razorpay/create-order/";
const RAZORPAY_VERIFY_ENDPOINT = "/payments/razorpay/verify/";

export const createRazorpayOrder = async ({
  orderId,
  idempotencyKey,
}) => {
  return apiRequest(RAZORPAY_CREATE_ORDER_ENDPOINT, {
    method: "POST",
    body: {
      order_id: orderId,
      idempotency_key: idempotencyKey,
    },
  });
};

export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  return apiRequest(RAZORPAY_VERIFY_ENDPOINT, {
    method: "POST",
    body: {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    },
  });
};

// ==========================================
// ADMIN REFUND APIs
// ==========================================

const REFUNDS_ENDPOINT = "/payments/refunds/";

// Get all refunds
export const getAdminRefunds = async () => {
  return apiRequest(REFUNDS_ENDPOINT);
};

// Create a refund
export const createAdminRefund = async ({
  paymentId,
  amount,
  refundMethod,
  adminNote = "",
}) => {
  return apiRequest(REFUNDS_ENDPOINT, {
    method: "POST",
    body: {
      payment_id: paymentId,
      amount,
      refund_method: refundMethod,
      admin_note: adminNote,
    },
  });
};

// Move refund to processing
export const processAdminRefund = async (refundId) => {
  return apiRequest(`${REFUNDS_ENDPOINT}${refundId}/process/`, {
    method: "POST",
  });
};

// Complete refund
export const completeAdminRefund = async (
  refundId,
  transactionReference,
  adminNote = ""
) => {
  return apiRequest(`${REFUNDS_ENDPOINT}${refundId}/complete/`, {
    method: "POST",
    body: {
      transaction_reference: transactionReference,
      admin_note: adminNote,
    },
  });
};

// Mark refund as failed
export const failAdminRefund = async (
  refundId,
  adminNote = ""
) => {
  return apiRequest(`${REFUNDS_ENDPOINT}${refundId}/fail/`, {
    method: "POST",
    body: {
      admin_note: adminNote,
    },
  });
};

// ==========================================
// ADMIN PAYMENT LOOKUP API
// ==========================================

const ADMIN_PAYMENT_LOOKUP_ENDPOINT =
  "/payments/admin/lookup/";

export const getAdminPaymentById = async (paymentId) => {
  return apiRequest(
    `${ADMIN_PAYMENT_LOOKUP_ENDPOINT}${paymentId}/`
  );
};