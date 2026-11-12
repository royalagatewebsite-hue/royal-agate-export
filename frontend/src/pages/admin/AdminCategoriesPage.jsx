import { useEffect, useMemo, useState } from "react";
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Filter,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/catalogueService";

const initialForm = {
  name: "",
  description: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories();
      const data = response.results || response;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Categories fetch error:", err);
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const value = search.toLowerCase().trim();

      const matchesSearch =
        !value ||
        category.name?.toLowerCase().includes(value) ||
        category.slug?.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && category.is_active) ||
        (statusFilter === "INACTIVE" && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      sort_order: category.sort_order ?? 0,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm(initialForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "sort_order"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      window.alert("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }

      setShowModal(false);
      setEditingCategory(null);
      setForm(initialForm);

      await fetchCategories();
    } catch (err) {
      console.error("Category save error:", err);
      window.alert(err.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);

      await deleteCategory(category.id);

      setCategories((previous) =>
        previous.filter((item) => item.id !== category.id)
      );
    } catch (err) {
      console.error("Category deletion error:", err);

      window.alert(
        err.message || "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
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
            Categories
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Organize and manage your product collections.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={fetchCategories}
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
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-[#18352B] text-white hover:bg-[#244A3D] transition"
          >
            <Plus size={18} />
            Add Category
          </button>

        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-white border border-[#DED7CA] p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#77756F]">
              Total Categories
            </p>
            <Tags className="text-[#A98250]" size={22} />
          </div>

          <h2 className="text-3xl font-serif text-[#18352B] mt-3">
            {categories.length}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <p className="text-sm text-[#77756F]">
            Active Categories
          </p>

          <h2 className="text-3xl font-serif text-green-700 mt-3">
            {categories.filter((item) => item.is_active).length}
          </h2>
        </div>

        <div className="bg-white border border-[#DED7CA] p-5">
          <p className="text-sm text-[#77756F]">
            Inactive Categories
          </p>

          <h2 className="text-3xl font-serif text-red-600 mt-3">
            {categories.filter((item) => !item.is_active).length}
          </h2>
        </div>

      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-[#DED7CA] p-5">

        <div className="flex items-center gap-2 mb-5">
          <Filter size={18} className="text-[#A98250]" />

          <h2 className="text-[#18352B] font-medium">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77756F]"
            />

            <input
              type="text"
              placeholder="Search by category name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#DED7CA] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#A98250]"
            />
          </div>

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
            Showing {filteredCategories.length} of {categories.length} categories
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

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 p-4 text-red-700">

          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>

          <button
            onClick={fetchCategories}
            className="text-sm underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* CATEGORY TABLE */}
      <div className="bg-white border border-[#DED7CA]">

        <div className="px-5 py-5 border-b border-[#DED7CA]">
          <h2 className="font-serif text-xl text-[#18352B]">
            Category Catalogue
          </h2>
        </div>

        {loading ? (

          <div className="flex justify-center items-center py-20">
            <RefreshCw
              size={25}
              className="animate-spin text-[#A98250]"
            />

            <span className="ml-3 text-sm text-[#77756F]">
              Loading categories...
            </span>
          </div>

        ) : !error && filteredCategories.length === 0 ? (

          <div className="text-center py-20">

            <FolderOpen
              size={42}
              className="mx-auto text-[#A98250] mb-4"
            />

            <h3 className="text-lg font-serif text-[#18352B]">
              No Categories Found
            </h3>

            <p className="text-sm text-[#77756F] mt-2">
              Add a category or change your search filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wider text-[#77756F]">

                <tr>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Sort Order</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-[#DED7CA]">

                {filteredCategories.map((category) => (

                  <tr
                    key={category.id}
                    className="hover:bg-[#F7F4EE]/60 transition"
                  >

                    <td className="px-5 py-4 min-w-[180px]">
                      <p className="text-sm font-medium text-[#18352B]">
                        {category.name}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77756F]">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77756F] max-w-[260px]">
                      <p className="truncate">
                        {category.description || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#18352B]">
                      {category.sort_order}
                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium ${
                          category.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openEditModal(category)}
                          title="Edit Category"
                          className="p-2 text-[#A98250] hover:bg-[#F7F4EE] transition"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.id}
                          title="Delete Category"
                          className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === category.id ? (
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

                ))}

              </tbody>
            </table>

          </div>

        )}

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#DED7CA]">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
                  Catalogue Management
                </p>

                <h2 className="text-2xl font-serif text-[#18352B] mt-1">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="p-2 text-[#77756F] hover:bg-[#F7F4EE]"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div>
                <label className="block text-sm text-[#18352B] mb-2">
                  Category Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Agate Products"
                  required
                  className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#18352B] mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter category description..."
                  className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#18352B] mb-2">
                  Category Image URL
                </label>

                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#18352B] mb-2">
                  Sort Order
                </label>

                <input
                  type="number"
                  name="sort_order"
                  min="0"
                  value={form.sort_order}
                  onChange={handleChange}
                  className="w-full border border-[#DED7CA] px-4 py-3 text-sm outline-none focus:border-[#A98250]"
                />

                <p className="text-xs text-[#77756F] mt-1">
                  Lower numbers appear first.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#18352B]"
                />

                <span className="text-sm text-[#18352B]">
                  Category is active
                </span>

              </label>

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-3 pt-5 border-t border-[#DED7CA]">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-3 border border-[#DED7CA] text-[#18352B] hover:bg-[#F7F4EE]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#18352B] text-white hover:bg-[#244A3D] disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
