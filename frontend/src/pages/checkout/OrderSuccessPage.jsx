import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { getOrderById } from "../../services/orderService";

export default function OrderSuccessPage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrderById(orderId);

      const orderData =
        response?.data?.order ||
        response?.order ||
        response?.data ||
        response;

      if (!orderData?.id) {
        throw new Error("Invalid order information received.");
      }

      setOrder(orderData);
    } catch (err) {
      setError(
        err.message || "Unable to load your order details."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F4EE]">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#A98250]"
          />
          <p className="mt-4 text-sm text-[#77756F]">
            Confirming your order...
          </p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F4EE] px-5">
        <div className="max-w-md border border-[#DED7CA] bg-white p-8 text-center">
          <AlertCircle
            size={35}
            className="mx-auto text-red-600"
          />

          <h2 className="mt-4 font-serif text-2xl text-[#18352B]">
            Unable to Load Order
          </h2>

          <p className="mt-3 text-sm text-[#77756F]">
            {error || "Order details are unavailable."}
          </p>

          <button
            onClick={fetchOrder}
            className="mt-6 bg-[#18352B] px-6 py-3 text-xs uppercase tracking-wider text-white hover:bg-[#A98250]"
          >
            Try Again
          </button>

          <div>
            <Link
              to="/account/orders"
              className="mt-5 inline-block text-xs text-[#A98250] hover:underline"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-5 py-16">
      <div className="mx-auto max-w-2xl">

        <div className="border border-[#DED7CA] bg-[#FAF8F3] p-8 text-center md:p-12">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAE4D9]">
            <CheckCircle2
              size={42}
              className="text-[#18352B]"
            />
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[#A98250]">
            Royal Agate Export
          </p>

          <h1 className="mt-4 font-serif text-3xl text-[#18352B] md:text-4xl">
            Thank You for Your Order!
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#77756F]">
            Your order has been successfully confirmed.
            We appreciate your trust in Royal Agate Export.
          </p>

          <div className="mt-9 border-y border-[#DED7CA] py-6">

            <p className="text-xs uppercase tracking-wider text-[#77756F]">
              Order Number
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#18352B]">
              {order.order_number}
            </h2>

            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-xs text-[#77756F]">
                Payment Status:
              </span>

              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {String(order.payment_status || "PENDING").replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              <Package size={17} className="text-[#A98250]" />

              <span className="text-sm text-[#77756F]">
                Order Total:{" "}
                <strong className="text-[#18352B]">
                  {formatCurrency(order.total_amount)}
                </strong>
              </span>
            </div>

          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to={`/account/orders/${order.id}`}
              className="flex items-center justify-center gap-2 bg-[#18352B] px-7 py-4 text-xs uppercase tracking-wider text-white transition hover:bg-[#A98250]"
            >
              <Package size={16} />
              View Order Details
            </Link>

            <Link
              to="/collections"
              className="flex items-center justify-center gap-2 border border-[#DED7CA] px-7 py-4 text-xs uppercase tracking-wider text-[#18352B] transition hover:border-[#A98250]"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}