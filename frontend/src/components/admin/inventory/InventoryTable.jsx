import {
  Package,
  AlertTriangle,
  CircleX,
  SlidersHorizontal,
  History,
} from "lucide-react";

function getStockStatus(item) {
  if (item.quantity === 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-50 text-red-700",
      icon: CircleX,
    };
  }

  if (item.is_low_stock) {
    return {
      label: "Low Stock",
      className: "bg-amber-50 text-amber-700",
      icon: AlertTriangle,
    };
  }

  return {
    label: "In Stock",
    className: "bg-green-50 text-green-700",
    icon: Package,
  };
}

export default function InventoryTable({
  inventory = [],
  loading = false,
  onManageStock,
  onViewHistory,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#DED7CA] bg-white p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#DED7CA] border-t-[#18352B]" />

        <p className="mt-3 text-sm text-[#77756F]">
          Loading inventory...
        </p>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="rounded-xl border border-[#DED7CA] bg-white p-10 text-center">
        <Package size={36} className="mx-auto text-[#A98250]" />

        <h3 className="mt-3 font-semibold text-[#18352B]">
          No inventory found
        </h3>

        <p className="mt-1 text-sm text-[#77756F]">
          Inventory records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DED7CA] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-[#DED7CA] bg-[#F7F4EE]">
            <tr className="text-xs uppercase tracking-wider text-[#77756F]">
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">SKU</th>
              <th className="px-6 py-4 font-semibold">Quantity</th>
              <th className="px-6 py-4 font-semibold">Threshold</th>
              <th className="px-6 py-4 font-semibold">Stock Status</th>
              <th className="px-6 py-4 font-semibold">Inventory ID</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#DED7CA]">
            {inventory.map((item) => {
              const status = getStockStatus(item);
              const StatusIcon = status.icon;

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[#FAF9F6]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7F4EE] text-[#A98250]">
                        <Package size={20} />
                      </div>

                      <span className="font-medium text-[#18352B]">
                        {item.product_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-[#77756F]">
                    {item.product_sku}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#18352B]">
                      {item.quantity}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-[#77756F]">
                    {item.low_stock_threshold}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-[#77756F]">
                    #{item.id}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onManageStock?.(item)}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#18352B] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#24483A]"
                      >
                        <SlidersHorizontal size={14} />
                        Manage Stock
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewHistory?.(item)}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#DED7CA] px-3 py-2 text-xs font-medium text-[#18352B] transition hover:bg-[#F7F4EE]"
                      >
                        <History size={14} />
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}