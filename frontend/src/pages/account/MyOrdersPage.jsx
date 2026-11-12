import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelOrder,
  getMyCancellations,
  getMyOrders,
} from "../../services/orderService";

const ORDER_STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-violet-50 text-violet-700 border-violet-200",
};

const CANCELLATION_STATUS_STYLES = {
  REQUESTED: "border-amber-200 bg-amber-50 text-amber-700",
  DIRECT_CANCELLED: "border-red-200 bg-red-50 text-red-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-slate-200 bg-slate-50 text-slate-700",
};

const CANCELLABLE_ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"];

const formatLabel = (value) => {
  if (!value) return "Unavailable";
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getOrderList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  return [];
};

function StatusBadge({ value, styles }) {
  const status = String(value || "").toUpperCase();
  const style =
    styles[status] || "border-[#DED7CA] bg-[#F7F4EE] text-[#77756F]";

  return (
    <span
      className={`inline-flex items-center border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] ${style}`}
    >
      {formatLabel(value)}
    </span>
  );
}

function CancellationModal({ order, reason, setReason, onClose, onSubmit, submitting, error }) {
  if (!order) return null;

  const isDirectCancellation = order.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#DED7CA] bg-[#FAF8F3] p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98250]">
              Order cancellation
            </p>
            <h2 id="cancel-order-title" className="mt-2 font-serif text-2xl text-[#18352B]">
              {isDirectCancellation ? "Cancel this order?" : "Request cancellation"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close cancellation dialog"
            className="p-2 text-[#77756F] transition hover:text-[#18352B] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#77756F]">
          Order <span className="font-medium text-[#18352B]">{order.order_number || `#${order.id}`}</span>
          {isDirectCancellation
            ? " will be cancelled directly."
            : " will be sent to our team for review. Your order remains active until the request is approved."}
        </p>

        <label htmlFor="cancellation-reason" className="mt-6 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#18352B]">
          Reason for cancellation <span className="text-red-600">*</span>
        </label>
        <textarea
          id="cancellation-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Please tell us why you want to cancel this order..."
          disabled={submitting}
          className="mt-2 w-full resize-y border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#18352B] outline-none transition placeholder:text-[#AAA49A] focus:border-[#A98250] disabled:opacity-60"
        />
        <div className="mt-1 flex justify-between gap-3 text-[10px] text-[#77756F]">
          <span>Please provide a brief reason.</span>
          <span>{reason.length}/2000</span>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="border border-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-[#18352B] transition hover:bg-[#F0ECE3] disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center justify-center gap-2 bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <LoaderCircle size={14} className="animate-spin" />}
            {submitting
              ? "Submitting..."
              : isDirectCancellation
                ? "Confirm Cancellation"
                : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, cancellation, onCancel }) {
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      )
    : null;

  const orderStatus = String(order.status || "").toUpperCase();
  const canCancel = CANCELLABLE_ORDER_STATUSES.includes(orderStatus);
  const hasPendingRequest = cancellation?.status === "REQUESTED";

  return (
    <article className="border border-[#DED7CA] bg-white p-5 transition hover:border-[#A98250] md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98250]">
            Order Number
          </p>
          <h2 className="mt-2 break-all font-serif text-xl text-[#18352B] md:text-2xl">
            {order.order_number || `Order #${order.id}`}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#77756F]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} />
              {formatDate(order.created_at)}
            </span>
            {itemCount !== null && (
              <span className="inline-flex items-center gap-2">
                <Package size={14} />
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#77756F]">
            Order Total
          </p>
          <p className="mt-2 font-serif text-2xl text-[#18352B]">
            {formatCurrency(order.total_amount)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-[#EAE4D9] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-[0.16em] text-[#77756F]">
              Order Status
            </p>
            <StatusBadge value={order.status} styles={ORDER_STATUS_STYLES} />
          </div>
          <div className="ml-2">
            <p className="mb-2 text-[9px] uppercase tracking-[0.16em] text-[#77756F]">
              Payment Status
            </p>
            <StatusBadge value={order.payment_status} styles={PAYMENT_STATUS_STYLES} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {cancellation && (
            <div className="w-full sm:w-auto sm:text-right">
              <p className="mb-1 text-[9px] uppercase tracking-[0.15em] text-[#77756F]">
                Cancellation
              </p>
              <StatusBadge value={cancellation.status} styles={CANCELLATION_STATUS_STYLES} />
            </div>
          )}

          {canCancel && !hasPendingRequest && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="inline-flex items-center justify-center gap-2 border border-red-200 px-4 py-3 text-[10px] uppercase tracking-[0.13em] text-red-700 transition hover:bg-red-50"
            >
              <XCircle size={14} />
              Cancel Order
            </button>
          )}

          {hasPendingRequest && (
            <span className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-amber-700">
              <CheckCircle2 size={14} />
              Request Under Review
            </span>
          )}

          <Link
            to={`/account/orders/${order.id}`}
            className="inline-flex items-center gap-2 bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
          >
            View Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [submittingCancellation, setSubmittingCancellation] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const cancellationByOrderId = useMemo(() => {
    const map = new Map();
    cancellations.forEach((item) => {
      const orderId = item.order;
      if (orderId !== undefined && orderId !== null && !map.has(String(orderId))) {
        map.set(String(orderId), item);
      }
    });
    return map;
  }, [cancellations]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersResponse, cancellationsResponse] = await Promise.all([
        getMyOrders(),
        getMyCancellations(),
      ]);

      setOrders(getOrderList(ordersResponse));
      setCancellations(getOrderList(cancellationsResponse));
    } catch (err) {
      setError(err.message || "Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openCancellationModal = (order) => {
    setSelectedOrder(order);
    setCancellationReason("");
    setCancellationError("");
    setSuccessMessage("");
  };

  const closeCancellationModal = () => {
    if (submittingCancellation) return;
    setSelectedOrder(null);
    setCancellationReason("");
    setCancellationError("");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      setCancellationError("Please enter a reason for cancellation.");
      return;
    }

    try {
      setSubmittingCancellation(true);
      setCancellationError("");

      const response = await cancelOrder(selectedOrder.id, cancellationReason.trim());
      const message =
        response?.message ||
        response?.data?.message ||
        (selectedOrder.status === "PENDING"
          ? "Your order has been cancelled."
          : "Your cancellation request has been submitted.");

      setSelectedOrder(null);
      setCancellationReason("");
      setSuccessMessage(message);
      await fetchOrders();
    } catch (err) {
      setCancellationError(
        err.message || "Unable to process cancellation. Please try again."
      );
    } finally {
      setSubmittingCancellation(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 border-b border-[#DED7CA] pb-8 md:mb-12">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#A98250]">
            Your Royal Agate Account
          </p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-serif text-4xl text-[#18352B] md:text-5xl">
                My Orders
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#77756F]">
                View your purchases, order progress and payment status.
              </p>
              <Link
                to="/account/cancellations"
                className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#A98250] transition hover:text-[#18352B]"
              >
                View cancellation history <ArrowRight size={13} />
              </Link>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start border border-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#18352B] transition hover:bg-[#18352B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Orders
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {loading && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-sm text-[#77756F]">
            <LoaderCircle size={28} className="animate-spin text-[#A98250]" />
            Loading your orders...
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-5 bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="border border-[#DED7CA] bg-[#FAF8F3] px-6 py-16 text-center">
            <ShoppingBag
              size={38}
              strokeWidth={1.3}
              className="mx-auto text-[#A98250]"
            />
            <h2 className="mt-5 font-serif text-2xl text-[#18352B]">
              No Orders Yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77756F]">
              You have not placed an order yet. Explore our agate collection
              and discover something exceptional.
            </p>
            <Link
              to="/collections"
              className="mt-7 inline-flex items-center gap-3 bg-[#18352B] px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#A98250]"
            >
              Explore Collection
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-[#77756F]">
                Order History
              </p>
              <p className="text-xs text-[#77756F]">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>

            <div className="space-y-5">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  cancellation={cancellationByOrderId.get(String(order.id))}
                  onCancel={openCancellationModal}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <CancellationModal
        order={selectedOrder}
        reason={cancellationReason}
        setReason={setCancellationReason}
        onClose={closeCancellationModal}
        onSubmit={handleCancelOrder}
        submitting={submittingCancellation}
        error={cancellationError}
      />
    </section>
  );
}
