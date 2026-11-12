import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star, Send, MessageSquare, UserRound, LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createProductReview,
  getMyReviews,
  getProductRatingSummary,
  getProductReviews,
} from "../../services/catalogueService";

const EMPTY_SUMMARY = {
  average_rating: 0,
  total_reviews: 0,
  rating_distribution: {},
};

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function StarRating({ value = 0, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(Number(value) || 0)
            ? "fill-[#A98250] text-[#A98250]"
            : "text-[#D8D0C3]"}
        />
      ))}
    </span>
  );
}

export default function ProductReviews({ product }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");

    try {
      const [reviewResponse, summaryResponse] = await Promise.all([
        getProductReviews(product.id),
        getProductRatingSummary(product.id),
      ]);

      setReviews(unwrapList(reviewResponse));
      setSummary({
        ...EMPTY_SUMMARY,
        ...(summaryResponse || {}),
      });

      if (isAuthenticated) {
        try {
          const mineResponse = await getMyReviews();
          const mine = unwrapList(mineResponse);
          const existing = mine.find(
            (item) => Number(item.product) === Number(product.id)
              || Number(item.product_id) === Number(product.id)
              || Number(item.product?.id) === Number(product.id)
          );
          setMyReview(existing || null);
        } catch {
          // Public reviews should remain visible even if the customer's review history is unavailable.
        }
      } else {
        setMyReview(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load customer reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // Product ID and authentication state determine which review data is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, isAuthenticated]);

  const averageRating = useMemo(
    () => Number(summary.average_rating ?? summary.average ?? summary.average_rating_value ?? 0),
    [summary]
  );
  const totalReviews = Number(summary.total_reviews ?? summary.review_count ?? summary.count ?? 0);
  const distribution = summary.rating_distribution || summary.distribution || {};

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await createProductReview({
        product: product.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      setTitle("");
      setComment("");
      setRating(5);
      setSuccess("Thank you! Your review has been published.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-20 border-t border-[#DED7CA] pt-14" id="customer-reviews">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#A98250]">
            Customer Feedback
          </p>
          <h2 className="font-serif text-3xl text-[#18352B] md:text-4xl">
            Reviews & Ratings
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#77756F]">
            Discover what customers think about this piece.
          </p>
        </div>

        <div className="flex items-center gap-4 border border-[#DED7CA] bg-white/50 px-5 py-4">
          <div className="text-center">
            <p className="font-serif text-3xl text-[#18352B]">
              {averageRating ? averageRating.toFixed(1) : "—"}
            </p>
            <StarRating value={averageRating} size={14} />
            <p className="mt-1 text-xs text-[#77756F]">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      {totalReviews > 0 && (
        <div className="mb-12 max-w-xl space-y-2">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = Number(
              distribution[score] ?? distribution[String(score)] ?? 0
            );
            const percentage = totalReviews ? (count / totalReviews) * 100 : 0;

            return (
              <div key={score} className="flex items-center gap-3 text-xs text-[#77756F]">
                <span className="w-3">{score}</span>
                <Star size={13} className="fill-[#A98250] text-[#A98250]" />
                <div className="h-2 flex-1 overflow-hidden bg-[#E8E1D6]">
                  <div
                    className="h-full bg-[#A98250]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div>
          <h3 className="mb-6 flex items-center gap-2 font-serif text-2xl text-[#18352B]">
            <MessageSquare size={20} className="text-[#A98250]" />
            What customers say
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[#77756F]">
              <LoaderCircle size={17} className="animate-spin" />
              Loading reviews...
            </div>
          ) : error && reviews.length === 0 ? (
            <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
          ) : reviews.length === 0 ? (
            <div className="border border-[#DED7CA] px-6 py-10 text-center">
              <MessageSquare size={26} className="mx-auto mb-3 text-[#A98250]" />
              <p className="font-serif text-xl text-[#18352B]">No reviews yet</p>
              <p className="mt-2 text-sm text-[#77756F]">
                Be the first to share your experience with this product.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DED7CA]">
              {reviews.map((review) => (
                <article key={review.id} className="py-6 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRating value={review.rating} size={14} />
                    <time className="text-xs text-[#8A877F]">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </time>
                  </div>
                  {review.title && (
                    <h4 className="mt-3 font-medium text-[#18352B]">{review.title}</h4>
                  )}
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#77756F]">
                    {review.comment}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#77756F]">
                    <UserRound size={14} className="text-[#A98250]" />
                    <span>{review.customer_name || "Customer"}</span>
                    {review.is_verified_purchase && (
                      <span className="border border-[#DED7CA] px-2 py-1 text-[10px] uppercase tracking-wider text-[#18352B]">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="h-fit border border-[#DED7CA] bg-white/40 p-6 md:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#A98250]">
            Share your experience
          </p>
          <h3 className="font-serif text-2xl text-[#18352B]">Write a Review</h3>

          {myReview ? (
            <div className="mt-6 border border-[#DED7CA] bg-[#F7F4EE] p-4">
              <StarRating value={myReview.rating} />
              <p className="mt-3 text-sm font-medium text-[#18352B]">
                You have already reviewed this product.
              </p>
              <p className="mt-1 text-xs leading-5 text-[#77756F]">
                You can manage your review from My Reviews in your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-wider text-[#77756F]">
                  Your Rating
                </label>
                <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onMouseEnter={() => setHoverRating(score)}
                      onFocus={() => setHoverRating(score)}
                      onBlur={() => setHoverRating(0)}
                      onClick={() => setRating(score)}
                      aria-label={`Rate ${score} out of 5`}
                      className="p-1"
                    >
                      <Star
                        size={25}
                        className={score <= (hoverRating || rating)
                          ? "fill-[#A98250] text-[#A98250]"
                          : "text-[#D8D0C3]"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-title" className="mb-2 block text-xs uppercase tracking-wider text-[#77756F]">
                  Review Title <span className="normal-case">(optional)</span>
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  className="w-full border border-[#DED7CA] bg-transparent px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
                  placeholder="Summarise your experience"
                />
              </div>

              <div>
                <label htmlFor="review-comment" className="mb-2 block text-xs uppercase tracking-wider text-[#77756F]">
                  Your Review
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={5}
                  maxLength={5000}
                  required
                  className="w-full resize-y border border-[#DED7CA] bg-transparent px-4 py-3 text-sm leading-6 text-[#18352B] outline-none focus:border-[#A98250]"
                  placeholder="Tell others about your experience..."
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 bg-[#18352B] px-5 py-4 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {submitting ? "Submitting..." : "Submit Review"}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs leading-5 text-[#77756F]">
                  You will be asked to sign in before submitting your review.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
