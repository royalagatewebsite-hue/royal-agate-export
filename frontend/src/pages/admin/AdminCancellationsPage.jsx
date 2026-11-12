import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
} from "lucide-react";

import {
  getAdminCancellations,
  approveAdminCancellation,
  rejectAdminCancellation,
} from "../../services/orderService";

const STATUS_OPTIONS = [
  "ALL",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "DIRECT_CANCELLED",
];

export default function AdminCancellationsPage() {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [reviewAction, setReviewAction] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchCancellations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCancellations(
        statusFilter === "ALL" ? "" : statusFilter
      );

      const data = response.results || response;

      setCancellations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cancellation fetch error:", err);
      setError(err.message || "Unable to load cancellation requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellations();
  }, [statusFilter]);

  const filteredCancellations = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return cancellations;

    return cancellations.filter((item) => {
      return (
        item.order_number?.toLowerCase().includes(value) ||
        item.reason?.toLowerCase().includes(value) ||
        String(item.order || "").includes(value)
      );
    });
  }, [cancellations, search]);

  const stats = useMemo(() => ({
    total: cancellations.length,
    pending: cancellations.filter(
      (item) => ["PENDING", "REQUESTED"].includes(item.status)
    ).length,
    approved: cancellations.filter(
      (item) => item.status === "APPROVED"
    ).length,
    rejected: cancellations.filter(
      (item) => item.status === "REJECTED"
    ).length,
  }), [cancellations]);

  const openReviewModal = (item, action) => {
    setSelectedCancellation(item);
    setReviewAction(action);
    setAdminNote("");
  };

  const closeReviewModal = () => {
    if (processing) return;

    setSelectedCancellation(null);
    setReviewAction("");
    setAdminNote("");
  };

  const handleReview = async (e) => {
    e.preventDefault();

    if (!selectedCancellation) return;

    try {
      setProcessing(true);

      if (reviewAction === "APPROVE") {
        await approveAdminCancellation(
          selectedCancellation.id,
          adminNote
        );
      } else {
        await rejectAdminCancellation(
          selectedCancellation.id,
          adminNote
        );
      }

      closeReviewModal();
      await fetchCancellations();
    } catch (err) {
      console.error("Cancellation review error:", err);

      window.alert(
        err.message || "Unable to process cancellation request."
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const styles = {
      PENDING: "bg-amber-50 text-amber-700",
      REQUESTED: "bg-amber-50 text-amber-700",
      APPROVED: "bg-green-50 text-green-700",
      REJECTED: "bg-red-50 text-red-700",
      DIRECT_CANCELLED: "bg-gray-100 text-gray-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A98250] mb-2">
            Order Management
          </p>

          <h1 className="text-3xl font-serif text-[#18352B]">
            Cancellation Requests
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Review and manage customer cancellation requests.
          </p>
        </div>

        <button
          onClick={fetchCancellations}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D] transition"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Requests
        </button>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">Total Requests</p>
            <ClipboardList size={22} className="text-[#A98250]" />
          </div>

          <h2 className="text-3xl font-serif text-[#18352B] mt-3">
            {stats.total}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">Pending</p>
            <Clock size={22} className="text-amber-600" />
          </div>

          <h2 className="text-3xl font-serif text-amber-600 mt-3">
            {stats.pending}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">Approved</p>
            <CheckCircle size={22} className="text-green-700" />
          </div>

          <h2 className="text-3xl font-serif text-green-700 mt-3">
            {stats.approved}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">Rejected</p>
            <XCircle size={22} className="text-red-600" />
          </div>

          <h2 className="text-3xl font-serif text-red-600 mt-3">
            {stats.rejected}
          </h2>
        </div>

      </div>

      {/* FILTERS */}
      <div className="bg-white border border-[#DED7CA] p-5">

        <div className="flex items-center gap-2 mb-5">
          <Filter size={18} className="text-[#A98250]" />

          <h2 className="font-medium text-[#18352B]">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number or reason..."
              className="w-full border border-[#DED7CA] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL"
                  ? "All Requests"
                  : status.replace("_", " ")}
              </option>
            ))}
          </select>

        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#A98250] hover:text-[#18352B]"
          >
            <X size={14} />
            Clear Filters
          </button>
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 p-4 text-red-700">

          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>

          <button
            onClick={fetchCancellations}
            className="text-sm underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-[#DED7CA]">

        <div className="px-5 py-5 border-b border-[#DED7CA]">
          <h2 className="font-serif text-xl text-[#18352B]">
            Cancellation Requests
          </h2>

          <p className="text-xs text-[#77756F] mt-1">
            {filteredCancellations.length} requests found
          </p>
        </div>

        {loading ? (

          <div className="flex justify-center items-center py-20">
            <RefreshCw
              size={25}
              className="animate-spin text-[#A98250]"
            />

            <span className="ml-3 text-sm text-[#77756F]">
              Loading requests...
            </span>
          </div>

        ) : !error && filteredCancellations.length === 0 ? (

          <div className="text-center py-20">
            <ClipboardList
              size={42}
              className="mx-auto text-[#A98250] mb-4"
            />

            <h3 className="text-lg font-serif text-[#18352B]">
              No Cancellation Requests Found
            </h3>

            <p className="text-sm text-[#77756F] mt-2">
              There are no requests matching your filters.
            </p>
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">

                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Requested Date</th>
                  <th className="px-5 py-4">Order Status</th>
                  <th className="px-5 py-4">Request Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-[#DED7CA]">

                {filteredCancellations.map((item) => (

                  <tr
                    key={item.id}
                    className="hover:bg-[#F7F4EE]/60 transition"
                  >

                    <td className="px-5 py-4 min-w-[190px]">
                      <p className="text-sm font-medium text-[#18352B]">
                        {item.order_number || `Order #${item.order}`}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        Request ID: {item.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 min-w-[220px] max-w-[300px]">
                      <p className="text-sm text-[#77756F] line-clamp-2">
                        {item.reason}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77756F] whitespace-nowrap">
                      {formatDate(item.requested_at)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-[#18352B]">
                        {item.order_status || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium ${getStatusStyle(item.status)}`}
                      >
                        {item.status?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openReviewModal(item, "VIEW")}
                          title="View Details"
                          className="p-2 text-[#18352B] hover:bg-[#F7F4EE]"
                        >
                          <Eye size={17} />
                        </button>

                        {["PENDING", "REQUESTED"].includes(item.status) && (
                          <>
                            <button
                              onClick={() => openReviewModal(item, "APPROVE")}
                              title="Approve Request"
                              className="p-2 text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle size={17} />
                            </button>

                            <button
                              onClick={() => openReviewModal(item, "REJECT")}
                              title="Reject Request"
                              className="p-2 text-red-600 hover:bg-red-50"
                            >
                              <XCircle size={17} />
                            </button>
                          </>
                        )}

                      </div>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* DETAILS / REVIEW MODAL */}
      {selectedCancellation && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

            <div className="flex items-center justify-between px-6 py-5 border-b border-[#DED7CA]">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
                  Order Management
                </p>

                <h2 className="text-2xl font-serif text-[#18352B] mt-1">
                  {reviewAction === "APPROVE"
                    ? "Approve Cancellation"
                    : reviewAction === "REJECT"
                      ? "Reject Cancellation"
                      : "Cancellation Details"}
                </h2>
              </div>

              <button
                onClick={closeReviewModal}
                className="p-2 text-[#77756F] hover:bg-[#F7F4EE]"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Order Number
                </p>

                <p className="text-sm font-medium text-[#18352B]">
                  {selectedCancellation.order_number}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Cancellation Reason
                </p>

                <p className="text-sm text-[#18352B] leading-relaxed">
                  {selectedCancellation.reason}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#77756F] mb-1">
                  Current Request Status
                </p>

                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium ${getStatusStyle(selectedCancellation.status)}`}
                >
                  {selectedCancellation.status?.replace("_", " ")}
                </span>
              </div>

              {selectedCancellation.admin_note && (
                <div>
                  <p className="text-xs text-[#77756F] mb-1">
                    Admin Note
                  </p>

                  <p className="text-sm text-[#18352B]">
                    {selectedCancellation.admin_note}
                  </p>
                </div>
              )}

              {reviewAction !== "VIEW" && (
                <form onSubmit={handleReview} className="space-y-5">

                  <div>
                    <label className="block text-sm text-[#18352B] mb-2">
                      Admin Note (Optional)
                    </label>

                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Enter review note..."
                      className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#DED7CA]">

                    <button
                      type="button"
                      onClick={closeReviewModal}
                      disabled={processing}
                      className="px-5 py-3 border border-[#DED7CA] text-[#18352B] hover:bg-[#F7F4EE]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={processing}
                      className={`flex items-center gap-2 px-5 py-3 text-white disabled:opacity-60 ${
                        reviewAction === "APPROVE"
                          ? "bg-green-700 hover:bg-green-800"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {processing && (
                        <RefreshCw size={16} className="animate-spin" />
                      )}

                      {processing
                        ? "Processing..."
                        : reviewAction === "APPROVE"
                          ? "Approve Request"
                          : "Reject Request"}
                    </button>

                  </div>

                </form>
              )}

              {reviewAction === "VIEW" && (
                <div className="flex justify-end pt-4 border-t border-[#DED7CA]">
                  <button
                    onClick={closeReviewModal}
                    className="px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D]"
                  >
                    Close
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
