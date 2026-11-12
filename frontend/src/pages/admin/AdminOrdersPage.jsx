import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { getAdminOrders } from "../../services/orderService";

const ORDER_STATUSES = [
  { label: "All Orders", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAYMENT_STATUSES = [
  { label: "All Payments", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
];

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
};

const paymentStyles = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function StatusBadge({ status, payment = false }) {
  const styles = payment ? paymentStyles : statusStyles;

  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.replaceAll("_", " ") || "UNKNOWN"}
    </span>
  );
}

export default function AdminOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const PAGE_SIZE = 20;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminOrders({
        page,
        page_size: PAGE_SIZE,
        search,
        status: statusFilter,
        payment_status: paymentFilter,
      });

      setOrders(response.results || []);

      setPagination({
        count: response.count || 0,
        next: response.next || null,
        previous: response.previous || null,
      });
    } catch (err) {
      setError(
        err.message || "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePaymentChange = (value) => {
    setPaymentFilter(value);
    setPage(1);
  };

  const startItem =
    pagination.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    page * PAGE_SIZE,
    pagination.count
  );

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A98250] mb-2">
            Order Management
          </p>

          <h1 className="font-serif text-3xl text-[#18352B]">
            All Orders
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Manage and monitor customer orders.
          </p>
        </div>

        <button
          onClick={() => fetchOrders()}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#18352B] text-white text-sm hover:bg-[#244638] disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh Orders
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DED7CA] p-5 mb-6">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        >
          <div className="lg:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77756F]"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order number, customer or email..."
              className="w-full border border-[#DED7CA] pl-11 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250] bg-white"
          >
            {ORDER_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => handlePaymentChange(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250] bg-white"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="lg:col-span-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#A98250] text-white text-sm hover:bg-[#927044]"
            >
              Search Orders
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatusFilter("");
                setPaymentFilter("");
                setPage(1);
              }}
              className="px-6 py-2.5 border border-[#DED7CA] text-[#18352B] text-sm hover:bg-[#F7F4EE]"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#DED7CA]">
        <div className="flex items-center justify-between p-5 border-b border-[#DED7CA]">
          <div>
            <h2 className="font-serif text-xl text-[#18352B]">
              Orders
            </h2>

            <p className="text-xs text-[#77756F] mt-1">
              {pagination.count} total orders
            </p>
          </div>

          <ShoppingBag
            size={22}
            className="text-[#A98250]"
          />
        </div>

        {error && (
          <div className="m-5 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
            <button
              onClick={fetchOrders}
              className="ml-3 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead>
              <tr className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-[#77756F]"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-[#77756F]"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-[#DED7CA] hover:bg-[#F7F4EE]/60"
                  >
                    <td className="px-5 py-5">
                      <p className="font-medium text-sm text-[#18352B]">
                        {order.order_number}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        ID: {order.id}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm text-[#18352B]">
                        {order.customer_name || "Customer"}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        {order.customer_email}
                      </p>
                    </td>

                    <td className="px-5 py-5 text-sm text-[#77756F]">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="px-5 py-5 text-sm font-medium text-[#18352B]">
                      {formatCurrency(order.total_amount)}
                    </td>

                    <td className="px-5 py-5">
                      <StatusBadge
                        status={order.payment_status}
                        payment
                      />
                    </td>

                    <td className="px-5 py-5">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-5">
                      <button
                        onClick={() =>
                          navigate(`/admin/orders/${order.id}`)
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#A98250] text-[#18352B] text-xs hover:bg-[#A98250] hover:text-white transition-colors"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-[#DED7CA]">
            <p className="text-xs text-[#77756F]">
              Showing {startItem}–{endItem} of {pagination.count} orders
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={!pagination.previous || loading}
                onClick={() => setPage((prev) => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 border border-[#DED7CA] text-sm disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="text-sm text-[#18352B]">
                Page {page}
              </span>

              <button
                disabled={!pagination.next || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 border border-[#DED7CA] text-sm disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}