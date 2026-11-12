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