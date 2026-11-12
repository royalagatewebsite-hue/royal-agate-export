import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await register(formData);

      navigate("/login", {
        replace: true,
        state: { registrationSuccess: true },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-[#D9D2C6] bg-[#F7F4EE]/40 px-4 py-3 text-sm outline-none focus:border-[#A98250] transition-colors";

  const labelClass =
    "block text-[10px] uppercase tracking-[0.15em] text-[#343832] mb-2";

  return (
    <div className="min-h-[85vh] bg-[#F7F4EE] flex items-center justify-center px-5 py-16">

      <div className="w-full max-w-lg">

        {/* Brand */}
        <Link to="/" className="block text-center mb-10">
          <span className="font-serif text-3xl tracking-[0.12em] text-[#18352B]">
            ROYAL AGATE
          </span>

          <span className="block text-[9px] tracking-[0.48em] text-[#A98250] mt-2">
            EXPORT
          </span>
        </Link>

        {/* Registration Card */}
        <div className="bg-white border border-[#A98250]/20 p-8 md:p-10 shadow-sm">

          <div className="text-center mb-9">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#A98250] mb-3">
              Join Our Community
            </p>

            <h1 className="font-serif text-3xl text-[#18352B]">
              Create Account
            </h1>

            <p className="text-sm text-[#777] mt-3">
              Create your Royal Agate customer account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* First and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label htmlFor="first_name" className={labelClass}>
                  First Name
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="last_name" className={labelClass}>
                  Last Name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                  className={inputClass}
                />
              </div>

            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone_number" className={labelClass}>
                Phone Number
              </label>

              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#A98250]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className={labelClass}>
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#A98250]"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18352B] text-white py-4 text-[11px] uppercase tracking-[0.18em] flex items-center justify-center gap-3 hover:bg-[#A98250] transition-colors disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}

              {!loading && <ArrowRight size={16} />}
            </button>

          </form>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-[#A98250]/20">

            <p className="text-sm text-[#777]">
              Already have an account?
            </p>

            <Link
              to="/login"
              className="inline-block mt-2 text-[11px] uppercase tracking-[0.15em] text-[#18352B] hover:text-[#A98250] transition-colors"
            >
              Sign In
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