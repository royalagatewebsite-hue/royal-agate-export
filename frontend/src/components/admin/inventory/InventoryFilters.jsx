import { Search, SlidersHorizontal, X } from "lucide-react";

export default function InventoryFilters({
  search,
  setSearch,
  stockStatus,
  setStockStatus,
}) {
  const clearFilters = () => {
    setSearch("");
    setStockStatus("");
  };

  const hasFilters = search || stockStatus;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#DED7CA] bg-white p-4 sm:flex-row sm:items-center">

      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name or SKU..."
          className="w-full rounded-lg border border-[#DED7CA] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#A98250]"
        />
      </div>

      {/* Stock Status */}
      <div className="relative sm:w-52">
        <SlidersHorizontal
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
        />

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="w-full appearance-none rounded-lg border border-[#DED7CA] bg-white py-2.5 pl-9 pr-4 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
        >
          <option value="">All Stock Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#77756F] hover:bg-[#F7F4EE] hover:text-[#18352B]"
        >
          <X size={16} />
          Clear
        </button>
      )}

    </div>
  );
}