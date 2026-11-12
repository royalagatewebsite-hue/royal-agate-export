import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

import {
  getAdminOrderById,
  getAdminOrderTimeline,
  confirmAdminOrder,
  updateAdminOrderStatus,
} from "../../services/orderService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-purple-50 text-purple-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  CANCELLED: "bg-red-50 text-red-700",
  DELIVERED: "bg-green-50 text-green-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.replaceAll("_", " ") || "UNKNOWN"}
    </span>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="bg-white border border-[#DED7CA]">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#DED7CA]">
        <Icon size={19} className="text-[#A98250]" />

        <h2 className="font-serif text-xl text-[#18352B]">
          {title}
        </h2>
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [orderResponse, timelineResponse] = await Promise.all([
        getAdminOrderById(orderId),
        getAdminOrderTimeline(orderId),
      ]);

      setOrder(orderResponse);
      setTimeline(timelineResponse.results || []);
    } catch (err) {
      setError(
        err.message || "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleStatusUpdate = async (action, nextStatus = null) => {
    const messages = {
        CONFIRMED: "Are you sure you want to confirm this order?",
        PROCESSING: "Start processing this order?",
        SHIPPED: "Mark this order as shipped?",
    };

    if (!window.confirm(messages[action])) {
        return;
    }

    try {
        setUpdating(true);
        setActionMessage("");
        setActionError("");

        if (action === "CONFIRMED") {
        await confirmAdminOrder(orderId);
        } else {
        await updateAdminOrderStatus(
            orderId,
            nextStatus,
            adminNote.trim()
        );
        }

        setAdminNote("");
        setActionMessage("Order status updated successfully.");

        await fetchOrderDetails();
    } catch (err) {
        setActionError(
        err.message || "Unable to update order status."
        );
    } finally {
        setUpdating(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#77756F]">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white border border-[#DED7CA] p-8">
        <p className="text-red-600">
          {error || "Order not found."}
        </p>

        <button
          onClick={() => navigate("/admin/orders")}
          className="mt-5 text-sm text-[#A98250] underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const address = [
    order.shipping_address_line_1,
    order.shipping_address_line_2,
    order.shipping_district,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode,
    order.shipping_country,
  ].filter(Boolean);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 text-sm text-[#77756F] hover:text-[#A98250] mb-4"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </button>

          <p className="text-xs uppercase tracking-[0.2em] text-[#A98250] mb-2">
            Order Management
          </p>

          <h1 className="font-serif text-3xl text-[#18352B]">
            Order Details
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            {order.order_number}
          </p>
        </div>

        <button
          onClick={fetchOrderDetails}
          className="flex items-center gap-2 px-5 py-3 bg-[#18352B] text-white text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-[#DED7CA] p-6">
          <p className="text-sm text-[#77756F]">
            Order Status
          </p>

          <div className="mt-4">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="bg-white border border-[#DED7CA] p-6">
          <p className="text-sm text-[#77756F]">
            Payment Status
          </p>

          <div className="mt-4">
            <StatusBadge status={order.payment_status} />
          </div>
        </div>

        <div className="bg-white border border-[#DED7CA] p-6">
          <p className="text-sm text-[#77756F]">
            Order Total
          </p>

          <h2 className="font-serif text-2xl text-[#18352B] mt-2">
            {formatCurrency(order.total_amount)}
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-6">

          {/* Products */}
          <Section title="Ordered Products" icon={ShoppingBag}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-[#77756F] border-b border-[#DED7CA]">
                    <th className="pb-4">Product</th>
                    <th className="pb-4">SKU</th>
                    <th className="pb-4">Qty</th>
                    <th className="pb-4">Unit Price</th>
                    <th className="pb-4 text-right">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#DED7CA] last:border-0"
                    >
                      <td className="py-5">
                        <p className="text-sm font-medium text-[#18352B]">
                          {item.product_name}
                        </p>

                        <p className="text-xs text-[#77756F] mt-1">
                          {item.purchase_mode}
                        </p>
                      </td>

                      <td className="py-5 text-sm text-[#77756F]">
                        {item.product_sku}
                      </td>

                      <td className="py-5 text-sm">
                        {item.quantity}
                      </td>

                      <td className="py-5 text-sm">
                        {formatCurrency(item.unit_price)}
                      </td>

                      <td className="py-5 text-sm text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!order.items || order.items.length === 0) && (
                <p className="py-8 text-center text-sm text-[#77756F]">
                  No products found.
                </p>
              )}
            </div>

            <div className="max-w-sm ml-auto mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#77756F]">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#77756F]">Shipping</span>
                <span>{formatCurrency(order.shipping_charge)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#77756F]">Discount</span>
                <span>{formatCurrency(order.discount)}</span>
              </div>

              <div className="flex justify-between border-t border-[#DED7CA] pt-4 font-semibold text-[#18352B]">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Order Timeline" icon={Clock}>
            {timeline.length === 0 ? (
              <p className="text-sm text-[#77756F]">
                No timeline history available.
              </p>
            ) : (
              <div className="relative space-y-7">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#A98250] ring-4 ring-[#A98250]/10" />

                      {index !== timeline.length - 1 && (
                        <div className="w-px flex-1 bg-[#DED7CA] mt-2" />
                      )}
                    </div>

                    <div className="pb-2">
                      <p className="text-sm font-semibold text-[#18352B]">
                        {event.new_status?.replaceAll("_", " ")}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        {formatDateTime(event.created_at)}
                      </p>

                      {event.note && (
                        <p className="text-sm text-[#77756F] mt-2">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Manage Order */}
          <Section title="Manage Order" icon={Package}>

            <div className="space-y-5">

                <div>
                <p className="text-xs text-[#77756F] mb-2">
                    Current Order Status
                </p>

                <StatusBadge status={order.status} />
                </div>

                <div>
                <label className="block text-sm font-medium text-[#18352B] mb-2">
                    Admin Note
                </label>

                <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Add an optional note about this update..."
                    className="w-full border border-[#DED7CA] p-3 text-sm outline-none focus:border-[#A98250] resize-none"
                />
                </div>

                {order.status === "PENDING" && (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    className="w-full px-5 py-3 bg-[#18352B] text-white text-sm hover:bg-[#244638] disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Confirm Order"}
                  </button>
                )}
                {order.status === "CONFIRMED" && (
                <button
                    disabled={updating}
                    onClick={() =>
                    handleStatusUpdate("PROCESSING", "PROCESSING")
                    }
                    className="w-full px-5 py-3 bg-[#18352B] text-white text-sm hover:bg-[#244638] disabled:opacity-50"
                >
                    {updating ? "Updating..." : "Start Processing"}
                </button>
                )}

                {order.status === "PROCESSING" && (
                <button
                    disabled={updating}
                    onClick={() =>
                    handleStatusUpdate("SHIPPED", "SHIPPED")
                    }
                    className="w-full px-5 py-3 bg-[#A98250] text-white text-sm hover:bg-[#927044] disabled:opacity-50"
                >
                    {updating ? "Updating..." : "Mark as Shipped"}
                </button>
                )}

                {order.status === "SHIPPED" && (
                <div className="bg-green-50 border border-green-200 p-4">
                    <p className="text-sm font-medium text-green-800">
                    Order has been shipped.
                    </p>

                    <p className="text-xs text-green-700 mt-1">
                    Further delivery confirmation is not available in the current admin workflow.
                    </p>
                </div>
                )}

                {order.status === "CANCELLED" && (
                <div className="bg-red-50 border border-red-200 p-4">
                    <p className="text-sm font-medium text-red-700">
                    This order has been cancelled.
                    </p>
                </div>
                )}

                {actionMessage && (
                <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                    {actionMessage}
                </div>
                )}

                {actionError && (
                <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {actionError}
                </div>
                )}

            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Customer */}
          <Section title="Customer Information" icon={User}>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Full Name
                </p>

                <p className="text-sm text-[#18352B]">
                  {order.customer_name || order.shipping_full_name}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={17} className="text-[#A98250] mt-1" />

                <p className="text-sm break-all">
                  {order.customer_email || "—"}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={17} className="text-[#A98250] mt-1" />

                <p className="text-sm">
                  {order.shipping_phone_number || "—"}
                </p>
              </div>
            </div>
          </Section>

          {/* Address */}
          <Section title="Shipping Address" icon={MapPin}>
            <p className="text-sm font-medium text-[#18352B] mb-3">
              {order.shipping_full_name}
            </p>

            <div className="text-sm text-[#77756F] leading-7">
              {address.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </Section>

          {/* Order Information */}
          <Section title="Order Information" icon={Package}>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Order Number
                </p>

                <p className="text-[#18352B] break-all">
                  {order.order_number}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Placed On
                </p>

                <p className="text-[#18352B]">
                  {formatDateTime(order.created_at)}
                </p>
              </div>

              {order.notes && (
                <div>
                  <p className="text-xs text-[#77756F] mb-1">
                    Customer Notes
                  </p>

                  <p className="text-[#18352B]">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
