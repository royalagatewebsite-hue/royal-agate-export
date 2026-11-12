import { useEffect, useState } from "react";
import {
  X,
  History,
  Plus,
  Minus,
  Package,
  Clock,
  User,
} from "lucide-react";

import inventoryService from "../../../services/inventoryService";

export default function StockHistoryModal({ item, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await inventoryService.getMovements({
          product: item.product,
          page_size: 100,
        });

        setMovements(response.results || []);
      } catch (err) {
        setError(
          err.message || "Unable to load stock history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [item.product]);

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

  const getAdminName = (createdBy) => {
    if (!createdBy) return "System";

    if (typeof createdBy === "object") {
      return (
        createdBy.username ||
        createdBy.email ||
        `Admin #${createdBy.id}`
      );
    }

    return `Admin #${createdBy}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DED7CA] p-5">
          <div>
            <div className="flex items-center gap-2">
              <History size={21} className="text-[#A98250]" />

              <h2 className="text-xl font-semibold text-[#18352B]">
                Stock Movement History
              </h2>
            </div>

            <p className="mt-1 text-sm text-[#77756F]">
              {item.product_name} · SKU: {item.product_sku}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#77756F] hover:bg-[#F7F4EE]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Stock */}
        <div className="m-5 flex items-center gap-3 rounded-xl bg-[#F7F4EE] p-4">
          <div className="rounded-lg bg-white p-3 text-[#A98250]">
            <Package size={22} />
          </div>

          <div>
            <p className="text-sm text-[#77756F]">
              Current Stock
            </p>

            <p className="text-xl font-semibold text-[#18352B]">
              {item.quantity} Units
            </p>
          </div>
        </div>

        {/* History Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">

          {loading && (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#DED7CA] border-t-[#18352B]" />

              <p className="mt-3 text-sm text-[#77756F]">
                Loading stock history...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && movements.length === 0 && (
            <div className="rounded-xl border border-[#DED7CA] p-10 text-center">
              <History
                size={36}
                className="mx-auto text-[#A98250]"
              />

              <h3 className="mt-3 font-semibold text-[#18352B]">
                No Stock History
              </h3>

              <p className="mt-1 text-sm text-[#77756F]">
                Stock movements will appear here.
              </p>
            </div>
          )}

          {!loading && movements.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#DED7CA]">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#F7F4EE]">
                  <tr className="text-xs uppercase tracking-wider text-[#77756F]">
                    <th className="px-4 py-4">Date & Time</th>
                    <th className="px-4 py-4">Movement</th>
                    <th className="px-4 py-4">Quantity</th>
                    <th className="px-4 py-4">Previous Stock</th>
                    <th className="px-4 py-4">New Stock</th>
                    <th className="px-4 py-4">Reason</th>
                    <th className="px-4 py-4">Updated By</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DED7CA]">
                  {movements.map((movement) => {
                    const isIncrease =
                      movement.movement_type === "INCREASE";

                    return (
                      <tr
                        key={movement.id}
                        className="hover:bg-[#FAF9F6]"
                      >
                        <td className="px-4 py-4 text-sm text-[#77756F]">
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            {formatDate(movement.created_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isIncrease
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {isIncrease ? (
                              <Plus size={13} />
                            ) : (
                              <Minus size={13} />
                            )}

                            {isIncrease ? "Increase" : "Decrease"}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-semibold text-[#18352B]">
                          {movement.quantity}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#77756F]">
                          {movement.stock_before}
                        </td>

                        <td className="px-4 py-4 font-semibold text-[#18352B]">
                          {movement.stock_after}
                        </td>

                        <td className="max-w-[180px] px-4 py-4 text-sm text-[#77756F]">
                          {movement.reason || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#77756F]">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            {getAdminName(movement.created_by)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#DED7CA] p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DED7CA] px-5 py-2.5 text-sm font-medium text-[#18352B] hover:bg-[#F7F4EE]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}