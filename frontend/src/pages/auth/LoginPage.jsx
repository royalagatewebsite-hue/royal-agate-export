import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const location = useLocation();

  const registrationSuccess = location.state?.registrationSuccess;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const accountType = response.user.account_type;
      const requestedPath = location.state?.from?.pathname;

      let redirectTo = "/";

      if (accountType === "admin") {
        redirectTo = requestedPath?.startsWith("/admin")
          ? requestedPath
          : "/admin";
      } else if (accountType === "customer") {
        redirectTo =
          requestedPath && !requestedPath.startsWith("/admin")
            ? requestedPath
            : "/";
      } else {
        throw new Error("Invalid account role. Please contact support.");
      }

      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(
        typeof err.message === "string"
          ? err.message
          : "Unable to login. Please try again."
      );
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F4EE] flex items-center justify-center px-5 py-16">

      <div className="w-full max-w-md">

        {/* Brand */}
        <Link to="/" className="block text-center mb-10">
          <span className="font-serif text-3xl tracking-[0.12em] text-[#18352B]">
            ROYAL AGATE
          </span>

          <span className="block text-[9px] tracking-[0.48em] text-[#A98250] mt-2">
            EXPORT
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-white border border-[#A98250]/20 p-8 md:p-10 shadow-sm">

          <div className="text-center mb-9">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#A98250] mb-3">
              Welcome Back
            </p>

            {registrationSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 mb-6 text-center">
                Registration successful! Please sign in to continue.
            </p>
            )}

            <h1 className="font-serif text-3xl text-[#18352B]">
              Sign In
            </h1>

            <p className="text-sm text-[#777] mt-3">
              Access your Royal Agate account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-[0.15em] text-[#343832] mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full border border-[#D9D2C6] bg-[#F7F4EE]/40 px-4 py-3 text-sm outline-none focus:border-[#A98250] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-[0.15em] text-[#343832] mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full border border-[#D9D2C6] bg-[#F7F4EE]/40 px-4 py-3 pr-12 text-sm outline-none focus:border-[#A98250] transition-colors"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#A98250]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
                {error}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18352B] text-white py-4 text-[11px] uppercase tracking-[0.18em] flex items-center justify-center gap-3 hover:bg-[#A98250] transition-colors disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}

              {!loading && <ArrowRight size={16} />}
            </button>

          </form>

          {/* Register Link */}
          <div className="text-center mt-8 pt-6 border-t border-[#A98250]/20">

            <p className="text-sm text-[#777]">
              Don't have an account?
            </p>

            <Link
              to="/register"
              className="inline-block mt-2 text-[11px] uppercase tracking-[0.15em] text-[#18352B] hover:text-[#A98250] transition-colors"
            >
              Create an Account
            </Link>

          </div>

        </div>

        <p className="text-center text-[9px] tracking-[0.2em] text-[#A98250] mt-8 uppercase">
          Natural · Authentic · Timeless
        </p>

      </div>
    </div>
  );
}