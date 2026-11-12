import { useCallback, useEffect, useState } from "react";
import {
    MapPin,
    Plus,
    Pencil,
    Trash2,
    Star,
    ArrowLeft,
    X,
    LoaderCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
} from "../../services/addressService";

const EMPTY_FORM = {
    full_name: "",
    phone_number: "",
    address_line_1: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    is_default: false,
};

export default function SavedAddressesPage() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchAddresses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAddresses();

            const data = Array.isArray(response)
                ? response
                : response?.results || response?.addresses || [];

            setAddresses(data);
        } catch (err) {
            setError(err.message || "Unable to load saved addresses.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const openAddModal = () => {
        setEditingAddress(null);
        setFormData({ ...EMPTY_FORM });
        setError("");
        setModalOpen(true);
    };

    const openEditModal = (address) => {
        setEditingAddress(address);

        setFormData({
            full_name: address.full_name || "",
            phone_number: address.phone_number || "",
            address_line_1: address.address_line_1 || "",
            district: address.district || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            country: address.country || "India",
            is_default: address.is_default || false,
        });

        setError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingAddress(null);
        setFormData({ ...EMPTY_FORM });
        setError("");
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const payload = {
            ...formData,
            full_name: formData.full_name.trim(),
            phone_number: formData.phone_number.trim(),
            address_line_1: formData.address_line_1.trim(),
            district: formData.district.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
            country: formData.country.trim(),
        };

        const requiredFields = [
            "full_name",
            "phone_number",
            "address_line_1",
            "district",
            "city",
            "state",
            "pincode",
            "country",
        ];

        const missingField = requiredFields.find(
            (field) => !payload[field]
        );

        if (missingField) {
            setError("Please fill in all required fields.");
            return;
        }

        if (payload.phone_number.length > 20) {
            setError("Phone number cannot exceed 20 characters.");
            return;
        }

        try {
            setSaving(true);

            if (editingAddress) {
                await updateAddress(editingAddress.id, payload);
                setSuccess("Address updated successfully.");
            } else {
                await createAddress(payload);
                setSuccess("Address added successfully.");
            }

            setModalOpen(false);
            setEditingAddress(null);
            setFormData({ ...EMPTY_FORM });

            await fetchAddresses();
        } catch (err) {
            setError(err.message || "Unable to save address.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (address) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the address for ${address.full_name}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await deleteAddress(address.id);

            setSuccess("Address deleted successfully.");
            await fetchAddresses();
        } catch (err) {
            setError(err.message || "Unable to delete address.");
        }
    };

    const handleSetDefault = async (address) => {
        if (address.is_default) return;

        try {
            setError("");
            setSuccess("");

            await updateAddress(address.id, {
                is_default: true,
            });

            setSuccess("Default address updated successfully.");
            await fetchAddresses();
        } catch (err) {
            setError(err.message || "Unable to update default address.");
        }
    };

    const inputClass =
        "w-full border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#18352B] outline-none transition focus:border-[#A98250]";

    const fields = [
        {
            name: "full_name",
            label: "Recipient Name",
            placeholder: "Enter full name",
        },
        {
            name: "phone_number",
            label: "Phone Number",
            placeholder: "Enter contact number",
        },
        {
            name: "address_line_1",
            label: "Address",
            placeholder: "House / Building / Street",
            full: true,
        },
        {
            name: "district",
            label: "District",
            placeholder: "Enter district",
        },
        {
            name: "city",
            label: "City",
            placeholder: "Enter city",
        },
        {
            name: "state",
            label: "State",
            placeholder: "Enter state",
        },
        {
            name: "pincode",
            label: "PIN Code",
            placeholder: "Enter PIN code",
        },
        {
            name: "country",
            label: "Country",
            placeholder: "Enter country",
        },
    ];

    return (
        <section className="min-h-screen bg-[#F7F4EE] px-5 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-[1100px]">

                <Link
                    to="/account"
                    className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#77756F] hover:text-[#A98250]"
                >
                    <ArrowLeft size={15} />
                    Back to My Account
                </Link>

                {/* Header */}
                <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#DED7CA] pb-8 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#A98250]">
                            Customer Account
                        </p>

                        <h1 className="font-serif text-3xl text-[#18352B] md:text-5xl">
                            Saved Addresses
                        </h1>

                        <p className="mt-3 text-sm text-[#77756F]">
                            Manage your delivery addresses.
                        </p>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 bg-[#18352B] px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
                    >
                        <Plus size={16} />
                        Add New Address
                    </button>
                </div>

                {/* Alerts */}
                {error && !modalOpen && (
                    <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {/* Address List */}
                {loading ? (
                    <div className="flex justify-center py-20 text-sm text-[#77756F]">
                        <LoaderCircle className="mr-2 animate-spin" size={18} />
                        Loading addresses...
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="border border-dashed border-[#DED7CA] bg-white px-6 py-20 text-center">
                        <MapPin size={36} className="mx-auto text-[#A98250]" />

                        <h2 className="mt-5 font-serif text-2xl text-[#18352B]">
                            No Saved Addresses
                        </h2>

                        <p className="mt-2 text-sm text-[#77756F]">
                            Add your first delivery address to make checkout easier.
                        </p>

                        <button
                            onClick={openAddModal}
                            className="mt-6 bg-[#18352B] px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-[#A98250]"
                        >
                            Add Address
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {addresses.map((address) => (
                            <article
                                key={address.id}
                                className="border border-[#DED7CA] bg-white p-6 transition hover:border-[#A98250]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F4EE] text-[#A98250]">
                                            <MapPin size={19} />
                                        </div>

                                        <div>
                                            <h3 className="font-serif text-lg text-[#18352B]">
                                                {address.full_name}
                                            </h3>

                                            <p className="mt-1 text-xs text-[#77756F]">
                                                {address.phone_number}
                                            </p>
                                        </div>
                                    </div>

                                    {address.is_default && (
                                        <span className="inline-flex items-center gap-1 bg-[#F7F4EE] px-3 py-1.5 text-[9px] uppercase tracking-wider text-[#A98250]">
                                            <Star size={12} />
                                            Default
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6 border-t border-[#DED7CA] pt-5 text-sm leading-7 text-[#77756F]">
                                    <p>{address.address_line_1}</p>
                                    <p>
                                        {address.district}, {address.city}
                                    </p>
                                    <p>
                                        {address.state} - {address.pincode}
                                    </p>
                                    <p>{address.country}</p>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#DED7CA] pt-5">
                                    <div>
                                        {!address.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(address)}
                                                className="text-[10px] uppercase tracking-wider text-[#A98250] hover:text-[#18352B]"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => openEditModal(address)}
                                            className="inline-flex items-center gap-1.5 text-xs text-[#18352B] hover:text-[#A98250]"
                                        >
                                            <Pencil size={14} />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(address)}
                                            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-[#F7F4EE] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#DED7CA] p-6">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98250]">
                                    Customer Account
                                </p>

                                <h2 className="mt-1 font-serif text-2xl text-[#18352B]">
                                    {editingAddress ? "Edit Address" : "Add New Address"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="text-[#77756F] hover:text-[#18352B]"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {fields.map((field) => (
                                    <div
                                        key={field.name}
                                        className={field.full ? "sm:col-span-2" : ""}
                                    >
                                        <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-[#77756F]">
                                            {field.label}
                                        </label>

                                        <input
                                            type="text"
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            placeholder={field.placeholder}
                                            required
                                            maxLength={field.name === "phone_number" ? 20 : undefined}
                                            disabled={saving}
                                            className={inputClass}
                                        />
                                    </div>
                                ))}
                            </div>

                            <label className="mt-6 flex cursor-pointer items-center gap-3 border border-[#DED7CA] bg-white p-4">
                                <input
                                    type="checkbox"
                                    name="is_default"
                                    checked={formData.is_default}
                                    onChange={handleChange}
                                    disabled={saving}
                                    className="h-4 w-4 accent-[#18352B]"
                                />

                                <span className="text-sm text-[#18352B]">
                                    Set as my default delivery address
                                </span>
                            </label>

                            <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-[#DED7CA] pt-6 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="border border-[#DED7CA] px-7 py-3 text-[10px] uppercase tracking-[0.15em] text-[#18352B] hover:bg-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 bg-[#18352B] px-7 py-3 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-[#A98250] disabled:opacity-50"
                                >
                                    {saving && (
                                        <LoaderCircle size={15} className="animate-spin" />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : editingAddress
                                            ? "Update Address"
                                            : "Save Address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}