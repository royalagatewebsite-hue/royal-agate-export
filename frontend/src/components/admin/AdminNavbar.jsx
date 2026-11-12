import { Bell, UserCircle, ExternalLink, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="min-h-20 bg-white border-b border-[#DED7CA] flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3">

      <div>
        <h2 className="font-serif text-lg sm:text-xl text-[#18352B] whitespace-nowrap">
          Administration Panel
        </h2>

        <p className="hidden sm:block text-xs text-[#77756F] mt-1">
          Royal Agate Export Management
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-[#A98250] px-3 py-2 text-xs uppercase tracking-wider text-[#18352B] transition hover:bg-[#18352B] hover:text-white"
        >
          <ExternalLink size={15} />
          <span className="hidden sm:inline">View Website</span>
        </Link>

        <button className="relative text-[#77756F] hover:text-[#A98250]">
          <Bell size={20} />
        </button>

        <div className="relative border-l border-[#DED7CA] pl-3 sm:pl-5" ref={profileRef}>

          <button
            type="button"
            onClick={() => setProfileOpen((previous) => !previous)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-80 transition"
          >
            <UserCircle size={34} className="text-[#A98250] shrink-0" />

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#18352B]">
                {user?.first_name || "Administrator"}
              </p>

              <p className="text-xs text-[#77756F]">
                Administrator
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden sm:block text-[#77756F] transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-[#DED7CA] shadow-xl z-50 py-2">

              <div className="px-4 py-3 border-b border-[#DED7CA] sm:hidden">
                <p className="text-sm font-medium text-[#18352B]">
                  {user?.first_name || "Administrator"}
                </p>
                <p className="text-xs text-[#77756F]">
                  Administrator
                </p>
              </div>

              <Link
                to="/admin"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#18352B] hover:bg-[#F7F4EE]"
              >
                <LayoutDashboard size={17} />
                Admin Dashboard
              </Link>

              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#18352B] hover:bg-[#F7F4EE]"
              >
                <ExternalLink size={17} />
                View Website
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-[#DED7CA]"
              >
                <LogOut size={17} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}