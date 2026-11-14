import { useEffect, useMemo, useState } from "react";

import {
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Eye,
  Wallet,
  ArrowRight,
} from "lucide-react";

import {
  getAdminRefunds,
  createAdminRefund,
  processAdminRefund,
  completeAdminRefund,
  failAdminRefund,
  getAdminPaymentById,
} from "../../services/paymentService";


const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];


const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};


const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));


const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.replaceAll("_", " ") || "UNKNOWN"}
    </span>
  );
}


function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-[#DED7CA] p-5">

      <div className="flex justify-between items-center">
        <p className="text-sm text-[#77756F]">{title}</p>
        <Icon size={22} className={color} />
      </div>

      <h2 className="text-3xl font-serif text-[#18352B] mt-3">
        {value}
      </h2>

    </div>
  );
}


export default function AdminRefundsPage() {

  const [refunds, setRefunds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modal, setModal] = useState("");
  const [selectedRefund, setSelectedRefund] = useState(null);

  const [processing, setProcessing] = useState(false);

  // Create refund form
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("UPI");
  const [adminNote, setAdminNote] = useState("");

  const [verifiedPayment, setVerifiedPayment] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Complete refund form
  const [transactionReference, setTransactionReference] = useState("");


  // ==========================================
  // FETCH REFUNDS
  // ==========================================

  const fetchRefunds = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await getAdminRefunds();

      const data = response.results || response;

      setRefunds(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Refund fetch error:", err);

      setError(
        err.message || "Unable to load refunds."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    fetchRefunds();
  }, []);


  // ==========================================
  // FILTER REFUNDS
  // ==========================================

  const filteredRefunds = useMemo(() => {

    const value = search.toLowerCase().trim();

    return refunds.filter((refund) => {

      const matchesSearch =
        !value ||
        refund.order_number?.toLowerCase().includes(value) ||
        String(refund.payment || "").includes(value) ||
        String(refund.id).includes(value);

      const matchesStatus =
        statusFilter === "ALL" ||
        refund.status === statusFilter;

      return matchesSearch && matchesStatus;

    });

  }, [refunds, search, statusFilter]);


  // ==========================================
  // SUMMARY
  // ==========================================

  const stats = useMemo(() => ({

    total: refunds.length,

    pending: refunds.filter(
      (item) => item.status === "PENDING"
    ).length,

    processing: refunds.filter(
      (item) => item.status === "PROCESSING"
    ).length,

    completed: refunds.filter(
      (item) => item.status === "COMPLETED"
    ).length,

    failed: refunds.filter(
      (item) => item.status === "FAILED"
    ).length,

  }), [refunds]);


  // ==========================================
  // RESET MODAL
  // ==========================================

  const resetModal = () => {

    setModal("");
    setSelectedRefund(null);

    setPaymentId("");
    setAmount("");
    setRefundMethod("UPI");
    setAdminNote("");

    setVerifiedPayment(null);

    setTransactionReference("");

  };


  const closeModal = () => {

    if (processing || verifyingPayment) return;

    resetModal();

  };


  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {

    resetModal();

    setModal("CREATE");

  };


  // ==========================================
  // VERIFY PAYMENT
  // ==========================================

  const handleVerifyPayment = async (e) => {

    e.preventDefault();

    if (!paymentId.trim()) {
      window.alert("Please enter a payment ID.");
      return;
    }

    try {

      setVerifyingPayment(true);
      setVerifiedPayment(null);

      const payment = await getAdminPaymentById(
        paymentId.trim()
      );

      setVerifiedPayment(payment);

    } catch (err) {

      window.alert(
        err.message || "Unable to find payment."
      );

    } finally {

      setVerifyingPayment(false);

    }

  };


  // ==========================================
  // CREATE REFUND
  // ==========================================

  const handleCreateRefund = async (e) => {

    e.preventDefault();

    if (!verifiedPayment) {
      window.alert("Verify payment before creating refund.");
      return;
    }

    if (verifiedPayment.status !== "SUCCESS") {
      window.alert(
        "Refund can only be created for a successful payment."
      );
      return;
    }

    const refundAmount = Number(amount);
    const paymentAmount = Number(verifiedPayment.amount);

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0
    ) {
      window.alert("Enter a valid refund amount.");
      return;
    }

    if (refundAmount > paymentAmount) {
      window.alert(
        "Refund amount cannot exceed the payment amount."
      );
      return;
    }

    try {

      setProcessing(true);

      await createAdminRefund({
        paymentId: Number(paymentId),
        amount: refundAmount,
        refundMethod,
        adminNote,
      });

      resetModal();

      await fetchRefunds();

      window.alert("Refund created successfully.");

    } catch (err) {

      window.alert(
        err.message || "Unable to create refund."
      );

    } finally {

      setProcessing(false);

    }

  };


  // ==========================================
  // PROCESS REFUND
  // ==========================================

  const handleProcessRefund = async (refund) => {

    const confirmed = window.confirm(
      `Move refund #${refund.id} to processing?`
    );

    if (!confirmed) return;

    try {

      setProcessing(true);

      await processAdminRefund(refund.id);

      await fetchRefunds();

    } catch (err) {

      window.alert(
        err.message || "Unable to process refund."
      );

    } finally {

      setProcessing(false);

    }

  };


  // ==========================================
  // OPEN ACTION MODAL
  // ==========================================

  const openActionModal = (refund, action) => {

    setSelectedRefund(refund);

    setAdminNote("");
    setTransactionReference("");

    setModal(action);

  };


  // ==========================================
  // COMPLETE / FAIL REFUND
  // ==========================================

  const handleRefundAction = async (e) => {

    e.preventDefault();

    if (!selectedRefund) return;

    if (
      modal === "COMPLETE" &&
      !transactionReference.trim()
    ) {
      window.alert("Transaction reference is required.");
      return;
    }

    const currentAction = modal;

    try {

      setProcessing(true);

      if (currentAction === "COMPLETE") {

        await completeAdminRefund(
          selectedRefund.id,
          transactionReference.trim(),
          adminNote
        );

      } else if (currentAction === "FAIL") {

        await failAdminRefund(
          selectedRefund.id,
          adminNote
        );

      }

      resetModal();

      await fetchRefunds();

      window.alert(
        currentAction === "COMPLETE"
          ? "Refund completed successfully."
          : "Refund marked as failed."
      );

    } catch (err) {

      window.alert(
        err.message || "Unable to update refund."
      );

    } finally {

      setProcessing(false);

    }

  };


  return (

    <div className="space-y-8">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <p className="text-xs uppercase tracking-[0.25em] text-[#A98250] mb-2">
            Payment Management
          </p>

          <h1 className="text-3xl font-serif text-[#18352B]">
            Refund Management
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Monitor and manage customer refunds.
          </p>

        </div>


        <div className="flex flex-wrap gap-3">

          <button
            onClick={fetchRefunds}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 border border-[#DED7CA] text-[#18352B] hover:bg-[#F7F4EE] disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh

          </button>


          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D]"
          >

            <Plus size={17} />

            Create Refund

          </button>

        </div>

      </div>


      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <SummaryCard
          title="Total Refunds"
          value={stats.total}
          icon={Wallet}
          color="text-[#A98250]"
        />

        <SummaryCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="text-amber-600"
        />

        <SummaryCard
          title="Processing"
          value={stats.processing}
          icon={RotateCcw}
          color="text-blue-600"
        />

        <SummaryCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-700"
        />

      </div>


      {/* ======================================
          FILTERS
      ====================================== */}

      <div className="bg-white border border-[#DED7CA] p-5">

        <div className="flex items-center gap-2 mb-5">

          <Filter
            size={18}
            className="text-[#A98250]"
          />

          <h2 className="font-medium text-[#18352B]">
            Search & Filters
          </h2>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number, refund ID or payment ID..."
              className="w-full border border-[#DED7CA] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
            />

          </div>


          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250] bg-white"
          >

            {STATUS_OPTIONS.map((status) => (

              <option key={status} value={status}>

                {status === "ALL"
                  ? "All Refunds"
                  : status.replace("_", " ")}

              </option>

            ))}

          </select>

        </div>

      </div>


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (

        <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-4 text-sm text-red-700">

          <AlertCircle size={18} />

          {error}

          <button
            onClick={fetchRefunds}
            className="ml-auto underline"
          >
            Retry
          </button>

        </div>

      )}


      {/* ======================================
          REFUNDS TABLE
      ====================================== */}

      <div className="bg-white border border-[#DED7CA]">

        <div className="px-5 py-5 border-b border-[#DED7CA]">

          <h2 className="font-serif text-xl text-[#18352B]">
            All Refunds
          </h2>

          <p className="text-xs text-[#77756F] mt-1">
            {filteredRefunds.length} refunds found
          </p>

        </div>


        {loading ? (

          <div className="flex justify-center items-center py-20">

            <RefreshCw
              size={25}
              className="animate-spin text-[#A98250]"
            />

            <span className="ml-3 text-sm text-[#77756F]">
              Loading refunds...
            </span>

          </div>

        ) : !error && filteredRefunds.length === 0 ? (

          <div className="text-center py-20">

            <Wallet
              size={42}
              className="mx-auto text-[#A98250] mb-4"
            />

            <h3 className="text-lg font-serif text-[#18352B]">
              No Refunds Found
            </h3>

            <p className="text-sm text-[#77756F] mt-2">
              There are no refunds matching your filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left min-w-[1050px]">

              <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">

                <tr>

                  <th className="px-5 py-4">Refund</th>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>

                </tr>

              </thead>


              <tbody className="divide-y divide-[#DED7CA]">

                {filteredRefunds.map((refund) => (

                  <tr
                    key={refund.id}
                    className="hover:bg-[#F7F4EE]/60 transition"
                  >

                    <td className="px-5 py-4">

                      <p className="text-sm font-medium text-[#18352B]">
                        REF-{refund.id}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        Payment ID: {refund.payment}
                      </p>

                    </td>


                    <td className="px-5 py-4">

                      <p className="text-sm text-[#18352B]">
                        {refund.order_number || "—"}
                      </p>

                    </td>


                    <td className="px-5 py-4">

                      <p className="text-sm text-[#18352B]">
                        {refund.payment_status || "—"}
                      </p>

                      <p className="text-xs text-[#77756F] mt-1">
                        {formatCurrency(refund.payment_amount)}
                      </p>

                    </td>


                    <td className="px-5 py-4 text-sm font-medium text-[#18352B]">
                      {formatCurrency(refund.amount)}
                    </td>


                    <td className="px-5 py-4 text-xs text-[#77756F]">
                      {refund.refund_method?.replaceAll("_", " ")}
                    </td>


                    <td className="px-5 py-4">
                      <StatusBadge status={refund.status} />
                    </td>


                    <td className="px-5 py-4 text-xs text-[#77756F] whitespace-nowrap">
                      {formatDate(refund.created_at)}
                    </td>


                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        {refund.status === "PENDING" && (

                          <button
                            onClick={() => handleProcessRefund(refund)}
                            disabled={processing}
                            title="Process Refund"
                            className="p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                          >
                            <ArrowRight size={17} />
                          </button>

                        )}


                        {refund.status === "PROCESSING" && (

                          <button
                            onClick={() =>
                              openActionModal(refund, "COMPLETE")
                            }
                            title="Complete Refund"
                            className="p-2 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle size={17} />
                          </button>

                        )}


                        {["PENDING", "PROCESSING"].includes(refund.status) && (

                          <button
                            onClick={() =>
                              openActionModal(refund, "FAIL")
                            }
                            title="Fail Refund"
                            className="p-2 text-red-600 hover:bg-red-50"
                          >
                            <XCircle size={17} />
                          </button>

                        )}


                        <button
                          onClick={() =>
                            openActionModal(refund, "VIEW")
                          }
                          title="View Details"
                          className="p-2 text-[#18352B] hover:bg-[#F7F4EE]"
                        >
                          <Eye size={17} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================
          MODALS
      ====================================== */}

      {modal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-[#DED7CA]">

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
                  Payment Management
                </p>

                <h2 className="text-2xl font-serif text-[#18352B] mt-1">

                  {modal === "CREATE"
                    ? "Create Refund"
                    : modal === "COMPLETE"
                      ? "Complete Refund"
                      : modal === "FAIL"
                        ? "Fail Refund"
                        : "Refund Details"}

                </h2>

              </div>


              <button
                onClick={closeModal}
                disabled={processing || verifyingPayment}
                className="p-2 text-[#77756F] hover:bg-[#F7F4EE] disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>


            <div className="p-6 space-y-5">


              {/* ==================================
                  CREATE REFUND FORM
              ================================== */}

              {modal === "CREATE" && (

                <form
                  onSubmit={handleCreateRefund}
                  className="space-y-5"
                >

                  <div>

                    <label className="block text-sm text-[#18352B] mb-2">
                      Payment ID
                    </label>

                    <div className="flex gap-2">

                      <input
                        type="number"
                        min="1"
                        value={paymentId}
                        onChange={(e) => {
                          setPaymentId(e.target.value);
                          setVerifiedPayment(null);
                        }}
                        required
                        placeholder="Enter payment ID"
                        className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                      />


                      <button
                        type="button"
                        onClick={handleVerifyPayment}
                        disabled={verifyingPayment || !paymentId}
                        className="px-4 bg-[#18352B] text-white text-sm disabled:opacity-50 whitespace-nowrap"
                      >

                        {verifyingPayment
                          ? "Checking..."
                          : "Verify"}

                      </button>

                    </div>

                  </div>


                  {verifiedPayment && (

                    <div className="bg-green-50 border border-green-200 p-4 space-y-2">

                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                        <CheckCircle size={17} />
                        Payment verified
                      </div>

                      <p className="text-sm text-[#18352B]">
                        Order: {verifiedPayment.order_number}
                      </p>

                      <p className="text-sm text-[#18352B]">
                        Payment Status: {verifiedPayment.status}
                      </p>

                      <p className="text-sm text-[#18352B]">
                        Payment Amount: {formatCurrency(verifiedPayment.amount)}
                      </p>

                      {verifiedPayment.status !== "SUCCESS" && (

                        <p className="text-xs text-red-700 pt-1">
                          Refund cannot be created because this payment is not successful.
                        </p>

                      )}

                    </div>

                  )}


                  <div>

                    <label className="block text-sm text-[#18352B] mb-2">
                      Refund Amount
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={verifiedPayment?.amount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      disabled={
                        !verifiedPayment ||
                        verifiedPayment.status !== "SUCCESS"
                      }
                      placeholder="Enter refund amount"
                      className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250] disabled:bg-gray-100"
                    />

                  </div>


                  <div>

                    <label className="block text-sm text-[#18352B] mb-2">
                      Refund Method
                    </label>

                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      disabled={
                        !verifiedPayment ||
                        verifiedPayment.status !== "SUCCESS"
                      }
                      className="w-full border border-[#DED7CA] px-4 py-3 text-sm bg-white disabled:bg-gray-100"
                    >

                      <option value="UPI">UPI</option>

                      <option value="BANK_TRANSFER">
                        Bank Transfer
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="block text-sm text-[#18352B] mb-2">
                      Admin Note (Optional)
                    </label>

                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Enter refund note..."
                      className="w-full border border-[#DED7CA] px-4 py-3 text-sm resize-none outline-none focus:border-[#A98250]"
                    />

                  </div>


                  <div className="flex justify-end gap-3 pt-4 border-t border-[#DED7CA]">

                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={processing}
                      className="px-5 py-3 border border-[#DED7CA] text-[#18352B]"
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      disabled={
                        processing ||
                        !verifiedPayment ||
                        verifiedPayment.status !== "SUCCESS"
                      }
                      className="flex items-center gap-2 px-5 py-3 bg-[#18352B] text-white disabled:opacity-50"
                    >

                      {processing
                        ? "Creating..."
                        : "Create Refund"}

                    </button>

                  </div>

                </form>

              )}


              {/* ==================================
                  COMPLETE / FAIL FORM
              ================================== */}

              {["COMPLETE", "FAIL"].includes(modal) && (

                <form
                  onSubmit={handleRefundAction}
                  className="space-y-5"
                >

                  <div className="bg-[#F7F4EE] p-4 space-y-2">

                    <p className="text-sm text-[#18352B]">
                      Refund ID: #{selectedRefund?.id}
                    </p>

                    <p className="text-sm text-[#18352B]">
                      Order: {selectedRefund?.order_number}
                    </p>

                    <p className="text-sm font-medium text-[#18352B]">
                      Amount: {formatCurrency(selectedRefund?.amount)}
                    </p>

                  </div>


                  {modal === "COMPLETE" && (

                    <div>

                      <label className="block text-sm text-[#18352B] mb-2">
                        Transaction Reference
                      </label>

                      <input
                        type="text"
                        value={transactionReference}
                        onChange={(e) =>
                          setTransactionReference(e.target.value)
                        }
                        required
                        maxLength={255}
                        placeholder="Enter bank / UPI transaction reference"
                        className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                      />

                    </div>

                  )}


                  <div>

                    <label className="block text-sm text-[#18352B] mb-2">
                      Admin Note (Optional)
                    </label>

                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Enter admin note..."
                      className="w-full border border-[#DED7CA] px-4 py-3 text-sm resize-none outline-none focus:border-[#A98250]"
                    />

                  </div>


                  <div className="flex justify-end gap-3 pt-4 border-t border-[#DED7CA]">

                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={processing}
                      className="px-5 py-3 border border-[#DED7CA] text-[#18352B]"
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      disabled={processing}
                      className={`px-5 py-3 text-white disabled:opacity-50 ${
                        modal === "COMPLETE"
                          ? "bg-green-700 hover:bg-green-800"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >

                      {processing
                        ? "Processing..."
                        : modal === "COMPLETE"
                          ? "Complete Refund"
                          : "Fail Refund"}

                    </button>

                  </div>

                </form>

              )}


              {/* ==================================
                  VIEW REFUND DETAILS
              ================================== */}

              {modal === "VIEW" && selectedRefund && (

                <div className="space-y-4">

                  <div>
                    <p className="text-xs text-[#77756F]">
                      Refund ID
                    </p>

                    <p className="text-sm text-[#18352B]">
                      #{selectedRefund.id}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Order Number
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {selectedRefund.order_number}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Payment ID
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {selectedRefund.payment}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Payment Amount
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {formatCurrency(selectedRefund.payment_amount)}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Refund Amount
                    </p>

                    <p className="text-sm font-medium text-[#18352B]">
                      {formatCurrency(selectedRefund.amount)}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Refund Method
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {selectedRefund.refund_method}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Status
                    </p>

                    <StatusBadge status={selectedRefund.status} />
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Transaction Reference
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {selectedRefund.transaction_reference || "—"}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Admin Note
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {selectedRefund.admin_note || "—"}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-[#77756F]">
                      Created At
                    </p>

                    <p className="text-sm text-[#18352B]">
                      {formatDate(selectedRefund.created_at)}
                    </p>
                  </div>


                  <div className="flex justify-end pt-4 border-t border-[#DED7CA]">

                    <button
                      onClick={closeModal}
                      className="px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D]"
                    >
                      Close
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}