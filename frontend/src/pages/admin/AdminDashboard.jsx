import { useEffect, useState } from "react";

import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  PackageCheck,
  XCircle,
  RefreshCw,
  IndianRupee,
} from "lucide-react";

import { getAdminDashboardStats } from "../../services/orderService";

const statCards = [
  {
    title: "Total Orders",
    key: "total_orders",
    icon: ShoppingBag,
  },
  {
    title: "Pending Orders",
    key: "pending_orders",
    icon: Clock,
  },
  {
    title: "Confirmed Orders",
    key: "confirmed_orders",
    icon: PackageCheck,
  },
  {
    title: "Processing Orders",
    key: "processing_orders",
    icon: RefreshCw,
  },
  {
    title: "Shipped Orders",
    key: "shipped_orders",
    icon: Truck,
  },
  {
    title: "Delivered Orders",
    key: "delivered_orders",
    icon: CheckCircle,
  },
  {
    title: "Cancelled Orders",
    key: "cancelled_orders",
    icon: XCircle,
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setError("");

      const response = await getAdminDashboardStats();

      setStats(response);
    } catch (err) {
      setError(
        err.message || "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>

      {/* Page Heading */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A98250] mb-2">
          Overview
        </p>

        <h1 className="font-serif text-3xl text-[#18352B]">
          Dashboard
        </h1>

        <p className="text-sm text-[#77756F] mt-2">
          Welcome to Royal Agate Export administration.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            onClick={fetchStats}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.key}
              className="bg-white border border-[#DED7CA] p-6"
            >
              <div className="flex justify-between items-center">

                <p className="text-sm text-[#77756F]">
                  {stat.title}
                </p>

                <Icon
                  size={22}
                  className="text-[#A98250]"
                />

              </div>

              <h2 className="font-serif text-3xl text-[#18352B] mt-5">
                {loading
                  ? "..."
                  : stats
                    ? stats[stat.key]
                    : "—"}
              </h2>

            </div>
          );
        })}

      </div>

      {/* Revenue Card */}
      <div className="mt-6 bg-[#18352B] text-white p-7 flex items-center justify-between">

        <div>
          <p className="text-sm text-white/70">
            Paid Revenue
          </p>

          <h2 className="font-serif text-3xl mt-3">
            {loading
              ? "..."
              : stats
                ? formatCurrency(stats.paid_revenue)
                : "—"}
          </h2>

          <p className="text-xs text-white/50 mt-2">
            Excludes cancelled and unpaid orders.
          </p>
        </div>

        <IndianRupee
          size={36}
          className="text-[#A98250]"
        />

      </div>

      {/* Welcome Section */}
      <div className="mt-8 bg-white border border-[#DED7CA] p-8">

        <h2 className="font-serif text-xl text-[#18352B]">
          Welcome to Royal Agate Admin
        </h2>

        <p className="text-sm text-[#77756F] mt-3">
          Manage orders, monitor customer activity and oversee
          your ecommerce operations from one place.
        </p>

      </div>

    </div>
  );
}