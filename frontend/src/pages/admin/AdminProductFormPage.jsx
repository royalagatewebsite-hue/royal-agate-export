import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import inventoryService from "../../services/inventoryService";
import {
  ArrowLeft,
  Save,
  Package,
  ImagePlus,
  X,
  Loader2,
  Video,
} from "lucide-react";

import {
  getCategories,
  getProductBySlug,
  createProduct,
  updateProduct,
  createProductImage,
  updateProductImage,
  createProductVideo,
  deleteProductVideo,
} from "../../services/catalogueService";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  short_description: "",
  description: "",

  selling_modes: ["RETAIL"],

  retail_price: "",
  retail_moq: "",

  wholesale_price: "",
  wholesale_moq: "",

  weight: "",
  weight_unit: "g",

  length: "",
  length_unit: "cm",

  width: "",
  width_unit: "cm",

  height: "",
  height_unit: "cm",

  is_active: true,
  is_featured: false,
};

const AdminProductFormPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const isEdit = Boolean(slug);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);

  const [images, setImages] = useState([]);

  const [videos, setVideos] = useState([]);
  const [removedVideoIds, setRemovedVideoIds] = useState([]);

  const [inventoryData, setInventoryData] = useState({
        id: null,
        quantity: 0,
        low_stock_threshold: 5,
  });

  const [originalQuantity, setOriginalQuantity] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch categories and product details
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const categoryResponse = await getCategories();

        const categoryData =
          categoryResponse.results || categoryResponse;

        setCategories(
          Array.isArray(categoryData) ? categoryData : []
        );

        if (isEdit) {
          const product = await getProductBySlug(slug);

          const inventoryResponse = await inventoryService.getInventory({
                product: product.id,
          });

          const inventoryList =
                inventoryResponse.results || inventoryResponse;

          const existingInventory = Array.isArray(inventoryList)
                ? inventoryList[0]
                : null;

          if (existingInventory) {
                setInventoryData({
                    id: existingInventory.id,
                    quantity: existingInventory.quantity,
                    low_stock_threshold: existingInventory.low_stock_threshold,
                });
                setOriginalQuantity(Number(existingInventory.quantity));
          }

          setForm({
            ...initialForm,
            ...product,
            category: String(product.category),
            selling_modes: product.selling_modes || [],
          });

          if (product.images?.length) {
            setImages(
              product.images.map((image) => ({
                id: image.id,
                file: null,
                preview: image.image_url,
                alt_text: image.alt_text || "",
                sort_order: image.sort_order,
                is_primary: image.is_primary,
                }))
            );
          }

          if (product.videos?.length) {
            setVideos(
              product.videos.map((video) => ({
                id: video.id,
                file: null,
                preview: video.video_url,
                title: video.title || "",
                sort_order: video.sort_order,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Product form loading error:", err);

        setError(
          err.message || "Unable to load product information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isEdit, slug]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSellingMode = (mode) => {
    setForm((previous) => {
      const exists = previous.selling_modes.includes(mode);

      const sellingModes = exists
        ? previous.selling_modes.filter((item) => item !== mode)
        : [...previous.selling_modes, mode];

      return {
        ...previous,
        selling_modes: sellingModes,
        ...(mode === "RETAIL" && exists
          ? { retail_price: "", retail_moq: "" }
          : {}),
        ...(mode === "WHOLESALE" && exists
          ? { wholesale_price: "", wholesale_moq: "" }
          : {}),
      };
    });
  };

  const handleImageUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const newImages = selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        alt_text: file.name.replace(/\.[^/.]+$/, ""),
        sort_order: images.length + 1,
        is_primary: images.length === 0,
    }));

    setImages((previous) => [...previous, ...newImages]);

    e.target.value = "";
    };

  const handleVideoUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const allowedTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      const newVideos = [];

        for (const file of selectedFiles) {
          if (!allowedTypes.includes(file.type)) {
            setError("Only MP4, WebM and MOV videos are allowed.");
            continue;
          }

          if (file.size > 100 * 1024 * 1024) {
            setError(`${file.name} exceeds the 100 MB limit.`);
            continue;
          }

          newVideos.push({
            file,
            preview: URL.createObjectURL(file),
            title: file.name.replace(/\.[^/.]+$/, ""),
            sort_order: videos.length + newVideos.length,
          });
        }

        setVideos((previous) => [...previous, ...newVideos]);

        e.target.value = "";
      };

  const removeVideo = (index) => {
      setVideos((previous) => {
        const video = previous[index];

        if (video.id) {
          setRemovedVideoIds((ids) => [...ids, video.id]);
        }

        if (video.file && video.preview) {
          URL.revokeObjectURL(video.preview);
        }

        return previous.filter((_, i) => i !== index);
      });
  };

  const handleVideoTitleChange = (index, value) => {
      setVideos((previous) =>
        previous.map((video, i) =>
          i === index ? { ...video, title: value } : video
        )
      );
  };



    const removeImage = (index) => {
        setImages((previous) => {
            const imageToRemove = previous[index];

            if (imageToRemove?.file && imageToRemove.preview) {
            URL.revokeObjectURL(imageToRemove.preview);
            }

            const updated = previous.filter(
            (_, imageIndex) => imageIndex !== index
            );

            if (
            updated.length > 0 &&
            !updated.some((image) => image.is_primary)
            ) {
            updated[0].is_primary = true;
            }

            return updated.map((image, imageIndex) => ({
            ...image,
            sort_order: imageIndex + 1,
            }));
            });
    };

    const handleImageMetadataChange = (index, field, value) => {
        setImages((previous) =>
            previous.map((image, imageIndex) =>
            imageIndex === index
                ? { ...image, [field]: value }
                : image
            )
        );
    };

    const setPrimaryImage = (index) => {
        setImages((previous) =>
            previous.map((image, imageIndex) => ({
            ...image,
            is_primary: imageIndex === index,
            }))
        );
    };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Product name is required.";
    }

    if (!form.sku.trim()) {
      errors.sku = "SKU is required.";
    }

    if (!form.category) {
      errors.category = "Please select a category.";
    }

    if (form.selling_modes.length === 0) {
      errors.selling_modes = "Select at least one selling mode.";
    }

    if (form.selling_modes.includes("RETAIL")) {
      if (!form.retail_price || Number(form.retail_price) <= 0) {
        errors.retail_price = "Enter a valid retail price.";
      }

      if (!form.retail_moq || Number(form.retail_moq) < 1) {
        errors.retail_moq = "Retail MOQ must be at least 1.";
      }
    }

    if (form.selling_modes.includes("WHOLESALE")) {
      if (
        !form.wholesale_price ||
        Number(form.wholesale_price) <= 0
      ) {
        errors.wholesale_price = "Enter a valid wholesale price.";
      }

      if (
        !form.wholesale_moq ||
        Number(form.wholesale_moq) < 1
      ) {
        errors.wholesale_moq = "Wholesale MOQ must be at least 1.";
      }
    }

    images.forEach((image, index) => {
        if (image.file && !image.file.type.startsWith("image/")) {
            errors[`image_${index}`] = "Please select a valid image.";
        }
    });

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!validateForm()) {
      setError("Please correct the highlighted fields.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: Number(form.category),

        retail_price: form.selling_modes.includes("RETAIL")
          ? form.retail_price
          : null,

        retail_moq: form.selling_modes.includes("RETAIL")
          ? Number(form.retail_moq)
          : null,

        wholesale_price: form.selling_modes.includes("WHOLESALE")
          ? form.wholesale_price
          : null,

        wholesale_moq: form.selling_modes.includes("WHOLESALE")
          ? Number(form.wholesale_moq)
          : null,

        weight: form.weight === "" ? null : form.weight,
        length: form.length === "" ? null : form.length,
        width: form.width === "" ? null : form.width,
        height: form.height === "" ? null : form.height,
      };

      const savedProduct = isEdit
        ? await updateProduct(slug, payload)
        : await createProduct(payload);

      // Save product images
      for (const image of images) {

            // Existing image: update its metadata
            if (image.id && !image.file) {
                await updateProductImage(image.id, {
                    alt_text: image.alt_text || "",
                    sort_order: image.sort_order,
                    is_primary: image.is_primary,
                });

                continue;
            }

            // New image: upload to Cloudinary
            if (image.file) {
                const imageData = new FormData();

                imageData.append("product", savedProduct.id);
                imageData.append("image_file", image.file);
                imageData.append("alt_text", image.alt_text || "");
                imageData.append("sort_order", image.sort_order);
                imageData.append("is_primary", image.is_primary);

                await createProductImage(imageData);
            }
      }

      // =====================================
      // SAVE PRODUCT VIDEOS
      // =====================================

      // Delete removed existing videos
      for (const videoId of removedVideoIds) {
        await deleteProductVideo(videoId);
      }

      // Upload newly selected videos
      for (const video of videos) {
        if (!video.file) continue;

        const videoData = new FormData();

        videoData.append("product", savedProduct.id);
        videoData.append("video_file", video.file);
        videoData.append("title", video.title || "");
        videoData.append("sort_order", video.sort_order);

        await createProductVideo(videoData);
      }



      // =====================================
      // SAVE INVENTORY
      // =====================================

      const targetQuantity = Number(inventoryData.quantity);
      const threshold = Number(inventoryData.low_stock_threshold);

      if (
            !Number.isInteger(targetQuantity) ||
            targetQuantity < 0
      ) {
            throw new Error("Enter a valid stock quantity.");
      }

      if (
            !Number.isInteger(threshold) ||
            threshold < 0
      ) {
            throw new Error("Enter a valid low stock threshold.");
      }

        // New product: Create inventory
      if (!inventoryData.id) {

            await inventoryService.createInventory({
                product_id: savedProduct.id,
                quantity: targetQuantity,
                low_stock_threshold: threshold,
            });

      } else {

            // Existing product: Update threshold
            await inventoryService.updateThreshold(
                inventoryData.id,
                {
                    low_stock_threshold: threshold,
                }
            );

            // Calculate stock difference
            const difference = targetQuantity - originalQuantity;

            // Increase stock
            if (difference > 0) {

                await inventoryService.adjustStock({
                    product_id: savedProduct.id,
                    movement_type: "INCREASE",
                    quantity: difference,
                    reason: "Stock updated from product edit",
                });

            }

            // Decrease stock
            else if (difference < 0) {

                await inventoryService.adjustStock({
                    product_id: savedProduct.id,
                    movement_type: "DECREASE",
                    quantity: Math.abs(difference),
                    reason: "Stock updated from product edit",
                });

            }
        }

      window.alert(
        isEdit
          ? "Product updated successfully!"
          : "Product created successfully!"
      );

      navigate("/admin/products");
    } catch (err) {
      console.error("Product save error:", err);

      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      }

      setError(
        err.message || "Unable to save product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full min-w-0 border border-[#DED7CA] px-3 sm:px-4 py-3 text-sm outline-none focus:border-[#A98250] transition";

  const labelClass =
    "block text-sm font-medium text-[#18352B] mb-2";

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2
          size={28}
          className="animate-spin text-[#A98250]"
        />
        <span className="ml-3 text-sm text-[#77756F]">
          Loading product form...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 text-sm text-[#77756F] hover:text-[#A98250] mb-4"
          >
            <ArrowLeft size={17} />
            Back to Products
          </button>

          <p className="text-xs uppercase tracking-[0.25em] text-[#A98250] mb-2">
            Catalogue Management
          </p>

          <h1 className="text-2xl sm:text-3xl font-serif text-[#18352B]">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>

          <p className="text-sm text-[#77756F] mt-2">
            Enter the product information and selling details.
          </p>
        </div>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* BASIC INFORMATION */}
        <section className="bg-white border border-[#DED7CA]">

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA] flex items-center gap-3">
            <Package className="text-[#A98250]" size={21} />
            <h2 className="text-xl font-serif text-[#18352B]">
              Basic Information
            </h2>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className={labelClass}>
                Product Name *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter product name"
              />

              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                SKU *
              </label>

              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className={inputClass}
                placeholder="Example: RA-AGATE-001"
              />

              {fieldErrors.sku && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.sku}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Category *
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {fieldErrors.category && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Short Description
              </label>

              <input
                name="short_description"
                value={form.short_description || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Short product description"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Full Description
              </label>

              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="Describe your product..."
              />
            </div>

          </div>
        </section>

        {/* SELLING CONFIGURATION */}
        <section className="bg-white border border-[#DED7CA]">

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA]">
            <h2 className="text-xl font-serif text-[#18352B]">
              Selling Configuration
            </h2>

            <p className="text-xs text-[#77756F] mt-1">
              Select how this product will be sold.
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-6">

            <div className="flex flex-wrap gap-5">

              {[
                { value: "RETAIL", label: "Retail Selling" },
                { value: "WHOLESALE", label: "Wholesale Selling" },
              ].map((mode) => (

                <label
                  key={mode.value}
                  className="flex items-center gap-3 border border-[#DED7CA] px-5 py-4 cursor-pointer hover:border-[#A98250]"
                >
                  <input
                    type="checkbox"
                    checked={form.selling_modes.includes(mode.value)}
                    onChange={() => handleSellingMode(mode.value)}
                    className="accent-[#18352B]"
                  />

                  <span className="text-sm text-[#18352B]">
                    {mode.label}
                  </span>
                </label>

              ))}

            </div>

            {fieldErrors.selling_modes && (
              <p className="text-xs text-red-600">
                {fieldErrors.selling_modes}
              </p>
            )}

            {form.selling_modes.includes("RETAIL") && (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#F7F4EE] p-5">

                <h3 className="md:col-span-2 text-sm font-medium text-[#18352B]">
                  Retail Pricing
                </h3>

                <div>
                  <label className={labelClass}>
                    Retail Price (₹) *
                  </label>

                  <input
                    type="number"
                    name="retail_price"
                    min="0.01"
                    step="0.01"
                    value={form.retail_price ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter retail price"
                  />

                  {fieldErrors.retail_price && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.retail_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Retail MOQ *
                  </label>

                  <input
                    type="number"
                    name="retail_moq"
                    min="1"
                    step="1"
                    value={form.retail_moq ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Minimum order quantity"
                  />

                  {fieldErrors.retail_moq && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.retail_moq}
                    </p>
                  )}
                </div>

              </div>
            )}

            {form.selling_modes.includes("WHOLESALE") && (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#F7F4EE] p-5">

                <h3 className="md:col-span-2 text-sm font-medium text-[#18352B]">
                  Wholesale Pricing
                </h3>

                <div>
                  <label className={labelClass}>
                    Wholesale Price (₹) *
                  </label>

                  <input
                    type="number"
                    name="wholesale_price"
                    min="0.01"
                    step="0.01"
                    value={form.wholesale_price ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter wholesale price"
                  />

                  {fieldErrors.wholesale_price && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.wholesale_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Wholesale MOQ *
                  </label>

                  <input
                    type="number"
                    name="wholesale_moq"
                    min="1"
                    step="1"
                    value={form.wholesale_moq ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Minimum order quantity"
                  />

                  {fieldErrors.wholesale_moq && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.wholesale_moq}
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>
        </section>

        {/* DIMENSIONS */}
        <section className="bg-white border border-[#DED7CA]">

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA]">
            <h2 className="text-xl font-serif text-[#18352B]">
              Product Dimensions
            </h2>

            <p className="text-xs text-[#77756F] mt-1">
              Physical measurements of the product.
            </p>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <label className={labelClass}>Weight</label>

              <div className="flex gap-2">
                <input
                  type="number"
                  name="weight"
                  min="0"
                  step="0.01"
                  value={form.weight ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Weight"
                />

                <select
                  name="weight_unit"
                  value={form.weight_unit}
                  onChange={handleChange}
                  className="border border-[#DED7CA] px-3 text-sm"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            {[
              { name: "length", label: "Length" },
              { name: "width", label: "Width" },
              { name: "height", label: "Height" },
            ].map((dimension) => (

              <div key={dimension.name}>
                <label className={labelClass}>
                  {dimension.label}
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    name={dimension.name}
                    min="0"
                    step="0.01"
                    value={form[dimension.name] ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={dimension.label}
                  />

                  <select
                    name={`${dimension.name}_unit`}
                    value={form[`${dimension.name}_unit`]}
                    onChange={handleChange}
                    className="border border-[#DED7CA] px-3 text-sm"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>

            ))}

          </div>
        </section>

        {/* PRODUCT IMAGES */}
        {/* PRODUCT IMAGES */}
        <section className="bg-white border border-[#DED7CA]">

            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA] flex items-center justify-between">

                <div>
                <h2 className="text-xl font-serif text-[#18352B]">
                    Product Images
                </h2>

                <p className="text-xs text-[#77756F] mt-1">
                    Upload product images directly from your computer.
                </p>
                </div>

                <ImagePlus size={23} className="text-[#A98250]" />

            </div>

            <div className="p-4 sm:p-6 space-y-5">

                {/* IMAGE UPLOAD BUTTON */}

                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#DED7CA] bg-[#F7F4EE] p-6 sm:p-10 cursor-pointer hover:border-[#A98250] transition">

                <ImagePlus size={35} className="text-[#A98250]" />

                <span className="text-sm font-medium text-[#18352B]">
                    Add Images
                </span>

                <span className="text-xs text-[#77756F]">
                    Select one or multiple images from your computer
                </span>

                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                />

                </label>

                {/* IMAGE PREVIEWS */}

                {images.length > 0 && (

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                    {images.map((image, index) => (

                    <div
                        key={image.id || `${image.preview}-${index}`}
                        className="border border-[#DED7CA] bg-white overflow-hidden"
                    >

                        {/* IMAGE PREVIEW */}

                        <div className="relative h-52 bg-[#F7F4EE]">

                        <img
                            src={image.preview}
                            alt={image.alt_text}
                            className="w-full h-full object-contain"
                        />

                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-3 right-3 bg-white text-red-600 p-2 shadow hover:bg-red-50"
                            title="Remove Image"
                        >
                            <X size={17} />
                        </button>

                        {image.is_primary && (

                            <span className="absolute top-3 left-3 bg-[#18352B] text-white text-xs px-3 py-2">
                            Primary Image
                            </span>

                        )}

                        </div>

                        {/* IMAGE DETAILS */}

                        <div className="p-4 space-y-3">

                        <p className="text-sm font-medium text-[#18352B]">
                            Image {index + 1}
                        </p>

                        <input
                            type="text"
                            value={image.alt_text}
                            onChange={(e) =>
                            handleImageMetadataChange(
                                index,
                                "alt_text",
                                e.target.value
                            )
                            }
                            placeholder="Image description"
                            className="w-full border border-[#DED7CA] px-3 py-2 text-sm outline-none focus:border-[#A98250]"
                        />

                        <label className="flex items-center gap-2 text-sm text-[#18352B] cursor-pointer">

                            <input
                            type="radio"
                            name="primaryImage"
                            checked={image.is_primary}
                            onChange={() => setPrimaryImage(index)}
                            className="accent-[#18352B]"
                            />

                            Set as primary image

                        </label>

                        {!image.file && image.id && (
                            <p className="text-xs text-green-700">
                            Existing Cloudinary image
                            </p>
                        )}

                        {image.file && (
                            <p className="text-xs text-[#77756F] truncate">
                            {image.file.name}
                            </p>
                        )}

                        </div>

                    </div>

                    ))}

                </div>

                )}

                {images.length === 0 && (

                <p className="text-center text-sm text-[#77756F] py-4">
                    No images selected yet.
                </p>

                )}

            </div>

        </section>

        {/* PRODUCT VIDEOS */}
        <section className="bg-white border border-[#DED7CA]">

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA] flex items-center justify-between">

            <div>
              <h2 className="text-xl font-serif text-[#18352B]">
                Product Videos
              </h2>

              <p className="text-xs text-[#77756F] mt-1">
                Upload product demonstration videos.
              </p>
            </div>

            <Video size={23} className="text-[#A98250]" />

          </div>

          <div className="p-4 sm:p-6 space-y-5">

            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#DED7CA] bg-[#F7F4EE] p-6 sm:p-10 cursor-pointer hover:border-[#A98250] transition">

              <Video size={35} className="text-[#A98250]" />

              <span className="text-sm font-medium text-[#18352B]">
                Add Product Videos
              </span>

              <span className="text-xs text-[#77756F]">
                MP4, WebM or MOV · Maximum 100 MB per video
              </span>

              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
              />

            </label>

            {videos.length > 0 && (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {videos.map((video, index) => (

                  <div
                    key={video.id || video.preview}
                    className="border border-[#DED7CA] bg-white overflow-hidden"
                  >

                    <div className="relative bg-black">

                      <video
                        src={video.preview}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-56 object-contain"
                      />

                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-3 right-3 bg-white text-red-600 p-2 shadow hover:bg-red-50"
                        title="Remove Video"
                      >
                        <X size={17} />
                      </button>

                    </div>

                    <div className="p-4 space-y-3">

                      <p className="text-sm font-medium text-[#18352B]">
                        Video {index + 1}
                      </p>

                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) =>
                          handleVideoTitleChange(index, e.target.value)
                        }
                        placeholder="Video title"
                        className="w-full border border-[#DED7CA] px-3 py-2 text-sm outline-none focus:border-[#A98250]"
                      />

                      {video.id && (
                        <p className="text-xs text-green-700">
                          Existing Cloudinary video
                        </p>
                      )}

                      {video.file && (
                        <p className="text-xs text-[#77756F] truncate">
                          {video.file.name}
                        </p>
                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

            {videos.length === 0 && (
              <p className="text-center text-sm text-[#77756F] py-4">
                No videos selected yet.
              </p>
            )}

          </div>

        </section>


        {/* INVENTORY INFORMATION */}
        <section className="bg-white border border-[#DED7CA]">

            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA]">
                <h2 className="text-xl font-serif text-[#18352B]">
                    Inventory Information
                </h2>

                <p className="text-xs text-[#77756F] mt-1">
                    Manage product stock and low stock alerts.
                </p>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                    <label className={labelClass}>
                        {inventoryData.id ? "Current Stock Quantity" : "Initial Stock Quantity"}
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={inventoryData.quantity}
                        onChange={(e) =>
                            setInventoryData((previous) => ({
                                ...previous,
                                quantity: e.target.value,
                            }))
                        }
                        className={inputClass}
                        placeholder="Enter stock quantity"
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        Low Stock Alert Threshold
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={inventoryData.low_stock_threshold}
                        onChange={(e) =>
                            setInventoryData((previous) => ({
                                ...previous,
                                low_stock_threshold: e.target.value,
                            }))
                        }
                        className={inputClass}
                        placeholder="Example: 5"
                    />
                </div>

            </div>
        </section>



        {/* PRODUCT SETTINGS */}
        <section className="bg-white border border-[#DED7CA]">

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#DED7CA]">
            <h2 className="text-xl font-serif text-[#18352B]">
              Product Settings
            </h2>
          </div>

          <div className="p-4 sm:p-6 flex flex-wrap gap-8">

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-4 h-4 accent-[#18352B]"
              />

              <span className="text-sm text-[#18352B]">
                Active Product
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="w-4 h-4 accent-[#18352B]"
              />

              <span className="text-sm text-[#18352B]">
                Featured Product
              </span>
            </label>

          </div>
        </section>

        {/* FORM ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            disabled={saving}
            className="px-6 py-3 border border-[#DED7CA] text-[#18352B] hover:bg-[#F7F4EE]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-7 py-3 bg-[#18352B] text-white hover:bg-[#244A3D] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                {isEdit ? "Update Product" : "Save Product"}
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
};

export default AdminProductFormPage;