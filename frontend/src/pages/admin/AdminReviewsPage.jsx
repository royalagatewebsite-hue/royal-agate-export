import { useCallback, useEffect, useState } from "react";
import {
  Star,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  MessageSquare,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminReviews,
  getAdminReviewStats,
  markAdminReviewsAsRead,
  deleteAdminReview,
} from "../../services/catalogueService";


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

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="border border-[#DED7CA] bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77756F]">{title}</p>
        <Icon size={22} className="text-[#A98250]" />
      </div>
      <h2 className="mt-5 font-serif text-3xl text-[#18352B]">{value}</h2>
      <p className="mt-2 text-xs text-[#A98250]">{description}</p>
    </div>
  );
}

function Stars({ rating, size = 15 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          className={value <= Number(rating)
            ? "fill-[#A98250] text-[#A98250]"
            : "text-[#D8D0C3]"}
        />
      ))}
    </span>
  );
}

function getProductLabel(review) {
  if (typeof review.product === "object" && review.product !== null) {
    return review.product.name || `Product #${review.product.id ?? ""}`;
  }
  return review.product_name || `Product #${review.product ?? "—"}`;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    unread_reviews: 0,
  });

  const [markingRead, setMarkingRead] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getAdminReviews({
        page,
        search: debouncedSearch,
        rating: ratingFilter,
      });

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setReviews(results);
      setTotal(response?.count ?? results.length);
      setHasNext(Boolean(response?.next));
      setHasPrevious(Boolean(response?.previous));

      // Global statistics
      try {
        const statsResponse = await getAdminReviewStats();

        setStats({
          total_reviews: statsResponse?.total_reviews ?? 0,
          average_rating: statsResponse?.average_rating ?? 0,
          unread_reviews: statsResponse?.unread_reviews ?? 0,
        });
      } catch (statsError) {
        console.error("Unable to load review statistics:", statsError);
      }

    } catch (err) {
      setError(err.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingRead(true);
      setError("");
      setSuccess("");

      const response = await markAdminReviewsAsRead();

      setSuccess(
        `${response?.updated_count ?? 0} reviews marked as read.`
      );

      await fetchReviews(true);

      // Notify sidebar to refresh notification badges.
      window.dispatchEvent(
        new Event("admin-notifications-refresh")
      );
    } catch (err) {
      setError(err.message || "Unable to mark reviews as read.");
    } finally {
      setMarkingRead(false);
    }
  };

  

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      "Permanently delete this review? This action cannot be undone. Only remove content that is fake, spam, abusive, or otherwise inappropriate. Genuine negative feedback should remain visible."
    );
    if (!confirmed) return;

    try {
      setDeletingId(review.id);
      setError("");
      setSuccess("");
      await deleteAdminReview(review.id);
      setSelectedReview(null);
      setSuccess("Review permanently deleted.");
      await fetchReviews(true);
    } catch (err) {
      setError(err.message || "Unable to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#A98250]">
            Customer Relations
          </p>
          <h1 className="font-serif text-3xl text-[#18352B]">Review Management</h1>
          <p className="mt-2 text-sm text-[#77756F]">
            Monitor customer feedback and remove only inappropriate reviews.
          </p>
        </div>
          <div className="flex flex-wrap items-center gap-3">
            {stats.unread_reviews > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingRead}
                className="flex items-center justify-center gap-2 border border-[#A98250] bg-[#18352B] px-5 py-3 text-white transition hover:bg-[#25483B] disabled:opacity-50"
              >
                <Eye size={16} />
                {markingRead ? "Marking..." : `Mark All as Read (${stats.unread_reviews})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchReviews(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 border border-[#DED7CA] bg-white px-5 py-3 text-[#18352B] transition hover:bg-[#F7F4EE] disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
      </div>

      {error && (
        <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatCard
          title="Total Reviews"
          value={loading ? "..." : stats.total_reviews}
          icon={MessageSquare}
          description="All customer-submitted reviews"
        />
        <StatCard
          title="Average Rating"
          value={
            loading
              ? "..."
              : Number(stats.average_rating).toFixed(1)
          }
          icon={Star}
          description="Average across all customer reviews"
        />
      </div>

      <div className="border border-[#DED7CA] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#DED7CA] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-medium text-[#18352B]">All Customer Reviews</h2>
            <p className="mt-1 text-xs text-[#77756F]">
              Reviews are published immediately; there is no approval queue.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
              />
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Search customers, products, reviews..."
                className="w-full border border-[#DED7CA] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#A98250] sm:w-64"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setPage(1);
              }}
              className="border border-[#DED7CA] bg-white px-4 py-3 text-sm outline-none focus:border-[#A98250]"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} Stars</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F4EE] text-xs uppercase text-[#77756F]">
              <tr>
                <th className="px-5 py-4 text-left font-medium">Customer</th>
                <th className="px-5 py-4 text-left font-medium">Product</th>
                <th className="px-5 py-4 text-left font-medium">Rating</th>
                <th className="px-5 py-4 text-left font-medium">Date</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#77756F]">
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={17} className="animate-spin" />
                      Loading reviews...
                    </span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <MessageSquare size={34} className="mx-auto mb-3 text-[#A98250]" />
                    <p className="font-medium text-[#18352B]">No reviews found</p>
                    <p className="mt-2 text-xs text-[#77756F]">
                      Customer reviews will appear here.
                    </p>
                  </td>
                </tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className="border-t border-[#DED7CA] hover:bg-[#F7F4EE]/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#18352B]">
                      {review.customer_name || "Customer"}
                    </p>
                    {review.is_verified_purchase && (
                      <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-green-700">
                        Verified Purchase
                      </span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-5 py-4 text-[#18352B]">
                    <span className="block truncate">{getProductLabel(review)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#77756F]">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReview(review)}
                        className="inline-flex items-center gap-2 border border-[#DED7CA] px-3 py-2 text-[#18352B] transition hover:bg-[#18352B] hover:text-white"
                      >
                        <Eye size={15} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(review)}
                        disabled={deletingId === review.id}
                        title="Permanently delete inappropriate review"
                        className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#DED7CA] p-5">
          <p className="text-xs text-[#77756F]">Page {page} · {total} matching reviews</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!hasPrevious || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex items-center gap-2 border border-[#DED7CA] px-4 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((current) => current + 1)}
              className="flex items-center gap-2 border border-[#DED7CA] px-4 py-2 text-sm disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-[#DED7CA] p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A98250]">Customer Feedback</p>
                <h2 className="mt-1 font-serif text-2xl text-[#18352B]">Review Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-2 hover:bg-[#F7F4EE]"
                aria-label="Close review details"
              >
                <X size={22} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Stars rating={selectedReview.rating} size={18} />
                <span className="text-xs text-[#77756F]">{formatDate(selectedReview.created_at)}</span>
              </div>
              <div>
                <p className="text-xs text-[#77756F]">Customer</p>
                <p className="mt-1 font-medium text-[#18352B]">
                  {selectedReview.customer_name || "Customer"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#77756F]">Product</p>
                <p className="mt-1 font-medium text-[#18352B]">{getProductLabel(selectedReview)}</p>
              </div>
              {selectedReview.title && (
                <div>
                  <p className="text-xs text-[#77756F]">Review Title</p>
                  <p className="mt-1 font-medium text-[#18352B]">{selectedReview.title}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#77756F]">Review</p>
                <div className="mt-2 whitespace-pre-wrap border border-[#DED7CA] bg-[#F7F4EE] p-5 text-sm leading-7 text-[#18352B]">
                  {selectedReview.comment}
                </div>
              </div>
              {selectedReview.is_verified_purchase && (
                <p className="text-xs text-green-700">Verified Purchase</p>
              )}
              <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                Genuine negative feedback should remain published. Delete only fake, spam, abusive, or otherwise inappropriate content.
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedReview)}
                  disabled={deletingId === selectedReview.id}
                  className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 text-sm text-white transition hover:bg-red-800 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deletingId === selectedReview.id ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
