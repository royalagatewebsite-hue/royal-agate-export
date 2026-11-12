import { useEffect, useState } from "react";
import {
  RefreshCw,
  Package,
  Plus,
  X,
  Search,
} from "lucide-react";

import InventoryFilters from "../../components/admin/inventory/InventoryFilters";
import ManageStockModal from "../../components/admin/inventory/ManageStockModal";
import StockHistoryModal from "../../components/admin/inventory/StockHistoryModal";

import inventoryService from "../../services/inventoryService";
import { getProducts } from "../../services/catalogueService";

import InventoryTable from "../../components/admin/inventory/InventoryTable";

const initialForm = {
  product_id: "",
  quantity: "0",
  low_stock_threshold: "5",
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);

  // Add Inventory states
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await inventoryService.getInventory({
        search,
        stock_status: stockStatus,
        page_size: 100,
      });

      setInventory(response.results || []);
      setTotalCount(response.count || 0);
    } catch (err) {
      setError(
        err.message || "Unable to load inventory. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, stockStatus]);

  // Load products when modal opens
  const openAddModal = async () => {
    setShowAddModal(true);
    setForm(initialForm);
    setFormError("");
    setProductSearch("");

    try {
      setLoadingProducts(true);

      const response = await getProducts({
        page_size: 100,
        is_active: true,
      });

      const productList = Array.isArray(response)
        ? response
        : response.results || [];

      // Only products without an inventory record
      const existingProductIds = new Set(
        inventory.map((item) => Number(item.product))
      );

      setProducts(
        productList.filter(
          (product) => !existingProductIds.has(Number(product.id))
        )
      );
    } catch (err) {
      setFormError(err.message || "Unable to load products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.product_id) {
      setFormError("Please select a product.");
      return;
    }

    const quantity = Number(form.quantity);
    const threshold = Number(form.low_stock_threshold);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      setFormError("Enter valid non-negative whole numbers.");
      return;
    }

    try {
      setSavingInventory(true);

      await inventoryService.createInventory({
        product_id: Number(form.product_id),
        quantity,
        low_stock_threshold: threshold,
      });

      setShowAddModal(false);
      setForm(initialForm);
      await fetchInventory();
    } catch (err) {
      setFormError(
        err.message || "Unable to create inventory."
      );
    } finally {
      setSavingInventory(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = productSearch.toLowerCase();

    return (
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#18352B]">
            Inventory Management
          </h1>

          <p className="mt-2 text-sm text-[#77756F]">
            Monitor stock levels and manage product inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#18352B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#A98250]"
          >
            <Plus size={17} />
            Add Inventory
          </button>

          <button
            onClick={fetchInventory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DED7CA] bg-white px-4 py-2.5 text-sm font-medium text-[#18352B] transition hover:bg-[#F7F4EE] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#DED7CA] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#77756F]">
                Total Inventory Records
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-[#18352B]">
                {loading ? "..." : totalCount}
              </h2>
            </div>

            <div className="rounded-xl bg-[#F7F4EE] p-3 text-[#A98250]">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <InventoryFilters
        search={search}
        setSearch={setSearch}
        stockStatus={stockStatus}
        setStockStatus={setStockStatus}
      />

      {/* Inventory Table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#18352B]">
            Inventory Records
          </h2>

          <p className="mt-1 text-sm text-[#77756F]">
            Current stock information for your products.
          </p>
        </div>

        <InventoryTable
          inventory={inventory}
          loading={loading}
          onManageStock={(item) => setSelectedInventory(item)}
          onViewHistory={(item) => setSelectedHistory(item)}
        />
      </section>

      {/* Add Inventory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-[#DED7CA] p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
                  Stock Management
                </p>

                <h2 className="mt-2 font-serif text-2xl text-[#18352B]">
                  Add Inventory
                </h2>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                disabled={savingInventory}
                className="rounded-lg p-2 text-[#77756F] hover:bg-[#F7F4EE]"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleCreateInventory} className="space-y-5 p-6">

              {/* Product Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#18352B]">
                  Select Product *
                </label>

                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
                  />

                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product by name or SKU..."
                    className="w-full rounded-lg border border-[#DED7CA] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#A98250]"
                  />
                </div>

                <select
                  value={form.product_id}
                  onChange={(e) =>
                    setForm({ ...form, product_id: e.target.value })
                  }
                  required
                  disabled={loadingProducts}
                  className="w-full rounded-lg border border-[#DED7CA] bg-white px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                >
                  <option value="">
                    {loadingProducts
                      ? "Loading products..."
                      : "Choose a product"}
                  </option>

                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.sku ? `(${product.sku})` : ""}
                    </option>
                  ))}
                </select>

                {!loadingProducts && products.length === 0 && (
                  <p className="mt-2 text-xs text-[#77756F]">
                    All available products already have inventory records.
                  </p>
                )}
              </div>

              {/* Initial Quantity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#18352B]">
                  Initial Stock Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                  placeholder="Enter initial quantity"
                />
              </div>

              {/* Threshold */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#18352B]">
                  Low Stock Threshold *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      low_stock_threshold: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                  placeholder="Enter low stock threshold"
                />

                <p className="mt-2 text-xs text-[#77756F]">
                  A low-stock warning appears when quantity reaches this value.
                </p>
              </div>

              {/* Error */}
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-[#DED7CA] pt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={savingInventory}
                  className="rounded-lg border border-[#DED7CA] px-5 py-3 text-sm text-[#18352B]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingInventory || loadingProducts || products.length === 0}
                  className="rounded-lg bg-[#18352B] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingInventory ? "Creating..." : "Create Inventory"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Manage Stock Modal */}
      {selectedInventory && (
        <ManageStockModal
          item={selectedInventory}
          onClose={() => setSelectedInventory(null)}
          onSuccess={fetchInventory}
        />
      )}

      {/* Stock History Modal */}
      {selectedHistory && (
        <StockHistoryModal
          item={selectedHistory}
          onClose={() => setSelectedHistory(null)}
        />
      )}

    </div>
  );
}