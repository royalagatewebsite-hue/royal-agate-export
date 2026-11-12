import { apiRequest } from "./api";

export function getProducts(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const query = queryParams.toString();

  return apiRequest(
    `/catalogue/products/${query ? `?${query}` : ""}`
  );
}

export function getCategories() {
  return apiRequest("/catalogue/categories/");
}

export function createCategory(payload) {
  return apiRequest("/catalogue/categories/", {
    method: "POST",
    body: payload,
  });
}

export function updateCategory(id, payload) {
  return apiRequest(`/catalogue/categories/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteCategory(id) {
  return apiRequest(`/catalogue/categories/${id}/`, {
    method: "DELETE",
  });
}

export function getProductBySlug(slug) {
  return apiRequest(`/catalogue/products/${slug}/`);
}

export function createProduct(payload) {
  return apiRequest("/catalogue/products/", {
    method: "POST",
    body: payload,
  });
}

export function updateProduct(slug, payload) {
  return apiRequest(`/catalogue/products/${slug}/`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProduct(slug) {
  return apiRequest(`/catalogue/products/${slug}/`, {
    method: "DELETE",
  });
}

export function getProductImages() {
  return apiRequest("/catalogue/product-images/");
}

export function createProductImage(payload) {
  return apiRequest("/catalogue/product-images/", {
    method: "POST",
    body: payload,
  });
}

export function updateProductImage(id, payload) {
  return apiRequest(`/catalogue/product-images/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProductImage(id) {
  return apiRequest(`/catalogue/product-images/${id}/`, {
    method: "DELETE",
  });
}

// =====================================
// PRODUCT VIDEO APIs
// =====================================

export function getProductVideos() {
  return apiRequest("/catalogue/product-videos/");
}

export function createProductVideo(payload) {
  return apiRequest("/catalogue/product-videos/", {
    method: "POST",
    body: payload,
  });
}

export function updateProductVideo(id, payload) {
  return apiRequest(`/catalogue/product-videos/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProductVideo(id) {
  return apiRequest(`/catalogue/product-videos/${id}/`, {
    method: "DELETE",
  });
}

// =====================================
// PRODUCT REVIEW APIs
// =====================================

// Get approved reviews for a product
export function getProductReviews(productId) {
  return apiRequest(
    `/reviews/product-reviews/?product=${productId}`
  );
}

// Get product rating summary
export function getProductRatingSummary(productId) {
  return apiRequest(
    `/reviews/products/${productId}/rating-summary/`
  );
}

// Submit a customer review
export function createProductReview(payload) {
  return apiRequest("/reviews/create/", {
    method: "POST",
    body: payload,
  });
}

// Get logged-in customer's reviews
export function getMyReviews() {
  return apiRequest("/reviews/my-reviews/");
}

// Update an existing review
export function updateMyReview(id, payload) {
  return apiRequest(`/reviews/my-reviews/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

// Delete an existing review
export function deleteMyReview(id) {
  return apiRequest(`/reviews/my-reviews/${id}/`, {
    method: "DELETE",
  });
}

// Admin: Get reviews
export function getAdminReviews(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const query = queryParams.toString();

  return apiRequest(
    `/reviews/admin/reviews/${query ? `?${query}` : ""}`
  );
}

export function getAdminReviewStats() {
  return apiRequest("/reviews/admin/reviews/stats/");
}

// Admin: Mark all reviews as read
export function markAdminReviewsAsRead() {
  return apiRequest("/reviews/admin/reviews/mark-read/", {
    method: "POST",
  });
}

// Admin: Permanently delete an inappropriate review
export function deleteAdminReview(id) {
  return apiRequest(`/reviews/admin/reviews/${id}/delete/`, {
    method: "DELETE",
  });
}