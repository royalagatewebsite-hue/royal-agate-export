import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

import {
  getProducts,
  getCategories,
  deleteProduct,
} from "../../services/catalogueService";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [deletingSlug, setDeletingSlug] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, categoriesResponse] =
        await Promise.all([
          getProducts({ page_size: 100 }),
          getCategories(),
        ]);

      const productData =
        productsResponse.results || productsResponse;

      const categoryData =
        categoriesResponse.results || categoriesResponse;

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(
        err.message || "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        product.name?.toLowerCase().includes(searchValue) ||
        product.sku?.toLowerCase().includes(searchValue);

      const matchesCategory =
        !categoryFilter ||
        String(product.category) === String(categoryFilter);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && product.is_active) ||
        (statusFilter === "INACTIVE" && !product.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingSlug(product.slug);

      await deleteProduct(product.slug);

      setProducts((previous) =>
        previous.filter((item) => item.slug !== product.slug)
      );
    } catch (err) {
      console.error("Product deletion error:", err);

      window.alert(
        err.message || "Unable to delete product."
      );
    } finally {
      setDeletingSlug(null);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "—";

    return `₹${Number(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPriceDisplay = (product) => {
    const modes = product.selling_modes || [];

    const prices = [];

    if (modes.includes("RETAIL")) {
      prices.push(`Retail: ${formatPrice(product.retail_price)}`);
    }

    if (modes.includes("WHOLESALE")) {
      prices.push(
        `Wholesale: ${formatPrice(product.wholesale_price)}`
      );
    }

    return prices;
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-8">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A98250] mb-2">
            Catalogue Management
          </p>

          <h1 className="text-3xl font-serif text-[#18352B]">
            Products
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Manage your product catalogue and collections.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 border border-[#DED7CA] text-[#18352B] hover:bg-[#F7F4EE] transition"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => navigate("/admin/products/add")}
            className="flex items-center gap-2 px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D] transition"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">Total Products</p>
            <Package className="text-[#A98250]" size={22} />
          </div>

          <h2 className="text-3xl font-serif text-[#18352B] mt-3">
            {products.length}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <p className="text-sm text-[#77756F]">Active Products</p>

          <h2 className="text-3xl font-serif text-green-700 mt-3">
            {products.filter((p) => p.is_active).length}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <p className="text-sm text-[#77756F]">Inactive Products</p>

          <h2 className="text-3xl font-serif text-red-600 mt-3">
            {products.filter((p) => !p.is_active).length}
          </h2>
        </div>

      </div>

      {/* FILTER SECTION */}
      <div className="bg-white border border-[#DED7CA] p-5">

        <div className="flex items-center gap-2 mb-5">
          <Filter size={18} className="text-[#A98250]" />

          <h2 className="text-[#18352B] font-medium">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* SEARCH */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
            />

            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#DED7CA] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

          {/* CATEGORY FILTER */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#DED7CA] px-4 py-3 text-sm text-[#18352B] outline-none focus:border-[#A98250]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

        </div>

        <div className="flex justify-between items-center mt-4">

          <p className="text-xs text-[#77756F]">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#A98250] hover:text-[#18352B]"
          >
            <X size={14} />
            Clear Filters
          </button>

        </div>

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 p-4 text-red-700">

          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>

          <button
            onClick={fetchData}
            className="text-sm underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div className="bg-white border border-[#DED7CA]">

        <div className="px-5 py-5 border-b border-[#DED7CA]">
          <h2 className="font-serif text-xl text-[#18352B]">
            Product Catalogue
          </h2>
        </div>

        {loading ? (

          <div className="flex justify-center items-center py-20">
            <RefreshCw
              size={25}
              className="animate-spin text-[#A98250]"
            />
            <span className="ml-3 text-sm text-[#77756F]">
              Loading products...
            </span>
          </div>

        ) : !error && filteredProducts.length === 0 ? (

          <div className="text-center py-20">

            <Package
              size={42}
              className="mx-auto text-[#A98250] mb-4"
            />

            <h3 className="text-lg font-serif text-[#18352B]">
              No Products Found
            </h3>

            <p className="text-sm text-[#77756F] mt-2">
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">

                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Pricing</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-[#DED7CA]">

                {filteredProducts.map((product) => {

                  const prices = getPriceDisplay(product);

                  return (

                    <tr
                      key={product.id}
                      className="hover:bg-[#F7F4EE]/60 transition"
                    >

                      {/* PRODUCT */}
                      <td className="px-5 py-4 min-w-[240px]">

                        <div className="flex items-center gap-3">

                          <div className="w-14 h-14 bg-[#F7F4EE] border border-[#DED7CA] flex items-center justify-center overflow-hidden shrink-0">

                            {product.primary_image_url ? (

                              <img
                                src={product.primary_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />

                            ) : (

                              <ImageIcon
                                size={22}
                                className="text-[#A98250]"
                              />

                            )}

                          </div>

                          <div>
                            <p className="text-sm font-medium text-[#18352B]">
                              {product.name}
                            </p>

                            {product.is_featured && (
                              <span className="text-[10px] text-[#A98250] uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>

                        </div>

                      </td>

                      {/* SKU */}
                      <td className="px-5 py-4 text-sm text-[#77756F]">
                        {product.sku}
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-4 text-sm text-[#18352B]">
                        {product.category_name || "—"}
                      </td>

                      {/* PRICING */}
                      <td className="px-5 py-4 min-w-[180px]">

                        {prices.length > 0 ? (

                          <div className="space-y-1">
                            {prices.map((price, index) => (
                              <p
                                key={index}
                                className="text-xs text-[#18352B]"
                              >
                                {price}
                              </p>
                            ))}
                          </div>

                        ) : (
                          <span className="text-sm text-[#77756F]">
                            —
                          </span>
                        )}

                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium ${
                            product.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>

                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                                onClick={() => navigate(`/admin/products/${product.slug}/edit`)}
                                title="Edit Product"
                                className="p-2 text-[#A98250] hover:bg-[#F7F4EE] transition"
                          >
                                <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingSlug === product.slug}
                            title="Delete Product"
                            className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingSlug === product.slug ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>

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

    </div>
  );
};

export default AdminProductsPage;