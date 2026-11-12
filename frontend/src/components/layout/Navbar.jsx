import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  UserRound,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getCategories } from "../../services/catalogueService";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/collections" },
  { label: "About Us", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Export", href: "/export" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [logoutError, setLogoutError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await getCategories();

        const data = Array.isArray(response)
          ? response
          : response.results || [];

        setCategories(data);
      } catch (error) {
        console.error("Navbar categories loading failed:", error);
      }
    }

    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    navigate(`/collections?search=${encodeURIComponent(query)}`);

    setSearchOpen(false);
    setSearchQuery("");
    closeMobileMenu();
  };

  const handleLogout = async () => {
    setLogoutError("");

    try {
      await logout();
      setMenuOpen(false);
    } catch {
      setLogoutError(
        "Logout completed locally, but server confirmation failed."
      );
    }
  };

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setMobileCategoryOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#A98250]/20 bg-[#F7F4EE]/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">

        <div className="flex h-20 items-center justify-between">

          {/* Brand */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex shrink-0 flex-col leading-none"
          >
            <span className="font-serif text-2xl tracking-[0.12em] text-[#18352B] md:text-3xl">
              ROYAL AGATE
            </span>

            <span className="mt-2 text-center text-[9px] tracking-[0.48em] text-[#A98250]">
              EXPORT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">

            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[#343832] transition-colors hover:text-[#A98250] xl:text-[11px]"
              >
                {link.label}
              </Link>
            ))}

            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => setCategoryOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                aria-expanded={categoryOpen}
                className="flex items-center gap-1 whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[#343832] transition-colors hover:text-[#A98250] xl:text-[11px]"
              >
                Categories
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoryOpen && (
                <div className="absolute left-0 top-full z-50 w-64 border border-[#DED7CA] bg-[#F7F4EE] py-2 shadow-xl">

                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      onClick={() => setCategoryOpen(false)}
                      className="block px-5 py-3 text-xs text-[#18352B] transition-colors hover:bg-[#18352B] hover:text-white"
                    >
                      {category.name}
                    </Link>
                  ))}

                  {categories.length === 0 && (
                    <p className="px-5 py-3 text-xs text-[#77756F]">
                      No categories available.
                    </p>
                  )}

                </div>
              )}
            </div>

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[#343832] transition-colors hover:text-[#A98250] xl:text-[11px]"
              >
                {link.label}
              </Link>
            ))}

          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 text-[#18352B] lg:flex">

            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((previous) => !previous)}
              className="transition-colors hover:text-[#A98250]"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="flex items-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[0.13em] transition-colors hover:text-[#A98250]"
                >
                  <UserRound size={16} />
                  {user?.first_name || "My Account"}
                </Link>

                <button
                  onClick={handleLogout}
                  className="whitespace-nowrap text-[10px] uppercase tracking-[0.13em] transition-colors hover:text-[#A98250]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap text-[10px] uppercase tracking-[0.13em] transition-colors hover:text-[#A98250]"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="whitespace-nowrap bg-[#18352B] px-5 py-3 text-[10px] uppercase tracking-[0.13em] text-white transition-colors hover:bg-[#A98250]"
                >
                  Register
                </Link>
              </>
            )}

            <Link
              to="/cart"
              aria-label={`Shopping cart with ${totalItems} items`}
              className="relative transition-colors hover:text-[#A98250]"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#A98250] px-1 text-[9px] font-medium text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-5 text-[#18352B] lg:hidden">

            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((previous) => !previous)}
              className="transition-colors hover:text-[#A98250]"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link
              to="/cart"
              aria-label={`Shopping cart with ${totalItems} items`}
              className="relative"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#A98250] px-1 text-[9px] text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>

          </div>

        </div>

        
        {/* Search Panel */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            className="border-t border-[#A98250]/20 py-4"
          >
            <div className="flex items-center gap-3">

              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A98250]"
                />

                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gemstones, jewellery..."
                  className="w-full border border-[#DED7CA] bg-white py-3 pl-11 pr-4 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
                />
              </div>

              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="bg-[#18352B] px-5 py-3 text-xs uppercase tracking-wider text-white transition hover:bg-[#A98250] disabled:opacity-50"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                aria-label="Close search"
                className="text-[#77756F] hover:text-[#A98250]"
              >
                <X size={21} />
              </button>

            </div>
          </form>
        )}



        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="flex flex-col border-t border-[#A98250]/20 py-5 lg:hidden">

            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={closeMobileMenu}
                className="py-3 text-xs uppercase tracking-[0.15em] text-[#343832] hover:text-[#A98250]"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Categories */}
            <div className="border-b border-[#A98250]/10">

              <button
                type="button"
                onClick={() =>
                  setMobileCategoryOpen(!mobileCategoryOpen)
                }
                aria-expanded={mobileCategoryOpen}
                className="flex w-full items-center justify-between py-3 text-left text-xs uppercase tracking-[0.15em] text-[#343832] hover:text-[#A98250]"
              >
                Categories

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    mobileCategoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileCategoryOpen && (
                <div className="mb-3 ml-4 flex flex-col border-l border-[#A98250]/30 pl-4">

                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      onClick={closeMobileMenu}
                      className="py-3 text-xs text-[#77756F] transition-colors hover:text-[#A98250]"
                    >
                      {category.name}
                    </Link>
                  ))}

                  {categories.length === 0 && (
                    <p className="py-3 text-xs text-[#77756F]">
                      No categories available.
                    </p>
                  )}

                </div>
              )}

            </div>

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={closeMobileMenu}
                className="py-3 text-xs uppercase tracking-[0.15em] text-[#343832] hover:text-[#A98250]"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Authentication */}
            <div className="mt-5 border-t border-[#A98250]/20 pt-5">

              {isAuthenticated ? (
                <div className="flex flex-col gap-4">

                  <Link
                    to="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#18352B]"
                  >
                    <UserRound size={16} />
                    {user?.first_name || "My Account"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-left text-xs uppercase tracking-[0.15em] text-[#18352B] hover:text-[#A98250]"
                  >
                    Logout
                  </button>

                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">

                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="border border-[#18352B] py-3 text-center text-[10px] uppercase tracking-[0.15em] text-[#18352B]"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="bg-[#18352B] py-3 text-center text-[10px] uppercase tracking-[0.15em] text-white"
                  >
                    Register
                  </Link>

                </div>
              )}

            </div>

          </nav>
        )}

        {logoutError && (
          <p className="pb-2 text-xs text-red-600">
            {logoutError}
          </p>
        )}

      </div>
    </header>
  );
}