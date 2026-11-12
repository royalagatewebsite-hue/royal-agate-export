import { SlidersHorizontal, RotateCcw } from "lucide-react";

export default function FilterSidebar({
  categories,
  filters,
  onFilterChange,
  onReset,
}) {
  return (
    <aside className="w-full lg:w-64 shrink-0">

      <div className="flex items-center justify-between border-b border-[#DED7CA] pb-5 mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-[#18352B]" />

          <h2 className="font-serif text-xl text-[#18352B]">
            Filters
          </h2>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[#A98250] hover:text-[#18352B]"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-[0.2em] text-[#18352B] mb-5">
          Categories
        </h3>

        <div className="space-y-4">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 text-sm text-[#77756F] cursor-pointer hover:text-[#18352B]"
            >
              <input
                type="radio"
                name="category"
                checked={String(filters.category) === String(category.id)}
                onChange={() =>
                  onFilterChange("category", category.id)
                }
                className="accent-[#18352B]"
              />

              {category.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-[#DED7CA] pt-6">
        <h3 className="text-xs uppercase tracking-[0.2em] text-[#18352B] mb-5">
          Price Range
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#77756F]">
              Minimum (₹)
            </label>

            <input
              type="number"
              min="0"
              value={filters.min_price}
              onChange={(e) =>
                onFilterChange("min_price", e.target.value)
              }
              placeholder="Min"
              className="mt-2 w-full border border-[#DED7CA] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

          <div>
            <label className="text-xs text-[#77756F]">
              Maximum (₹)
            </label>

            <input
              type="number"
              min="0"
              value={filters.max_price}
              onChange={(e) =>
                onFilterChange("max_price", e.target.value)
              }
              placeholder="Max"
              className="mt-2 w-full border border-[#DED7CA] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#A98250]"
            />
          </div>
        </div>
      </div>

    </aside>
  );
}