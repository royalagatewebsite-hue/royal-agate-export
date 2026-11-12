import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Gem,
  Boxes,
  Package,
  Tags,
  Mail,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { useCallback, useEffect, useState } from "react";
import { getAdminDashboardStats, getAdminCancellations } from "../../services/orderService";
import { getAdminEnquiries } from "../../services/contactService";
import { getAdminReviewStats } from "../../services/catalogueService";

const menuItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: Tags,
  },
  {
    name: "Inventory",
    path: "/admin/inventory",
    icon: Boxes,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Cancellations",
    path: "/admin/cancellations",
    icon: ClipboardList,
  },
  {
    name: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    name: "Enquiries",
    path: "/admin/enquiries",
    icon: Mail,
  },
  {
    name: "Reviews",
    path: "/admin/reviews",
    icon: Star,
  },
];

export default function AdminSidebar() {
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState({
    orders: 0,
    cancellations: 0,
    enquiries: 0,
    reviews: 0,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const [orderStats, cancellationResponse, enquiryResponse, reviewStats] =
        await Promise.all([
          getAdminDashboardStats(),
          getAdminCancellations("REQUESTED"),
          getAdminEnquiries({ status: "NEW" }),
          getAdminReviewStats(),
        ]);
      const getCount = (response) =>
        response?.count ??
        response?.results?.length ??
        (Array.isArray(response) ? response.length : 0);

      setNotifications({
        orders: Number(orderStats?.pending_orders || 0),
        cancellations: getCount(cancellationResponse),
        enquiries: getCount(enquiryResponse),
        reviews: Number(reviewStats?.unread_reviews || 0),
      });
    } catch (error) {
      console.error("Unable to fetch admin notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    window.addEventListener("focus", fetchNotifications);
    window.addEventListener("admin-notifications-refresh", fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchNotifications);
      window.removeEventListener(
        "admin-notifications-refresh",
        fetchNotifications
      );
    };
  }, [fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-full md:w-64 min-h-0 md:min-h-screen bg-[#18352B] text-white flex flex-col shrink-0">

      <div className="px-5 py-4 md:px-7 md:py-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Gem className="text-[#A98250]" size={28} />

          <div>
            <h1 className="font-serif text-lg tracking-wider">
              ROYAL AGATE
            </h1>

            <p className="text-[9px] tracking-[0.35em] text-[#A98250]">
              ADMINISTRATION
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-w-0 px-3 py-3 md:px-4 md:py-8">

        <p className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-white/40 px-3 mb-5">
          Main Menu
        </p>
      <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-2 md:overflow-visible md:pb-0">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex shrink-0 md:shrink items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#A98250] text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />

              <span className="flex-1">
                {item.name}
              </span>

              {(() => {
                const badgeCounts = {
                  Orders: notifications.orders,
                  Cancellations: notifications.cancellations,
                  Enquiries: notifications.enquiries,
                  Reviews: notifications.reviews,
                };

                const count = badgeCounts[item.name] || 0;

                return count > 0 ? (
                  <span
                    className="ml-auto inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-[#A98250] px-1.5 text-[10px] font-semibold text-white"
                    aria-label={`${count} pending ${item.name.toLowerCase()}`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null;
              })()}
            </NavLink>
          );
        })}
      
      </div>

      </nav>

      <div className="p-2 md:p-4 border-t border-white/10">

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </aside>
  );
}