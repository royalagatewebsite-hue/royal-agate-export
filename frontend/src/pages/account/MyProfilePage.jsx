import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserRound, ShieldCheck } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function MyProfilePage() {
    const { user, fetchProfile, updateProfile } = useAuth();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const profile = await fetchProfile();

            setFormData({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: profile.email || "",
                phone_number: profile.phone_number || "",
            });

        } catch (err) {
            setError(err.message || "Unable to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEdit = () => {
        setSuccess("");
        setError("");

        setFormData({
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            email: user?.email || "",
            phone_number: user?.phone_number || "",
        });

        setEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            email: user?.email || "",
            phone_number: user?.phone_number || "",
        });

        setEditing(false);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const firstName = formData.first_name.trim();
        const lastName = formData.last_name.trim();
        const phoneNumber = formData.phone_number.trim();

        if (!firstName || !lastName) {
            setError("First name and last name are required.");
            return;
        }

        if (!phoneNumber) {
            setError("Phone number is required.");
            return;
        }

        if (phoneNumber.length > 20) {
            setError("Phone number cannot exceed 20 characters.");
            return;
        }

        try {
            setSaving(true);

            const updatedProfile = await updateProfile({
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
            });

            setFormData({
                first_name: updatedProfile.first_name || "",
                last_name: updatedProfile.last_name || "",
                email: updatedProfile.email || "",
                phone_number: updatedProfile.phone_number || "",
            });

            setEditing(false);
            setSuccess("Your profile has been updated successfully.");

        } catch (err) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#18352B] outline-none transition focus:border-[#A98250] disabled:bg-[#F7F4EE] disabled:text-[#77756F]";

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[#F7F4EE]">
                <p className="text-sm text-[#77756F]">
                    Loading your profile...
                </p>
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-[#F7F4EE] px-5 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-[1000px]">

                {/* Back Navigation */}
                <Link
                    to="/account"
                    className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#77756F] transition hover:text-[#A98250]"
                >
                    <ArrowLeft size={15} />
                    Back to My Account
                </Link>

                {/* Header */}
                <div className="mb-10 border-b border-[#DED7CA] pb-7">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#A98250]">
                        Customer Account
                    </p>

                    <h1 className="font-serif text-3xl text-[#18352B] md:text-5xl">
                        My Profile
                    </h1>

                    <p className="mt-3 text-sm text-[#77756F]">
                        View and manage your personal information.
                    </p>
                </div>

                {/* Profile Card */}
                <div className="border border-[#DED7CA] bg-white">

                    {/* Card Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-[#DED7CA] p-6 sm:flex-row sm:items-center">

                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18352B] text-[#D8B77D]">
                                <UserRound size={25} />
                            </div>

                            <div>
                                <h2 className="font-serif text-xl text-[#18352B]">
                                    {user?.first_name} {user?.last_name}
                                </h2>

                                <p className="mt-1 text-xs text-[#77756F]">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {!editing && (
                            <button
                                onClick={handleEdit}
                                className="bg-[#18352B] px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Alerts */}
                    <div className="px-6 pt-6">

                        {error && (
                            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                {success}
                            </div>
                        )}

                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-8">

                        <div className="mb-7">
                            <h3 className="font-serif text-xl text-[#18352B]">
                                Personal Information
                            </h3>

                            <p className="mt-1 text-xs text-[#77756F]">
                                Your basic account details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {/* First Name */}
                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-[#77756F]">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    disabled={!editing || saving}
                                    maxLength={150}
                                    required
                                    className={inputClass}
                                    placeholder="Enter first name"
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-[#77756F]">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    disabled={!editing || saving}
                                    maxLength={150}
                                    required
                                    className={inputClass}
                                    placeholder="Enter last name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-[#77756F]">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className={inputClass}
                                />

                                <p className="mt-2 text-[11px] text-[#77756F]">
                                    Email address cannot be changed.
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-[#77756F]">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    disabled={!editing || saving}
                                    maxLength={20}
                                    required
                                    className={inputClass}
                                    placeholder="Enter phone number"
                                />
                            </div>

                        </div>

                        {/* Security Notice */}
                        <div className="mt-8 flex items-start gap-3 border border-[#DED7CA] bg-[#F7F4EE] p-4">
                            <ShieldCheck
                                size={19}
                                className="shrink-0 text-[#A98250]"
                            />

                            <div>
                                <p className="text-xs font-medium text-[#18352B]">
                                    Account Information
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#77756F]">
                                    Your information is securely associated
                                    with your Royal Agate customer account.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        {editing && (
                            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#DED7CA] pt-6 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="border border-[#DED7CA] px-7 py-3 text-[10px] uppercase tracking-[0.15em] text-[#18352B] transition hover:bg-[#F7F4EE] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#18352B] px-7 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                            </div>
                        )}

                    </form>
                </div>

            </div>
        </section>
    );
}