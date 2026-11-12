import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Truck,
  AlertCircle,
  LoaderCircle,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import {
  getOrderById,
  getOrderTimeline,
} from "../../services/orderService";


const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
];

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatLabel = (value) => {
  if (!value) return "Unavailable";

  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] ${
        STATUS_STYLES[status] ||
        "border-[#DED7CA] bg-[#F7F4EE] text-[#77756F]"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="mb-6 font-serif text-xl text-[#18352B] md:text-2xl">
      {children}
    </h2>
  );
}

function OrderTimeline({ history = [], loading, error }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return ShoppingBag;

      case "CONFIRMED":
        return CheckCircle2;

      case "PROCESSING":
        return Package;

      case "SHIPPED":
        return Truck;

      case "DELIVERED":
        return CheckCircle2;

      case "CANCELLED":
        return AlertCircle;

      default:
        return Clock3;
    }
  };

  return (
    <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
      <SectionHeading>Order Progress</SectionHeading>

      {loading ? (
        <div className="flex items-center gap-3 py-5 text-sm text-[#77756F]">
          <LoaderCircle
            size={20}
            className="animate-spin text-[#A98250]"
          />
          Loading order timeline...
        </div>
      ) : error ? (
        <div className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            Unable to load order tracking history.
          </p>
          <p className="mt-1 text-xs text-amber-600">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-[#77756F]">
          No tracking updates are available yet.
        </p>
      ) : (
        <div className="relative space-y-7">
          {history.map((event, index) => {
            const Icon = getStatusIcon(event.new_status);
            const isCancelled = event.new_status === "CANCELLED";
            const isLast = index === history.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4">
                {!isLast && (
                  <div className="absolute left-[17px] top-10 h-[calc(100%+12px)] w-px bg-[#A98250]" />
                )}

                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    isCancelled
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-[#18352B] bg-[#18352B] text-white"
                  }`}
                >
                  <Icon size={17} />
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isCancelled
                            ? "text-red-700"
                            : "text-[#18352B]"
                        }`}
                      >
                        {formatLabel(event.new_status)}
                      </p>

                      {event.previous_status && (
                        <p className="mt-1 text-[10px] text-[#77756F]">
                          Previous status:{" "}
                          {formatLabel(event.previous_status)}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-[#77756F]">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>

                  {event.note && (
                    <p className="mt-2 text-xs leading-6 text-[#77756F]">
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShippingAddress({ order }) {
  return (
    <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <MapPin size={19} className="text-[#A98250]" />
        <SectionHeading>Shipping Address</SectionHeading>
      </div>

      <div className="space-y-2 text-sm text-[#77756F]">
        <p className="font-medium text-[#18352B]">
          {order.shipping_full_name}
        </p>

        <p>{order.shipping_phone_number}</p>

        <p>{order.shipping_address_line_1}</p>

        {order.shipping_address_line_2 && (
          <p>{order.shipping_address_line_2}</p>
        )}

        {order.shipping_district && (
          <p>{order.shipping_district}</p>
        )}

        <p>
          {order.shipping_city}, {order.shipping_state}
        </p>

        <p>
          {order.shipping_pincode}, {order.shipping_country}
        </p>
      </div>
    </div>
  );
}

function OrderSummary({ order }) {
  return (
    <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
      <SectionHeading>Order Summary</SectionHeading>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between gap-4 text-[#77756F]">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>

        <div className="flex justify-between gap-4 text-[#77756F]">
          <span>Shipping Charges</span>
          <span>{formatCurrency(order.shipping_charge)}</span>
        </div>

        <div className="flex justify-between gap-4 text-[#77756F]">
          <span>Discount</span>
          <span className="text-emerald-700">
            - {formatCurrency(order.discount)}
          </span>
        </div>

        <div className="border-t border-[#EAE4D9] pt-5">
          <div className="flex justify-between gap-4">
            <span className="font-medium text-[#18352B]">
              Total Amount
            </span>

            <span className="font-serif text-xl text-[#18352B]">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentInformation({ order }) {
  return (
    <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <CreditCard size={19} className="text-[#A98250]" />

        <SectionHeading>Payment Information</SectionHeading>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#77756F]">
            Payment Status
          </p>

          <div className="mt-2">
            <StatusBadge status={order.payment_status} />
          </div>
        </div>

        <p className="font-serif text-xl text-[#18352B]">
          {formatCurrency(order.total_amount)}
        </p>
      </div>
    </div>
  );
}

function OrderItems({ items = [] }) {
  return (
    <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
      <SectionHeading>Items in Your Order</SectionHeading>

      <div className="divide-y divide-[#EAE4D9]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
          >
            <div>
              <h3 className="font-serif text-lg text-[#18352B]">
                {item.product_name}
              </h3>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-[#77756F]">
                <span>SKU: {item.product_sku}</span>

                <span>
                  {formatLabel(item.purchase_mode)}
                </span>

                <span>Qty: {item.quantity}</span>
              </div>

              <p className="mt-2 text-xs text-[#77756F]">
                Unit Price: {formatCurrency(item.unit_price)}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#77756F]">
                Item Total
              </p>

              <p className="mt-1 font-serif text-lg text-[#18352B]">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-[#77756F]">
          No order items available.
        </p>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrderById(orderId);

      const orderData =
        response?.data?.order ||
        response?.order ||
        response?.data ||
        response;

      if (!orderData || !orderData.id) {
        throw new Error("Invalid order information received.");
      }

      setOrder(orderData);
    } catch (err) {
      setError(
        err.message || "Unable to load order details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchTimeline = useCallback(async () => {
    try {
        setTimelineLoading(true);
        setTimelineError("");

        const response = await getOrderTimeline(orderId);

        const payload = response?.data ?? response;

        const historyData =
        payload?.results ??
        payload?.timeline ??
        payload?.history ??
        payload;

        if (!Array.isArray(historyData)) {
        throw new Error("Invalid timeline information received.");
        }

        setTimeline(historyData);
    } catch (err) {
        setTimelineError(
        err.message || "Unable to load order tracking history."
        );
    } finally {
        setTimelineLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F4EE]">
        <div className="flex flex-col items-center gap-4 text-sm text-[#77756F]">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#A98250]"
          />
          Loading order details...
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F4EE] px-5">
        <div className="max-w-md border border-[#DED7CA] bg-white p-8 text-center">
          <AlertCircle
            size={32}
            className="mx-auto text-red-600"
          />

          <h2 className="mt-4 font-serif text-2xl text-[#18352B]">
            Unable to Load Order
          </h2>

          <p className="mt-3 text-sm text-[#77756F]">
            {error || "Order not found."}
          </p>

          <button
            onClick={fetchOrder}
            className="mt-6 bg-[#18352B] px-6 py-3 text-xs uppercase tracking-wider text-white hover:bg-[#A98250]"
          >
            Try Again
          </button>

          <div>
            <Link
              to="/account/orders"
              className="mt-5 inline-block text-xs text-[#A98250] hover:underline"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1100px]">

        {/* Back Navigation */}
        <Link
          to="/account/orders"
          className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#77756F] transition hover:text-[#A98250]"
        >
          <ArrowLeft size={15} />
          Back to My Orders
        </Link>

        {/* Header */}
        <div className="mb-10 border-b border-[#DED7CA] pb-8">
          <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#A98250]">
            Royal Agate Account
          </p>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-3xl text-[#18352B] md:text-5xl">
                Order Details
              </h1>

              <p className="mt-3 break-all text-sm text-[#77756F]">
                Order #{order.order_number}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />

              <div className="flex items-center gap-2 text-xs text-[#77756F]">
                <CalendarDays size={15} />
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="mb-6">
          <OrderTimeline
            history={timeline}
            loading={timelineLoading}
            error={timelineError}
          />
        </div>

        {/* Products */}
        <div className="mb-6">
          <OrderItems items={order.items || []} />
        </div>

        {/* Address and Summary */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <ShippingAddress order={order} />
          <OrderSummary order={order} />
        </div>

        {/* Payment */}
        <div className="mb-6">
          <PaymentInformation order={order} />
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border border-[#DED7CA] bg-white p-6 md:p-8">
            <SectionHeading>Order Notes</SectionHeading>

            <p className="text-sm leading-7 text-[#77756F]">
              {order.notes}
            </p>
          </div>
        )}

      </div>
    </section>
  );
}