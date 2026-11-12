import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

import {
  getAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiry,
} from "../../services/contactService";

// ==========================================
// CONSTANTS
// ==========================================

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const statusStyles = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="bg-white border border-[#DED7CA] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77756F]">{title}</p>
        <Icon size={22} className="text-[#A98250]" />
      </div>

      <h2 className="font-serif text-3xl text-[#18352B] mt-5">
        {value}
      </h2>

      <p className="text-xs text-[#A98250] mt-2">
        {description}
      </p>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium border ${
        statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {status?.replace("_", " ") || "Unknown"}
    </span>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // SEARCH DEBOUNCE
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ==========================================
  // FETCH ENQUIRIES + STATISTICS
  // ==========================================

  const fetchEnquiries = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [listResponse, allResponse, newResponse, progressResponse, resolvedResponse] =
        await Promise.all([
          getAdminEnquiries({
            search,
            status: statusFilter,
            page,
          }),

          getAdminEnquiries(),
          getAdminEnquiries({ status: "NEW" }),
          getAdminEnquiries({ status: "IN_PROGRESS" }),
          getAdminEnquiries({ status: "RESOLVED" }),
        ]);

      const results = Array.isArray(listResponse)
        ? listResponse
        : listResponse?.results || [];

      setEnquiries(results);

      setHasNext(Boolean(listResponse?.next));
      setHasPrevious(Boolean(listResponse?.previous));

      setStats({
        total: allResponse?.count ?? allResponse?.length ?? 0,
        new: newResponse?.count ?? newResponse?.length ?? 0,
        inProgress:
          progressResponse?.count ?? progressResponse?.length ?? 0,
        resolved:
          resolvedResponse?.count ?? resolvedResponse?.length ?? 0,
      });
    } catch (err) {
      setError(err.message || "Unable to load enquiries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ==========================================
  // VIEW ENQUIRY DETAILS
  // ==========================================

  const openDetails = async (id) => {
    try {
      setSelectedEnquiry(null);
      setDetailLoading(true);
      setActionError("");
      setSuccessMessage("");

      const response = await getAdminEnquiryById(id);

      setSelectedEnquiry(response);
      setAdminStatus(response.status);
      setAdminNotes(response.admin_notes || "");
    } catch (err) {
      setError(err.message || "Unable to load enquiry details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // UPDATE ENQUIRY
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedEnquiry) return;

    try {
      setSaving(true);
      setActionError("");
      setSuccessMessage("");

      const updated = await updateAdminEnquiry(selectedEnquiry.id, {
        status: adminStatus,
        admin_notes: adminNotes,
      });

      setSelectedEnquiry(updated);

      setAdminStatus(updated.status);
      setAdminNotes(updated.admin_notes || "");

      setSuccessMessage("Enquiry updated successfully.");

      await fetchEnquiries(true);
    } catch (err) {
      setActionError(err.message || "Unable to update enquiry.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    fetchEnquiries(true);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A98250] mb-2">
            Customer Relations
          </p>

          <h1 className="font-serif text-3xl text-[#18352B]">
            Enquiry Management
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Manage customer messages and business enquiries.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-5 py-3 border border-[#DED7CA] bg-white text-[#18352B] hover:bg-[#F7F4EE] transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Enquiries"
          value={loading ? "..." : stats.total}
          icon={MessageSquare}
          description="All customer enquiries"
        />

        <StatCard
          title="New Enquiries"
          value={loading ? "..." : stats.new}
          icon={AlertCircle}
          description="Awaiting attention"
        />

        <StatCard
          title="In Progress"
          value={loading ? "..." : stats.inProgress}
          icon={Clock}
          description="Currently being handled"
        />

        <StatCard
          title="Resolved"
          value={loading ? "..." : stats.resolved}
          icon={CheckCircle}
          description="Successfully handled"
        />
      </div>

      {/* ENQUIRIES TABLE */}

      <div className="bg-white border border-[#DED7CA]">
        {/* TABLE HEADER */}

        <div className="p-5 border-b border-[#DED7CA] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-medium text-[#18352B]">
              All Enquiries
            </h2>

            <p className="text-xs text-[#77756F] mt-1">
              Customer messages received by Royal Agate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* SEARCH */}

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search enquiries..."
                className="w-full sm:w-64 border border-[#DED7CA] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
              />
            </div>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border border-[#DED7CA] px-4 py-3 text-sm bg-white outline-none focus:border-[#A98250]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F4EE] text-[#77756F]">
              <tr>
                <th className="text-left px-5 py-4 font-medium uppercase text-xs">
                  Customer
                </th>

                <th className="text-left px-5 py-4 font-medium uppercase text-xs">
                  Subject
                </th>

                <th className="text-left px-5 py-4 font-medium uppercase text-xs">
                  Date
                </th>

                <th className="text-left px-5 py-4 font-medium uppercase text-xs">
                  Status
                </th>

                <th className="text-right px-5 py-4 font-medium uppercase text-xs">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-12 text-[#77756F]"
                  >
                    Loading enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <MessageSquare
                      size={35}
                      className="mx-auto text-[#A98250] mb-3"
                    />

                    <p className="text-[#18352B] font-medium">
                      No enquiries found
                    </p>

                    <p className="text-xs text-[#77756F] mt-2">
                      Customer enquiries will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[#DED7CA] hover:bg-[#F7F4EE]/60"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#18352B]">
                        {item.name}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        {item.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[#18352B] max-w-[220px]">
                      <p className="truncate">{item.subject}</p>
                    </td>

                    <td className="px-5 py-4 text-[#77756F] whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetails(item.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#DED7CA] text-[#18352B] hover:bg-[#18352B] hover:text-white transition-colors"
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

        {/* PAGINATION */}

        <div className="p-5 border-t border-[#DED7CA] flex items-center justify-between">
          <p className="text-xs text-[#77756F]">
            Page {page}
          </p>

          <div className="flex items-center gap-3">
            <button
              disabled={!hasPrevious || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-2 px-4 py-2 border border-[#DED7CA] text-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              disabled={!hasNext || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 border border-[#DED7CA] text-sm disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAILS LOADING */}

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-8 text-[#18352B]">
            Loading enquiry details...
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}

      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between p-6 border-b border-[#DED7CA]">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A98250]">
                  Customer Message
                </p>

                <h2 className="font-serif text-2xl text-[#18352B] mt-1">
                  Enquiry Details
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelectedEnquiry(null);
                  setSuccessMessage("");
                  setActionError("");
                }}
                className="p-2 hover:bg-[#F7F4EE]"
              >
                <X size={22} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="p-6 space-y-6">
              {/* CUSTOMER INFORMATION */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-[#77756F] mb-2">
                    Customer Name
                  </p>

                  <p className="font-medium text-[#18352B]">
                    {selectedEnquiry.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#77756F] mb-2">
                    Email Address
                  </p>

                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="flex items-center gap-2 text-sm text-[#A98250] break-all"
                  >
                    <Mail size={15} />
                    {selectedEnquiry.email}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-[#77756F] mb-2">
                    Phone Number
                  </p>

                  {selectedEnquiry.phone ? (
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="flex items-center gap-2 text-sm text-[#18352B]"
                    >
                      <Phone size={15} />
                      {selectedEnquiry.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-[#77756F]">Not provided</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-[#77756F] mb-2">
                    Received On
                  </p>

                  <p className="flex items-center gap-2 text-sm text-[#18352B]">
                    <Calendar size={15} />
                    {formatDate(selectedEnquiry.created_at)}
                  </p>
                </div>
              </div>

              {/* SUBJECT */}

              <div className="border-t border-[#DED7CA] pt-5">
                <p className="text-xs text-[#77756F] mb-2">
                  Subject
                </p>

                <p className="font-medium text-[#18352B]">
                  {selectedEnquiry.subject}
                </p>
              </div>

              {/* MESSAGE */}

              <div>
                <p className="text-xs text-[#77756F] mb-2">
                  Customer Message
                </p>

                <div className="bg-[#F7F4EE] border border-[#DED7CA] p-5 text-sm text-[#18352B] leading-7 whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* ADMIN UPDATE FORM */}

              <form onSubmit={handleUpdate} className="border-t border-[#DED7CA] pt-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#18352B] mb-2">
                    Enquiry Status
                  </label>

                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value)}
                    className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                  >
                    {STATUS_OPTIONS.filter((option) => option.value).map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#18352B] mb-2">
                    Admin Notes
                  </label>

                  <textarea
                    rows="4"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this enquiry..."
                    className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250] resize-none"
                  />
                </div>

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {actionError}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
                    {successMessage}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiry(null)}
                    className="px-5 py-3 border border-[#DED7CA] text-sm text-[#18352B]"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-[#18352B] text-white text-sm hover:bg-[#254A3D] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}