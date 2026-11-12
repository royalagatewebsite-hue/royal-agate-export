import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Smartphone,
} from "lucide-react";

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getCheckoutPreview,
} from "../../services/addressService";
import { createOrder } from "../../services/orderService";
import {
  createPaymentAttempt,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../../services/paymentService";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [savingAddress, setSavingAddress] = useState(false);
  // Address Editing
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone_number: "",
    address_line_1: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    is_default: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Checkout Preview
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Payment and order placement
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(() => {
    try {
      const savedOrder = sessionStorage.getItem("royal_agate_pending_order");
      return savedOrder ? JSON.parse(savedOrder) : null;
    } catch {
      return null;
    }
  });
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentAttempt, setPaymentAttempt] = useState(null);

  const [onlinePaymentSuccessful, setOnlinePaymentSuccessful] = useState(false);

  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAddresses();

        setAddresses(data);

        const defaultAddress = data.find(
          (address) => address.is_default
        );

        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        } else if (data.length > 0) {
          setSelectedAddress(data[0].id);
        }
      } catch (err) {
        setError(
          err.message || "Unable to load saved addresses."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Address form handler
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Edit existing address
  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);

    setAddressForm({
        full_name: address.full_name,
        phone_number: address.phone_number,
        address_line_1: address.address_line_1,
        city: address.city,
        district: address.district || "",
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        is_default: address.is_default,
    });

    setError("");
    setShowAddressForm(true);
  };

    // Delete address
  const handleDeleteAddress = async (addressId) => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
        setError("");

        await deleteAddress(addressId);

        if (editingAddressId === addressId) {
            setEditingAddressId(null);
            setShowAddressForm(false);
        }

        const updatedAddresses = await getAddresses();

        setAddresses(updatedAddresses);

        if (selectedAddress === addressId) {
        const defaultAddress = updatedAddresses.find(
            (address) => address.is_default
        );

        setSelectedAddress(
            defaultAddress?.id || updatedAddresses[0]?.id || null
        );
        }
    } catch (err) {
        setError(err.message || "Unable to delete address.");
    }
  };

  // Checkout Preview API
  const handleCheckoutPreview = async (addressId) => {
    if (!addressId) {
      setCheckoutPreview(null);
      setPreviewError("Please select a delivery address.");
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewError("");
      setCheckoutPreview(null);

      const response = await getCheckoutPreview(addressId);

      setCheckoutPreview(response);
    } catch (err) {
      setPreviewError(
        err.message || "Unable to generate checkout preview."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // Refresh preview whenever selected address changes
  useEffect(() => {
    if (!selectedAddress) {
      setCheckoutPreview(null);
      setPreviewError("");
      return;
    }

    handleCheckoutPreview(selectedAddress);
  }, [selectedAddress]);

  // Place order, then create a cash payment attempt.
  // If payment attempt creation fails, retain the same order for retry.
  const handlePlaceOrder = async () => {
    if (placingOrder) return;

    if (!pendingOrder && !selectedAddress) {
      setPaymentError("Please select a delivery address.");
      return;
    }

    if (!pendingOrder && !checkoutPreview?.items?.length) {
      setPaymentError("Your cart is empty or the checkout preview is unavailable.");
      return;
    }

    setPlacingOrder(true);
    setPaymentError("");

    try {
      let orderToPay = pendingOrder;

      if (!orderToPay) {
        const orderResponse = await createOrder(selectedAddress, "");
        orderToPay = orderResponse.order;

        if (!orderToPay?.id) {
          throw new Error("The order was created, but its ID was not returned. Please contact support before retrying.");
        }

        sessionStorage.setItem(
          "royal_agate_pending_order",
          JSON.stringify(orderToPay)
        );
        setPendingOrder(orderToPay);
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `rae-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

      const attemptResponse = await createPaymentAttempt({
        orderId: orderToPay.id,
        paymentMethod,
        idempotencyKey,
      });

      setPaymentAttempt(attemptResponse.attempt || attemptResponse);
      setPlacedOrder(orderToPay);
      setShowOrderConfirmation(false);
      setPendingOrder(null);
      sessionStorage.removeItem("royal_agate_pending_order");
    } catch (err) {
      setPaymentError(
        err.message ||
          "Unable to complete the payment step. If the order was created, it has been retained for a safe retry."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (placingOrder) return;

    if (!pendingOrder && !selectedAddress) {
      setPaymentError("Please select a delivery address.");
      return;
    }

    if (!pendingOrder && !checkoutPreview?.items?.length) {
      setPaymentError("Your cart is empty or checkout preview is unavailable.");
      return;
    }

    setPlacingOrder(true);
    setPaymentError("");

    try {
      // Reuse an existing pending order or create a new one.
      let orderToPay = pendingOrder;

      if (!orderToPay) {
        const orderResponse = await createOrder(selectedAddress, "");
        orderToPay = orderResponse.order;

        if (!orderToPay?.id) {
          throw new Error("Order ID was not returned. Please contact support.");
        }

        sessionStorage.setItem(
          "royal_agate_pending_order",
          JSON.stringify(orderToPay)
        );

        setPendingOrder(orderToPay);
      }

      // Create Razorpay gateway order.
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `rae-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

      const razorpayOrder = await createRazorpayOrder({
        orderId: orderToPay.id,
        idempotencyKey,
      });

      if (!razorpayOrder?.key_id || !razorpayOrder?.razorpay_order_id) {
        throw new Error("Unable to initialize Razorpay payment.");
      }

      // Load Razorpay Checkout script.
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      const address = addresses.find(
        (item) => item.id === selectedAddress
      );

      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Royal Agate Export",
        description: `Order ${orderToPay.order_number}`,
        order_id: razorpayOrder.razorpay_order_id,

        prefill: {
          name: address?.full_name || "",
          contact: address?.phone_number || "",
        },

        theme: {
          color: "#18352B",
        },

        handler: async (response) => {
          try {
            const verification = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentAttempt(
              verification.attempt || razorpayOrder.attempt
            );

            setPlacedOrder(orderToPay);
            setOnlinePaymentSuccessful(true);
            setPendingOrder(null);

            sessionStorage.removeItem("royal_agate_pending_order");
            setPaymentError("");
          } catch (err) {
            setPaymentError(
              "We received your payment response but could not verify it yet. Please do not pay again immediately. Refresh shortly or contact support."
            );
          } finally {
            setPlacingOrder(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            setPaymentError(
              "Payment was not completed. Your order is saved, so you can retry."
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setPlacingOrder(false);
        setPaymentError(
          response.error?.description || "Payment failed. You can retry."
        );
      });

      razorpay.open();
    } catch (err) {
      setPaymentError(
        err.message || "Unable to start Razorpay payment."
      );
      setPlacingOrder(false);
    }
  };

  // Save new address
  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSavingAddress(true);

    try {
        let savedAddressId;

        if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
        savedAddressId = editingAddressId;
        } else {
        const response = await createAddress(addressForm);
        savedAddressId = response.address.id;
        }

        const updatedAddresses = await getAddresses();

        setAddresses(updatedAddresses);
        setSelectedAddress(savedAddressId);

        setAddressForm({
        full_name: "",
        phone_number: "",
        address_line_1: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
        is_default: false,
        });

        setEditingAddressId(null);
        setShowAddressForm(false);

    } catch (err) {
        setError(
        err.message || "Unable to save delivery address."
        );
    } finally {
        setSavingAddress(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-6 py-16">
      <div className="mx-auto max-w-[1200px]">

        {/* Page Heading */}
        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#A98250]">
            Secure Checkout
          </p>

          <h1 className="font-serif text-4xl text-[#18352B] md:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 text-sm text-[#77756F]">
            Choose your delivery address to continue.
          </p>
        </div>

        {/* Two Column Checkout Layout */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.4fr_0.9fr]">

          {/* LEFT COLUMN - Delivery Address */}
          <div>

            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">

              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-[#A98250]" />

                <h2 className="font-serif text-2xl text-[#18352B]">
                  Delivery Address
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                    setError("");
                    setEditingAddressId(null);
                    setAddressForm({
                        full_name: "",
                        phone_number: "",
                        address_line_1: "",
                        city: "",
                        district: "",
                        state: "",
                        pincode: "",
                        country: "India",
                        is_default: false,
                    });
                    setShowAddressForm(true);
                }}
                className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#A98250] hover:text-[#18352B]"
              >
                <Plus size={16} />
                Add New Address
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 py-10 text-sm text-[#77756F]">
                <LoaderCircle size={20} className="animate-spin" />
                Loading saved addresses...
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-5 text-sm text-red-600">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* No Address */}
            {!loading && !error && addresses.length === 0 && (
              <div className="border border-[#DED7CA] bg-[#FAF8F3] p-8 text-center">
                <MapPin
                  size={35}
                  className="mx-auto text-[#A98250]"
                />

                <h3 className="mt-4 font-serif text-xl text-[#18352B]">
                  No Saved Addresses
                </h3>

                <p className="mt-2 text-sm text-[#77756F]">
                  Add a delivery address to continue with checkout.
                </p>
              </div>
            )}

            {/* Saved Addresses */}
            {!loading && addresses.length > 0 && (
                <div className="space-y-4">

                    {addresses.map((address) => (
                    <div
                        key={address.id}
                        className={`border p-6 transition ${
                        selectedAddress === address.id
                            ? "border-[#18352B] bg-[#FAF8F3]"
                            : "border-[#DED7CA] bg-white hover:border-[#A98250]"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">

                        <label className="flex flex-1 cursor-pointer items-start gap-4">

                            <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddress === address.id}
                            onChange={() => setSelectedAddress(address.id)}
                            className="mt-1 accent-[#18352B]"
                            />

                            <div>
                            <h3 className="font-medium text-[#18352B]">
                                {address.full_name}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#77756F]">
                                {address.address_line_1}
                                <br />

                                {[address.city, address.district, address.state]
                                    .filter(Boolean)
                                    .join(", ")} - {address.pincode}
                                <br />

                                {address.country}
                            </p>

                            <p className="mt-3 text-sm text-[#18352B]">
                                Phone: {address.phone_number}
                            </p>
                            </div>

                        </label>

                        <div className="flex shrink-0 flex-col items-end gap-3">

                            {address.is_default && (
                            <span className="bg-[#EAE4D9] px-3 py-2 text-[9px] uppercase tracking-wider text-[#A98250]">
                                Default
                            </span>
                            )}

                            <div className="flex gap-3">

                            <button
                                type="button"
                                onClick={() => handleEditAddress(address)}
                                className="text-xs uppercase tracking-wider text-[#18352B] hover:text-[#A98250]"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-xs uppercase tracking-wider text-red-600 hover:text-red-800"
                            >
                                Delete
                            </button>

                            </div>
                        </div>

                        </div>
                    </div>
                    ))}

                </div>
            )}

            {/* Add New Address Form */}
            {showAddressForm && (
              <form
                onSubmit={handleAddressSubmit}
                className="mt-8 border border-[#DED7CA] bg-[#FAF8F3] p-6 md:p-8"
              >
                <h3 className="mb-7 font-serif text-2xl text-[#18352B]">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {[
                    { name: "full_name", label: "Full Name" },
                    { name: "phone_number", label: "Phone Number" },
                    { name: "address_line_1", label: "Address Line 1" },
                    { name: "city", label: "City" },
                    { name: "district", label: "District" },
                    { name: "state", label: "State" },
                    { name: "pincode", label: "Pincode" },
                    { name: "country", label: "Country" },
                  ].map((field) => (
                    <div
                      key={field.name}
                      className={
                        field.name === "address_line_1"
                          ? "md:col-span-2"
                          : ""
                      }
                    >
                      <label className="mb-2 block text-xs uppercase tracking-wider text-[#77756F]">
                        {field.label}
                      </label>

                      <input
                        type="text"
                        name={field.name}
                        value={addressForm[field.name]}
                        onChange={handleAddressChange}
                        required
                        className="w-full border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#252522] outline-none focus:border-[#A98250]"
                      />
                    </div>
                  ))}

                </div>

                <label className="mt-6 flex items-center gap-3 text-sm text-[#18352B]">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={addressForm.is_default}
                    onChange={handleAddressChange}
                    className="accent-[#18352B]"
                  />

                  Set as default address
                </label>

                <div className="mt-8 flex flex-wrap gap-3">

                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="bg-[#18352B] px-8 py-4 text-xs uppercase tracking-wider text-white transition hover:bg-[#A98250] disabled:opacity-50"
                  >
                    {savingAddress
                        ? "Saving..."
                        : editingAddressId
                            ? "Update Address"
                            : "Save Address"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);

                        setAddressForm({
                            full_name: "",
                            phone_number: "",
                            address_line_1: "",
                            city: "",
                            district: "",
                            state: "",
                            pincode: "",
                            country: "India",
                            is_default: false,
                        });
                    }}
                    disabled={savingAddress}
                    className="border border-[#DED7CA] px-8 py-4 text-xs uppercase tracking-wider text-[#18352B]"
                  >
                    Cancel
                  </button>

                </div>
              </form>
            )}

          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="border border-[#DED7CA] bg-[#FAF8F3] p-6 md:p-8 lg:sticky lg:top-28">

            <h2 className="font-serif text-2xl text-[#18352B]">
              Order Summary
            </h2>

            {/* Preview Loading */}
            {previewLoading && (
              <div className="flex items-center gap-3 py-8 text-sm text-[#77756F]">
                <LoaderCircle size={20} className="animate-spin" />
                Preparing your order...
              </div>
            )}

            {/* Preview Error */}
            {previewError && (
              <div className="mt-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle size={18} className="shrink-0" />
                {previewError}
              </div>
            )}

            {/* Empty Preview */}
            {!previewLoading && !previewError && !checkoutPreview && (
              <p className="mt-5 text-sm text-[#77756F]">
                Select a delivery address to view your order summary.
              </p>
            )}

            {/* Existing order awaiting a payment attempt */}
            {pendingOrder && !placedOrder && (
              <div className="mt-6 border border-[#A98250] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-[#A98250]">
                  Order already created
                </p>
                <h3 className="mt-2 font-serif text-xl text-[#18352B]">
                  {pendingOrder.order_number}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#77756F]">
                  Your order is saved. Complete the payment step below to avoid creating a duplicate order.
                </p>
                <p className="mt-3 text-sm font-medium text-[#18352B]">
                  Order total: ₹{Number(pendingOrder.total_amount).toLocaleString("en-IN")}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`border p-3 text-sm ${
                      paymentMethod === "CASH"
                        ? "border-[#18352B] bg-[#EAE4D9] text-[#18352B]"
                        : "border-[#DED7CA] bg-white text-[#77756F]"
                    }`}
                  >
                    Cash on Delivery (COD)
                  </button>

                  <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("RAZORPAY");
                        setPaymentError("");
                      }}
                      className={`flex items-center gap-3 border p-4 text-left transition ${
                        paymentMethod === "RAZORPAY"
                          ? "border-[#18352B] bg-[#EAE4D9]"
                          : "border-[#DED7CA] bg-white hover:border-[#A98250]"
                      }`}
                  >
                      <Smartphone size={20} className="text-[#A98250]" />

                      <span>
                        <span className="block text-sm font-medium text-[#18352B]">
                          Online Payment
                        </span>
                        <span className="mt-1 block text-xs text-[#77756F]">
                          Pay using UPI and supported payment apps
                        </span>
                      </span>
                  </button>

                </div>


                {paymentError && (
                  <p className="mt-4 text-sm text-red-600">{paymentError}</p>
                )}

                <button
                  type="button"
                  onClick={
                    paymentMethod === "RAZORPAY"
                      ? handleRazorpayPayment
                      : handlePlaceOrder
                  }
                  disabled={placingOrder}
                  className="mt-5 flex w-full items-center justify-center gap-2 bg-[#18352B] px-5 py-4 text-xs uppercase tracking-wider text-white hover:bg-[#A98250] disabled:opacity-50"
                >
                  {placingOrder ? "Retrying Payment..." : "Retry Payment"}
                </button>
              </div>
            )}

            {/* Order placed confirmation */}
            {placedOrder && (
              <div className="mt-6 border border-[#A98250] bg-white p-6">
                <CheckCircle2 size={30} className="text-[#A98250]" />
                <p className="mt-4 text-xs uppercase tracking-[0.15em] text-[#A98250]">
                  Order placed successfully
                </p>
                <h3 className="mt-2 font-serif text-2xl text-[#18352B]">
                  {placedOrder.order_number}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#77756F]">
                  {onlinePaymentSuccessful
                    ? "Your online payment has been successfully verified. Thank you for shopping with us."
                    : "Your payment is pending manual verification. We will update your order after the payment is reviewed."}
                </p>
                <div className="mt-5 flex justify-between border-t border-[#DED7CA] pt-4 text-sm">
                  <span className="text-[#77756F]">Payment status</span>
                  <span className="font-medium text-[#A98250]">
                    {onlinePaymentSuccessful ? "Paid" : "Pending verification"}
                  </span>
                  
                </div>
                {paymentAttempt?.attempt_number && (
                  <p className="mt-2 text-xs text-[#77756F]">
                    Payment attempt #{paymentAttempt.attempt_number} created.
                  </p>
                )}
              </div>
            )}

            {/* Preview Data */}
            {!previewLoading && checkoutPreview && !placedOrder && !pendingOrder && (
              <>
                <div className="mt-6 space-y-5">

                  {checkoutPreview.items?.map((item) => (
                    <div
                      key={`${item.product_id}-${item.purchase_mode}`}
                      className="flex gap-4 border-b border-[#DED7CA] pb-5"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden bg-[#EAE4D9]">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-[#18352B]">
                          {item.product_name}
                        </h3>

                        <p className="mt-1 text-xs text-[#77756F]">
                          {item.purchase_mode} · Qty: {item.quantity}
                        </p>

                        <p className="mt-2 text-sm text-[#252522]">
                          ₹{Number(item.subtotal).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}

                </div>

                <div className="mt-6 space-y-4">

                  <div className="flex justify-between text-sm text-[#77756F]">
                    <span>Total Items</span>
                    <span>{checkoutPreview.total_items}</span>
                  </div>

                  <div className="flex justify-between text-sm text-[#77756F]">
                    <span>Subtotal</span>
                    <span>
                      ₹{Number(checkoutPreview.subtotal).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#DED7CA] pt-5">
                    <span className="font-medium text-[#18352B]">
                      Total Amount
                    </span>

                    <span className="font-serif text-xl text-[#18352B]">
                      ₹{Number(checkoutPreview.total_amount).toLocaleString("en-IN")}
                    </span>
                  </div>

                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-[#77756F]">
                  <CheckCircle2 size={15} className="text-[#A98250]" />
                  Prices and inventory validated.
                </div>

                {/* Payment Method */}
                <div className="mt-8 border-t border-[#DED7CA] pt-6">
                  <h3 className="font-serif text-xl text-[#18352B]">
                    Payment Method
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("CASH");
                        setPaymentError("");
                      }}
                      className={`flex items-center gap-3 border p-4 text-left transition ${
                        paymentMethod === "CASH"
                          ? "border-[#18352B] bg-[#EAE4D9]"
                          : "border-[#DED7CA] bg-white hover:border-[#A98250]"
                      }`}
                    >
                      <Banknote size={20} className="text-[#A98250]" />
                      <span>
                        <span className="block text-sm font-medium text-[#18352B]">
                          Cash on Delivery (COD)
                        </span>
                        <span className="mt-1 block text-xs text-[#77756F]">
                          Pay when your order is delivered
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("RAZORPAY");
                        setPaymentError("");
                      }}
                      className={`flex items-center gap-3 border p-4 text-left transition ${
                        paymentMethod === "RAZORPAY"
                          ? "border-[#18352B] bg-[#EAE4D9]"
                          : "border-[#DED7CA] bg-white hover:border-[#A98250]"
                      }`}
                    >
                      <Smartphone size={20} className="text-[#A98250]" />

                      <span>
                        <span className="block text-sm font-medium text-[#18352B]">
                          Online Payment
                        </span>
                        <span className="mt-1 block text-xs text-[#77756F]">
                          Pay using UPI and supported payment apps
                        </span>
                      </span>
                    </button>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-[#77756F]">
                    {paymentMethod === "CASH"
                      ? "Payment will be collected at the time of delivery."
                      : "You will be redirected to Razorpay's secure checkout to complete your payment."}
                  </p>

                  {paymentError && (
                    <div className="mt-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod === "CASH") {
                        setShowOrderConfirmation(true);
                      } else {
                        handleRazorpayPayment();
                      }
                    }}
                    disabled={placingOrder || previewLoading || (!pendingOrder && !checkoutPreview)}
                    className="mt-6 flex w-full items-center justify-center gap-3 bg-[#18352B] px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {placingOrder ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        {pendingOrder ? "Retrying Payment..." : "Placing Order..."}
                      </>
                    ) : pendingOrder
                      ? "Retry Payment"
                      : paymentMethod === "CASH"
                        ? "Place Order"
                        : "Pay Securely"}
                  </button>
                </div>
              </>
            )}

          </div>

        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md border border-[#DED7CA] bg-[#FAF8F3] p-7 shadow-xl">

            <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
              Order Confirmation
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#18352B]">
              Confirm Your Order
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#77756F]">
              Are you sure you want to place this order with Cash on Delivery?
            </p>

            <div className="mt-6 border-y border-[#DED7CA] py-5 space-y-3">

              <div className="flex justify-between text-sm">
                <span className="text-[#77756F]">Payment Method</span>
                <span className="font-medium text-[#18352B]">
                  Cash on Delivery
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#77756F] text-sm">Order Total</span>

                <span className="font-serif text-xl text-[#18352B]">
                  ₹{Number(checkoutPreview?.total_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>

            </div>

            {paymentError && (
              <p className="mt-4 text-sm text-red-600">
                {paymentError}
              </p>
            )}

            <div className="mt-7 flex gap-3">

              <button
                type="button"
                disabled={placingOrder}
                onClick={() => setShowOrderConfirmation(false)}
                className="flex-1 border border-[#DED7CA] px-4 py-3 text-xs uppercase tracking-wider text-[#18352B] hover:bg-[#EAE4D9] disabled:opacity-50"
              >
                Go Back
              </button>

              <button
                type="button"
                disabled={placingOrder}
                onClick={handlePlaceOrder}
                className="flex-1 bg-[#18352B] px-4 py-3 text-xs uppercase tracking-wider text-white hover:bg-[#A98250] disabled:opacity-50"
              >
                {placingOrder ? "Processing..." : "Confirm Order"}
              </button>

            </div>

          </div>

        </div>
      )}


    </section>
  );
}
