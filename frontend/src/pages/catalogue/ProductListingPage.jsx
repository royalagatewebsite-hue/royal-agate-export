import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { getProducts, getCategories } from "../../services/catalogueService";
import ProductCard from "../../components/product/ProductCard";
import FilterSidebar from "../../components/product/FilterSidebar";

export default function ProductListingPage({ categorySlug = null }) {

  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    min_price: "",
    max_price: "",
    search: urlSearch,
    ordering: "-created_at",
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data.results || data);
      } catch (err) {
        console.error("Category loading failed:", err);
      }
    }

    fetchCategories();
    
  }, []);

  useEffect(() => {
      setCurrentPage(1);

      setFilters((previous) => ({
        ...previous,
        search: urlSearch,
      }));
  }, [urlSearch]);

  useEffect(() => {
    // Wait until categories are loaded for category-specific pages.
    if (categorySlug && !selectedCategory) {
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProducts({
          ...filters,
          category: selectedCategory?.id || filters.category,
          page: currentPage,
          page_size: 12,
        });

        setProducts(data.results || []);
        setTotalProducts(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 12));
      } catch (err) {
        setError(err.message || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [filters, currentPage, selectedCategory?.id, categorySlug]);

  function handleFilterChange(name, value) {
    setCurrentPage(1);

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetFilters() {
    setCurrentPage(1);

    setFilters({
      category: "",
      min_price: "",
      max_price: "",
      search: "",
      ordering: "-created_at",
    });
  }

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-6 py-16">
      <div className="max-w-[1440px] mx-auto">

        {/* Page Heading */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A98250] mb-4">
            Royal Agate Export
          </p>

          <h1 className="font-serif text-4xl md:text-5xl text-[#18352B]">
            {selectedCategory?.name || "Our Collections"}
          </h1>

          <p className="mt-4 text-[#77756F]">
            {categorySlug === "agate"
              ? "Explore our exclusive collection of natural agate gemstones."
              : categorySlug === "jewellery"
              ? "Discover our premium gemstone jewellery collection."
              : "Discover our natural gemstones and handcrafted collections."}
          </p>
        </div>

        {/* Search and Sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-10">

          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A98250]"
            />

            <input
              type="text"
              placeholder="Search gemstones..."
              value={filters.search}
              onChange={(e) =>
                handleFilterChange("search", e.target.value)
              }
              className="w-full border border-[#DED7CA] bg-transparent py-3 pl-11 pr-4 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

          <select
            value={filters.ordering}
            onChange={(e) =>
              handleFilterChange("ordering", e.target.value)
            }
            className="border border-[#DED7CA] bg-transparent px-4 py-3 text-sm text-[#18352B] outline-none"
          >
            <option value="-created_at">Newest First</option>
            <option value="retail_price">Price: Low to High</option>
            <option value="-retail_price">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>

        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar */}
          <FilterSidebar
            categories={categorySlug ? [] : categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
          />

          {/* Products */}
          <div className="flex-1">

            <p className="text-sm text-[#77756F] mb-6">
              {totalProducts} Products
            </p>

            {loading ? (
              <div className="py-20 text-center text-[#18352B]">
                Loading collections...
              </div>
            ) : error ? (
              <div className="py-20 text-center text-red-600">
                {error}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-7 gap-y-12">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-[#77756F]">
                No products found. Try changing your filters.
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">

                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={currentPage === 1}
                  className="border border-[#DED7CA] px-4 py-2 text-sm text-[#18352B] transition hover:bg-[#18352B] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 border text-sm transition ${
                        currentPage === page
                          ? "border-[#18352B] bg-[#18352B] text-white"
                          : "border-[#DED7CA] text-[#18352B] hover:border-[#A98250]"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={currentPage === totalPages}
                  className="border border-[#DED7CA] px-4 py-2 text-sm text-[#18352B] transition hover:bg-[#18352B] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}