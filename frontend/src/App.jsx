import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Customer Layout
const CustomerLayout = lazy(() => import("./pages/CustomerLayout"));

// Catalogue
const ProductListingPage = lazy(
  () => import("./pages/catalogue/ProductListingPage")
);

const ProductDetailPage = lazy(
  () => import("./pages/catalogue/ProductDetailPage")
);

// Home
const HomePage = lazy(() => import("./pages/home/HomePage"));

// Authentication
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));

// Cart & Checkout
const CartPage = lazy(() => import("./pages/cart/CartPage"));
const CheckoutPage = lazy(() => import("./pages/checkout/CheckoutPage"));

// Customer Account
const MyOrdersPage = lazy(() => import("./pages/account/MyOrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/account/OrderDetailPage"));

const AccountDashboardPage = lazy(
  () => import("./pages/account/AccountDashboardPage")
);

const MyProfilePage = lazy(
  () => import("./pages/account/MyProfilePage")
);

const MyReviewsPage = lazy(
  () => import("./pages/account/MyReviewsPage")
);

const SavedAddressesPage = lazy(
  () => import("./pages/account/SavedAddressesPage")
);

// Admin
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));

const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard")
);

const AdminOrdersPage = lazy(
  () => import("./pages/admin/AdminOrdersPage")
);

const AdminOrderDetailsPage = lazy(
  () => import("./pages/admin/AdminOrderDetailsPage")
);

const AdminInventoryPage = lazy(
  () => import("./pages/admin/AdminInventoryPage")
);

const AdminProductsPage = lazy(
  () => import("./pages/admin/AdminProductsPage")
);

const AdminProductFormPage = lazy(
  () => import("./pages/admin/AdminProductFormPage")
);

const AdminCategoriesPage = lazy(
  () => import("./pages/admin/AdminCategoriesPage")
);

const AdminCancellationsPage = lazy(
  () => import("./pages/admin/AdminCancellationsPage")
);

const AdminCustomersPage = lazy(
  () => import("./pages/admin/AdminCustomersPage")
);

const AdminEnquiriesPage = lazy(
  () => import("./pages/admin/AdminEnquiriesPage")
);

const AdminReviewsPage = lazy(
  () => import("./pages/admin/AdminReviewsPage")
);

// Static Pages
const ContactPage = lazy(() => import("./pages/contact/ContactPage"));
const AboutUsPage = lazy(() => import("./pages/about/AboutUsPage"));
const FAQPage = lazy(() => import("./pages/faq/FAQPage"));
const ExportPage = lazy(() => import("./pages/export/ExportPage"));

// Legal Pages
const PrivacyPolicyPage = lazy(
  () => import("./pages/legal/PrivacyPolicyPage")
);

const TermsConditionsPage = lazy(
  () => import("./pages/legal/TermsConditionsPage")
);

const RefundPolicyPage = lazy(
  () => import("./pages/legal/RefundPolicyPage")
);

function CategoryListingRoute() {
  const { categorySlug } = useParams();

  return <ProductListingPage categorySlug={categorySlug} />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center bg-[#F7F4EE]">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DED7CA] border-t-[#A98250]" />

                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#18352B]">
                    Loading Royal Agate Export...
                  </p>
                </div>
              </div>
            }
          >
            <Routes>

            {/* ADMIN ROUTES - Separate Layout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
  
              <Route index element={<AdminDashboard />} />

              <Route
                path="products"
                element={<AdminProductsPage />}
              />

              <Route
                path="categories"
                element={<AdminCategoriesPage />}
              />

              <Route
                path="products/add"
                element={<AdminProductFormPage />}
              />

              <Route
                path="products/:slug/edit"
                element={<AdminProductFormPage />}
              />

              <Route
                path="inventory"
                element={<AdminInventoryPage />}
              />

              <Route
                path="orders"
                element={<AdminOrdersPage />}
              />

              <Route
                path="orders/:orderId"
                element={<AdminOrderDetailsPage />}
              />

              <Route
                path="cancellations"
                element={<AdminCancellationsPage />}
              />

              <Route
                  path="customers"
                  element={<AdminCustomersPage />}
              />

              <Route
                path="enquiries"
                element={<AdminEnquiriesPage />}
              />

              <Route
                path="reviews"
                element={<AdminReviewsPage />}
              />

            </Route>

            {/* CUSTOMER WEBSITE - Separate Layout */}
            <Route element={<CustomerLayout />}>

              <Route path="/" element={<HomePage />} />

              <Route path="/login" element={<LoginPage />} />

              <Route path="/register" element={<RegisterPage />} />

              <Route path="/contact" element={<ContactPage />} />

              <Route path="/about" element={<AboutUsPage />} />

              <Route path="/faqs" element={<FAQPage />} />

              <Route path="/export" element={<ExportPage />} />

              {/* Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

              <Route path="/terms" element={<TermsConditionsPage />} />

              <Route path="/refund-policy" element={<RefundPolicyPage />} />

              {/* Customer Cart */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CartPage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Checkout */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Account */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <AccountDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                  path="/account/profile"
                  element={
                      <ProtectedRoute allowedRoles={["customer"]}>
                          <MyProfilePage />
                      </ProtectedRoute>
                  }
              />

              <Route
                  path="/account/addresses"
                  element={
                      <ProtectedRoute allowedRoles={["customer"]}>
                          <SavedAddressesPage />
                      </ProtectedRoute>
                  }
              />

              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/reviews"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                      <MyReviewsPage />
                    </ProtectedRoute>
                }
              />

              <Route
                path="/account/orders/:orderId"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Collections */}
              <Route
                path="/collections"
                element={<ProductListingPage />}
              />

              <Route
                path="/collections/agate"
                element={<ProductListingPage categorySlug="agate" />}
              />

              <Route
                path="/collections/jewellery"
                element={<ProductListingPage categorySlug="jewellery" />}
              />

              {/* Product Details */}
              <Route
                path="/collections/:slug"
                element={<ProductDetailPage />}
              />

              <Route
                  path="/category/:categorySlug"
                  element={
                      <CategoryListingRoute />
                  }
              />

            </Route>

              </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

