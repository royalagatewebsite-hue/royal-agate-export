import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  AlertCircle,
} from "lucide-react";

import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    cart,
    items,
    totalItems,
    totalAmount,
    loading,
    refreshCart,
    updateItem,
    removeItem,
    emptyCart,
  } = useCart();

  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Initial cart loading
  useEffect(() => {
    refreshCart()
      .catch(() => {
        setError("Unable to load your shopping cart.");
      })
      .finally(() => {
        setPageLoading(false);
      });
  }, [refreshCart]);

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString("en-IN")}`;
  };

  // Update quantity
  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    setError("");
    setActionLoading(item.id);

    try {
      await updateItem(item.id, newQuantity);
    } catch (err) {
      setError(err.message || "Unable to update quantity.");
    } finally {
      setActionLoading(null);
    }
  };

  // Remove product
  const handleRemove = async (itemId) => {
    setError("");
    setActionLoading(itemId);

    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err.message || "Unable to remove product.");
    } finally {
      setActionLoading(null);
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove all products from your cart?"
    );

    if (!confirmed) return;

    setError("");
    setActionLoading("clear");

    try {
      await emptyCart();
    } catch (err) {
      setError(err.message || "Unable to clear cart.");
    } finally {
      setActionLoading(null);
    }
  };

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE]">
        <p className="text-sm uppercase tracking-[0.2em] text-[#A98250]">
          Loading Your Cart...
        </p>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EE] px-6">
        <AlertCircle size={40} className="text-[#A98250]" />

        <h2 className="mt-6 font-serif text-3xl text-[#18352B]">
          Unable to Load Cart
        </h2>

        <p className="mt-3 text-sm text-[#77756F]">
          {error || "Please try again."}
        </p>

        <button
          onClick={() => {
            setPageLoading(true);
            setError("");

            refreshCart()
              .catch(() => {
                setError("Unable to load your shopping cart.");
              })
              .finally(() => setPageLoading(false));
          }}
          className="mt-6 bg-[#18352B] px-8 py-4 text-xs uppercase tracking-widest text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <section className="min-h-screen bg-[#F7F4EE] px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">

          <ShoppingBag
            size={55}
            strokeWidth={1}
            className="mx-auto text-[#A98250]"
          />

          <h1 className="mt-8 font-serif text-4xl text-[#18352B]">
            Your Cart is Empty
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#77756F]">
            Discover our exclusive collection of natural agate
            gemstones and handcrafted jewellery.
          </p>

          <Link
            to="/collections"
            className="mt-9 inline-flex items-center gap-3 bg-[#18352B] px-9 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
          >
            Explore Collections
            <ArrowRight size={16} />
          </Link>

        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-6 py-16">

      <div className="mx-auto max-w-[1300px]">

        {/* Page Heading */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#A98250]">
              Your Selection
            </p>

            <h1 className="font-serif text-4xl text-[#18352B] md:text-5xl">
              Shopping Cart
            </h1>

            <p className="mt-3 text-sm text-[#77756F]">
              {totalItems} items in your cart
            </p>
          </div>

          <button
            onClick={handleClearCart}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 text-xs uppercase tracking-wider text-red-600 transition hover:text-red-800 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Clear Cart
          </button>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">

          {/* Cart Items */}
          <div>

            <div className="hidden grid-cols-[1fr_130px_120px_100px] gap-5 border-b border-[#DED7CA] pb-4 text-[10px] uppercase tracking-[0.15em] text-[#A98250] md:grid">
              <span>Product</span>
              <span>Quantity</span>
              <span>Subtotal</span>
              <span>Action</span>
            </div>

            <div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-5 border-b border-[#DED7CA] py-7 md:grid-cols-[1fr_130px_120px_100px] md:items-center"
                >

                  {/* Product Information */}
                  <div className="flex gap-5">

                    <div className="h-28 w-24 shrink-0 overflow-hidden bg-[#EAE4D9]">

                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="text-[#A98250]" />
                        </div>
                      )}

                    </div>

                    <div className="flex flex-col justify-center">

                      <h3 className="font-serif text-xl text-[#18352B]">
                        {item.product_name}
                      </h3>

                      <p className="mt-2 text-[10px] uppercase tracking-widest text-[#A98250]">
                        {item.purchase_mode}
                      </p>

                      <p className="mt-2 text-sm text-[#77756F]">
                        {formatPrice(item.unit_price)} / unit
                      </p>

                      <p className="mt-1 text-xs text-[#99948B]">
                        SKU: {item.product_sku}
                      </p>

                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          item.quantity - 1
                        )
                      }
                      disabled={
                        actionLoading !== null ||
                        item.quantity <= 1
                      }
                      className="border border-[#DED7CA] p-2 text-[#18352B] hover:border-[#A98250] disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>

                    <span className="min-w-6 text-center text-sm text-[#18352B]">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          item.quantity + 1
                        )
                      }
                      disabled={actionLoading !== null}
                      className="border border-[#DED7CA] p-2 text-[#18352B] hover:border-[#A98250] disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>

                  </div>

                  {/* Subtotal */}
                  <div>
                    <p className="text-xs text-[#A98250] md:hidden">
                      Subtotal
                    </p>

                    <p className="font-medium text-[#18352B]">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-2 text-xs uppercase tracking-wider text-red-600 transition hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>

                  </div>

                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <Link
              to="/collections"
              className="mt-8 inline-flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-[#18352B] transition hover:text-[#A98250]"
            >
              ← Continue Shopping
            </Link>

          </div>

          {/* Order Summary */}
          <aside className="h-fit border border-[#DED7CA] bg-[#FAF8F3] p-7">

            <h2 className="font-serif text-2xl text-[#18352B]">
              Order Summary
            </h2>

            <div className="my-6 h-px bg-[#DED7CA]" />

            <div className="flex justify-between text-sm text-[#77756F]">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="my-5 flex justify-between text-sm text-[#77756F]">
              <span>Subtotal</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>

            <div className="h-px bg-[#DED7CA]" />

            <div className="mt-6 flex justify-between gap-3">
              <span className="text-sm font-medium text-[#18352B]">
                Estimated Total
              </span>

              <span className="text-xl font-medium text-[#18352B]">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-[#99948B]">
              Shipping charges and applicable taxes will be
              calculated during checkout.
            </p>

            

            <p className="mt-3 text-center text-[10px] text-[#99948B]">
              <Link
               to="/checkout"
               className="mt-8 flex w-full items-center justify-center gap-3 bg-[#18352B] px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </Link>
            </p>

          </aside>

        </div>

      </div>

    </section>
  );
}