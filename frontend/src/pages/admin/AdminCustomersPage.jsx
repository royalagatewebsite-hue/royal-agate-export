import { useCallback, useEffect, useState } from "react";

import {
    getAdminCustomers,
    getAdminCustomerById,
} from "../../services/customerService";


const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
};


const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "C";
};


const statusStyles = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-indigo-50 text-indigo-700",
    SHIPPED: "bg-purple-50 text-purple-700",
    DELIVERED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
};


function CustomerDetailsModal({ customer, onClose }) {
    if (!customer) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#F7F4EE] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#DED7CA] p-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#A98250]">
                            Customer Profile
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-[#18352B]">
                            Customer Details
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg px-3 py-2 text-xl text-[#77756F] hover:bg-white"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6 p-6">

                    {/* Customer Information */}
                    <div className="flex flex-col gap-4 rounded-xl border border-[#DED7CA] bg-white p-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18352B] text-xl font-semibold text-[#D8B77D]">
                            {getInitials(customer.first_name, customer.last_name)}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#18352B]">
                                {customer.first_name} {customer.last_name}
                            </h3>

                            <p className="mt-1 text-sm text-[#77756F]">
                                {customer.email}
                            </p>

                            <p className="mt-1 text-sm text-[#77756F]">
                                {customer.phone_number || "Phone not available"}
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                customer.is_active
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                            }`}
                        >
                            {customer.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-[#DED7CA] bg-white p-4">
                            <p className="text-sm text-[#77756F]">
                                Total Orders
                            </p>

                            <p className="mt-2 text-2xl font-bold text-[#18352B]">
                                {customer.total_orders}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#DED7CA] bg-white p-4">
                            <p className="text-sm text-[#77756F]">
                                Total Spending
                            </p>

                            <p className="mt-2 text-xl font-bold text-[#18352B]">
                                {formatCurrency(customer.total_spent)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#DED7CA] bg-white p-4">
                            <p className="text-sm text-[#77756F]">
                                Joined On
                            </p>

                            <p className="mt-2 text-lg font-bold text-[#18352B]">
                                {formatDate(customer.date_joined)}
                            </p>
                        </div>
                    </div>

                    {/* Order History */}
                    <div>
                        <div className="mb-4">
                            <h3 className="font-semibold text-[#18352B]">
                                Order History
                            </h3>

                            <p className="text-sm text-[#77756F]">
                                Orders placed by this customer
                            </p>
                        </div>

                        {customer.orders?.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[#DED7CA] bg-white">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F7F4EE] text-xs uppercase text-[#77756F]">
                                        <tr>
                                            <th className="px-4 py-3">Order</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#DED7CA]">
                                        {customer.orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-3 font-medium text-[#18352B]">
                                                    {order.order_number}
                                                </td>

                                                <td className="px-4 py-3 text-[#77756F]">
                                                    {formatDate(order.created_at)}
                                                </td>

                                                <td className="px-4 py-3 font-medium text-[#18352B]">
                                                    {formatCurrency(order.total_amount)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            statusStyles[order.status] ||
                                                            "bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-[#DED7CA] bg-white p-8 text-center">
                                <p className="font-medium text-[#18352B]">
                                    No orders yet
                                </p>

                                <p className="mt-1 text-sm text-[#77756F]">
                                    This customer hasn't placed any orders.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end border-t border-[#DED7CA] p-5">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-[#18352B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#254A3D]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}


export default function AdminCustomersPage() {

    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [count, setCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const fetchCustomers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await getAdminCustomers({
                search,
                page,
            });

            setCustomers(response.results || []);
            setCount(response.count || 0);
            setNextPage(response.next);
            setPreviousPage(response.previous);
            setCurrentPage(page);

        } catch (err) {
            setError(err.message || "Failed to load customers.");
        } finally {
            setLoading(false);
        }
    }, [search]);


    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCustomers(1);
        }, 350);

        return () => clearTimeout(timeout);
    }, [fetchCustomers]);


    const handleViewCustomer = async (customerId) => {
        try {
            setDetailsLoading(true);
            setSelectedCustomer(null);

            const response = await getAdminCustomerById(customerId);

            setSelectedCustomer(response);

        } catch (err) {
            alert(err.message || "Failed to load customer details.");
        } finally {
            setDetailsLoading(false);
        }
    };


    const totalOrders = customers.reduce(
        (sum, customer) => sum + Number(customer.total_orders || 0),
        0
    );

    const totalSpent = customers.reduce(
        (sum, customer) => sum + Number(customer.total_spent || 0),
        0
    );


    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A98250]">
                        Customer Relations
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-[#18352B]">
                        Customer Management
                    </h1>

                    <p className="mt-1 text-sm text-[#77756F]">
                        Manage your registered customers and their orders.
                    </p>
                </div>

                <button
                    onClick={() => fetchCustomers(currentPage)}
                    disabled={loading}
                    className="rounded-lg border border-[#DED7CA] bg-white px-4 py-2.5 text-sm font-medium text-[#18352B] hover:bg-[#F7F4EE] disabled:opacity-50"
                >
                    ↻ Refresh
                </button>
            </div>


            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-[#DED7CA] bg-white p-5">
                    <p className="text-sm text-[#77756F]">
                        Total Customers
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-[#18352B]">
                        {count}
                    </h2>

                    <p className="mt-1 text-xs text-[#A98250]">
                        Registered accounts
                    </p>
                </div>

                <div className="rounded-xl border border-[#DED7CA] bg-white p-5">
                    <p className="text-sm text-[#77756F]">
                        Orders on Current Page
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-[#18352B]">
                        {totalOrders}
                    </h2>

                    <p className="mt-1 text-xs text-[#A98250]">
                        Combined customer orders
                    </p>
                </div>

                <div className="rounded-xl border border-[#DED7CA] bg-white p-5">
                    <p className="text-sm text-[#77756F]">
                        Spending on Current Page
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#18352B]">
                        {formatCurrency(totalSpent)}
                    </h2>

                    <p className="mt-1 text-xs text-[#A98250]">
                        Combined order value
                    </p>
                </div>

            </div>


            {/* Customer Table */}
            <div className="overflow-hidden rounded-xl border border-[#DED7CA] bg-white">

                <div className="flex flex-col gap-4 border-b border-[#DED7CA] p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="font-semibold text-[#18352B]">
                            All Customers
                        </h2>

                        <p className="mt-1 text-xs text-[#77756F]">
                            {count} customers registered
                        </p>
                    </div>

                    <div className="w-full sm:max-w-sm">
                        <input
                            type="text"
                            placeholder="Search name, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-[#DED7CA] px-4 py-2.5 text-sm outline-none focus:border-[#A98250]"
                        />
                    </div>

                </div>


                {error && (
                    <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}


                <div className="overflow-x-auto">

                    <table className="w-full text-left text-sm">

                        <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">
                            <tr>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Phone</th>
                                <th className="px-5 py-4">Joined</th>
                                <th className="px-5 py-4">Orders</th>
                                <th className="px-5 py-4">Total Spent</th>
                                <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                        </thead>


                        <tbody className="divide-y divide-[#DED7CA]">

                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-[#77756F]">
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-[#77756F]">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="transition hover:bg-[#F7F4EE]/70"
                                    >

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18352B] text-xs font-semibold text-[#D8B77D]">
                                                    {getInitials(
                                                        customer.first_name,
                                                        customer.last_name
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-[#18352B]">
                                                        {customer.first_name} {customer.last_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-[#77756F]">
                                                        {customer.email}
                                                    </p>
                                                </div>

                                            </div>
                                        </td>


                                        <td className="whitespace-nowrap px-5 py-4 text-[#77756F]">
                                            {customer.phone_number || "—"}
                                        </td>


                                        <td className="whitespace-nowrap px-5 py-4 text-[#77756F]">
                                            {formatDate(customer.date_joined)}
                                        </td>


                                        <td className="px-5 py-4 font-medium text-[#18352B]">
                                            {customer.total_orders}
                                        </td>


                                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#18352B]">
                                            {formatCurrency(customer.total_spent)}
                                        </td>


                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleViewCustomer(customer.id)}
                                                className="rounded-lg border border-[#DED7CA] px-3 py-2 text-xs font-semibold text-[#18352B] transition hover:border-[#A98250] hover:bg-[#F7F4EE]"
                                            >
                                                View Details
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>

                </div>


                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-[#DED7CA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-[#77756F]">
                        Showing {customers.length} of {count} customers
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            disabled={!previousPage || loading}
                            onClick={() => fetchCustomers(currentPage - 1)}
                            className="rounded-lg border border-[#DED7CA] px-4 py-2 text-xs font-medium text-[#18352B] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="px-2 text-xs font-medium text-[#77756F]">
                            Page {currentPage}
                        </span>

                        <button
                            disabled={!nextPage || loading}
                            onClick={() => fetchCustomers(currentPage + 1)}
                            className="rounded-lg border border-[#DED7CA] px-4 py-2 text-xs font-medium text-[#18352B] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>

                </div>

            </div>


            {/* Customer Details Modal */}
            {selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}


            {/* Detail Loading */}
            {detailsLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="rounded-xl bg-white px-8 py-6 text-sm font-medium text-[#18352B]">
                        Loading customer details...
                    </div>
                </div>
            )}

        </div>
    );
}