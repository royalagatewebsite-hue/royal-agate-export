import { useState } from "react";
import { X, Plus, Minus, Package } from "lucide-react";
import inventoryService from "../../../services/inventoryService";

export default function ManageStockModal({
  item,
  onClose,
  onSuccess,
}) {
  const [movementType, setMovementType] = useState("INCREASE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for this stock adjustment.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await inventoryService.adjustStock({
        product_id: item.product,
        movement_type: movementType,
        quantity: parsedQuantity,
        reason: reason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.message || "Unable to adjust stock. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DED7CA] p-5">
          <div>
            <h2 className="text-xl font-semibold text-[#18352B]">
              Manage Stock
            </h2>

            <p className="mt-1 text-sm text-[#77756F]">
              Adjust product inventory quantity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-[#77756F] hover:bg-[#F7F4EE]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Information */}
        <div className="m-5 flex items-center gap-3 rounded-xl bg-[#F7F4EE] p-4">
          <div className="rounded-lg bg-white p-3 text-[#A98250]">
            <Package size={22} />
          </div>

          <div>
            <h3 className="font-medium text-[#18352B]">
              {item.product_name}
            </h3>

            <p className="mt-1 text-sm text-[#77756F]">
              SKU: {item.product_sku}
            </p>

            <p className="mt-1 text-sm font-medium text-[#18352B]">
              Current Stock: {item.quantity}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-5 pt-0">

          {/* Movement Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#18352B]">
              Stock Adjustment Type
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => setMovementType("INCREASE")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  movementType === "INCREASE"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-[#DED7CA] text-[#77756F]"
                }`}
              >
                <Plus size={17} />
                Increase Stock
              </button>

              <button
                type="button"
                onClick={() => setMovementType("DECREASE")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  movementType === "DECREASE"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-[#DED7CA] text-[#77756F]"
                }`}
              >
                <Minus size={17} />
                Decrease Stock
              </button>

            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#18352B]">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full rounded-lg border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#18352B]">
              Reason
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for stock adjustment..."
              rows={3}
              maxLength={255}
              className="w-full resize-none rounded-lg border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
              required
            />

            <p className="mt-1 text-right text-xs text-[#77756F]">
              {reason.length}/255
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-[#DED7CA] pt-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[#DED7CA] px-5 py-2.5 text-sm font-medium text-[#77756F] hover:bg-[#F7F4EE] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#18352B] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#24483A] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Stock"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}