import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Pencil,
  Trash2,
  RefreshCw,
  MessageSquare,
  LoaderCircle,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  getMyReviews,
  updateMyReview,
  deleteMyReview,
} from "../../services/catalogueService";

const getReviewList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Stars({ rating, size = 17 }) {
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

function productLabel(review) {
  if (review.product && typeof review.product === "object") {
    return review.product.name || `Product #${review.product.id ?? ""}`;
  }
  return review.product_name || `Product #${review.product ?? "—"}`;
}

function EditReviewModal({ review, onClose, onSave, saving, error }) {
  const [rating, setRating] = useState(Number(review.rating) || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(review.title || "");
  const [comment, setComment] = useState(review.comment || "");

  const submit = (event) => {
    event.preventDefault();
    onSave({ rating, title: title.trim(), comment: comment.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[#DED7CA] bg-[#FAF8F3] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98250]">
              Customer Feedback
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#18352B]">Edit Your Review</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit review"
            className="p-2 text-[#77756F] hover:text-[#18352B] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label className="mb-3 block text-[10px] uppercase tracking-[0.16em] text-[#18352B]">
              Your Rating
            </label>
            <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                  className="p-1"
                >
                  <Star
                    size={25}
                    className={value <= (hoverRating || rating)
                      ? "fill-[#A98250] text-[#A98250]"
                      : "text-[#D8D0C3]"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="edit-review-title" className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-[#18352B]">
              Review Title <span className="normal-case">(optional)</span>
            </label>
            <input
              id="edit-review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              className="w-full border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
            />
          </div>

          <div>
            <label htmlFor="edit-review-comment" className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-[#18352B]">
              Your Review
            </label>
            <textarea
              id="edit-review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              maxLength={5000}
              required
              className="w-full resize-y border border-[#DED7CA] bg-white px-4 py-3 text-sm leading-6 text-[#18352B] outline-none focus:border-[#A98250]"
            />
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="border border-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-[#18352B] hover:bg-[#F0ECE3] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !comment.trim()}
              className="inline-flex items-center justify-center gap-2 bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-[#A98250] disabled:opacity-50"
            >
              {saving && <LoaderCircle size={14} className="animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async (showRefresh = false) => {
    try {
      setError("");
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getMyReviews();
      setReviews(getReviewList(response));
    } catch (err) {
      setError(err.message || "Unable to load your reviews.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSave = async (payload) => {
    if (!editingReview) return;
    try {
      setSaving(true);
      setEditError("");
      await updateMyReview(editingReview.id, payload);
      setEditingReview(null);
      setSuccess("Your review has been updated successfully.");
      await fetchReviews(true);
    } catch (err) {
      setEditError(err.message || "Unable to update your review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      "Permanently delete your review? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await deleteMyReview(review.id);
      setSuccess("Your review has been deleted.");
      await fetchReviews(true);
    } catch (err) {
      setError(err.message || "Unable to delete your review.");
    }
  };

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 border-b border-[#DED7CA] pb-8">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#A98250]">
            Your Royal Agate Account
          </p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-serif text-4xl text-[#18352B] md:text-5xl">My Reviews</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#77756F]">
                View and manage the feedback you have shared with Royal Agate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchReviews(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 self-start border border-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#18352B] transition hover:bg-[#18352B] hover:text-white disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh Reviews
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-sm text-[#77756F]">
            <LoaderCircle size={28} className="animate-spin text-[#A98250]" />
            Loading your reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="border border-[#DED7CA] bg-[#FAF8F3] px-6 py-16 text-center">
            <MessageSquare size={38} strokeWidth={1.3} className="mx-auto text-[#A98250]" />
            <h2 className="mt-5 font-serif text-2xl text-[#18352B]">No Reviews Yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77756F]">
              Reviews you submit on product pages will appear here. Share your experience with other customers.
            </p>
            <Link
              to="/collections"
              className="mt-7 inline-flex items-center gap-3 bg-[#18352B] px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#A98250]"
            >
              Explore Collection <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-[#77756F]">Your Feedback</p>
              <p className="text-xs text-[#77756F]">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>

            {reviews.map((review) => (
              <article
                key={review.id}
                className="border border-[#DED7CA] bg-white p-5 transition hover:border-[#A98250] md:p-7"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#A98250]">
                      {productLabel(review)}
                    </p>
                    {review.title && (
                      <h2 className="mt-2 font-serif text-2xl text-[#18352B]">{review.title}</h2>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-[#77756F]">
                        Submitted {formatDate(review.created_at)}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] uppercase tracking-wider text-emerald-700">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReview(review);
                        setEditError("");
                      }}
                      className="inline-flex items-center gap-2 border border-[#DED7CA] px-4 py-3 text-[10px] uppercase tracking-[0.13em] text-[#18352B] transition hover:bg-[#18352B] hover:text-white"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(review)}
                      className="inline-flex items-center gap-2 border border-red-200 px-4 py-3 text-[10px] uppercase tracking-[0.13em] text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-line border border-[#DED7CA] bg-[#F7F4EE] p-5 text-sm leading-7 text-[#77756F]">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingReview && (
        <EditReviewModal
          key={editingReview.id}
          review={editingReview}
          onClose={() => {
            if (!saving) {
              setEditingReview(null);
              setEditError("");
            }
          }}
          onSave={handleSave}
          saving={saving}
          error={editError}
        />
      )}
    </section>
  );
}
