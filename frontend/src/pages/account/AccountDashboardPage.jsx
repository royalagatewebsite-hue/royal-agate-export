import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  ShoppingBag,
  MapPin,
  ArrowRight,
  Package,
  RefreshCw,
  Star,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../services/orderService";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getOrders = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }
  return [];
};

export default function AccountDashboardPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyOrders();
      setOrders(getOrders(response));
    } catch (err) {
      setError(err.message || "Unable to load account information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const recentOrder = orders[0];

  const quickLinks = [
    {
      title: "My Profile",
      description: "View and update your personal information.",
      icon: UserRound,
      path: "/account/profile",
    },
    {
      title: "My Orders",
      description: "Track and manage your purchases.",
      icon: ShoppingBag,
      path: "/account/orders",
    },
    {
      title: "Saved Addresses",
      description: "Manage your delivery addresses.",
      icon: MapPin,
      path: "/account/addresses",
    },
    {
      title: "My Reviews",
      description: "View, edit and manage your product reviews.",
      icon: Star,
      path: "/account/reviews",
    },
  ];

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-[1200px]">

        {/* Header */}
        <div className="mb-10 border-b border-[#DED7CA] pb-8">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#A98250]">
            Royal Agate Customer Account
          </p>

          <h1 className="font-serif text-3xl text-[#18352B] md:text-5xl">
            Welcome back, {user?.first_name || "Customer"}
          </h1>

          <p className="mt-3 text-sm text-[#77756F]">
            Manage your account, purchases and delivery information.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div className="border border-[#DED7CA] bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#77756F]">
                Total Orders
              </p>

              <ShoppingBag className="text-[#A98250]" size={21} />
            </div>

            <h2 className="mt-4 font-serif text-4xl text-[#18352B]">
              {loading ? "—" : orders.length}
            </h2>

            <p className="mt-2 text-xs text-[#77756F]">
              Your purchase history
            </p>
          </div>

          <div className="border border-[#DED7CA] bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#77756F]">
                Recent Order
              </p>

              <Package className="text-[#A98250]" size={21} />
            </div>

            <h2 className="mt-4 font-serif text-2xl text-[#18352B]">
              {loading
                ? "Loading..."
                : recentOrder?.order_number || "No orders yet"}
            </h2>

            <p className="mt-2 text-xs text-[#77756F]">
              {recentOrder
                ? `Placed on ${formatDate(recentOrder.created_at)}`
                : "Your recent purchase will appear here."}
            </p>
          </div>

        </div>

        {/* Quick Links */}
        <div className="mb-10">
          <h2 className="mb-5 font-serif text-2xl text-[#18352B]">
            Your Account
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className="group border border-[#DED7CA] bg-white p-6 transition hover:border-[#A98250]"
                >
                  <Icon size={25} className="text-[#A98250]" />

                  <h3 className="mt-5 font-serif text-xl text-[#18352B]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#77756F]">
                    {item.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#18352B]">
                    Manage
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Order */}
        <div className="border border-[#DED7CA] bg-white">

          <div className="flex flex-col justify-between gap-4 border-b border-[#DED7CA] p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl text-[#18352B]">
                Recent Orders
              </h2>

              <p className="mt-1 text-xs text-[#77756F]">
                Your latest purchases
              </p>
            </div>

            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#A98250]"
            >
              View All Orders
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-6">

            {loading ? (
              <div className="py-8 text-center text-sm text-[#77756F]">
                Loading your orders...
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <p className="text-sm text-red-600">{error}</p>

                <button
                  onClick={fetchOrders}
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#18352B]"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            ) : recentOrder ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs text-[#77756F]">Order Number</p>

                  <p className="mt-1 font-medium text-[#18352B]">
                    {recentOrder.order_number}
                  </p>

                  <p className="mt-2 text-xs text-[#77756F]">
                    {formatDate(recentOrder.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#77756F]">Order Total</p>

                  <p className="mt-1 font-semibold text-[#18352B]">
                    {formatCurrency(recentOrder.total_amount)}
                  </p>
                </div>

                <Link
                  to={`/account/orders/${recentOrder.id}`}
                  className="inline-flex items-center justify-center gap-2 bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-[#A98250]"
                >
                  View Order
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="py-10 text-center">
                <ShoppingBag
                  size={32}
                  className="mx-auto text-[#A98250]"
                />

                <p className="mt-4 font-serif text-xl text-[#18352B]">
                  No Orders Yet
                </p>

                <Link
                  to="/collections"
                  className="mt-5 inline-block bg-[#18352B] px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white"
                >
                  Explore Collection
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}