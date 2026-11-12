import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getProductBySlug } from "../../services/catalogueService";
import ProductReviews from "../../components/reviews/ProductReviews";
import {
  ShoppingBag,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";

export default function ProductDetailPage() {
  const { slug } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError("");

      try {
        const data = await getProductBySlug(slug);

        setProduct(data);

        const videos = data.videos || [];

        const galleryItems = [
          ...(data.images || []).map((image) => ({
            ...image,
            type: "image",
          })),

          ...videos.map((video) => ({
            ...video,
            type: "video",
          })),
        ];

        const primaryIndex = galleryItems.findIndex(
          (item) => item.type === "image" && item.is_primary
        );

        setSelectedMediaIndex(primaryIndex >= 0 ? primaryIndex : 0);

        const defaultMode = data.selling_modes?.includes("RETAIL")
          ? "RETAIL"
          : data.selling_modes?.[0] || "";

        setSelectedMode(defaultMode);

        setQuantity(
          defaultMode === "RETAIL"
            ? data.retail_moq || 1
            : data.wholesale_moq || 1
        );

      } catch (err) {
        setError(err.message || "Unable to load product details.");
      } finally {
        setLoading(false);
      }

    }

      fetchProduct();
    }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] text-[#18352B]">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] text-red-600">
        {error || "Product not found."}
      </div>
    );
  }

  const isRetail = selectedMode === "RETAIL";

  const price = isRetail
    ? product.retail_price
    : product.wholesale_price;

  const moq = isRetail
    ? product.retail_moq || 1
    : product.wholesale_moq || 1;

  const isAvailable = isRetail
    ? product.retail_available
    : product.wholesale_available;

  const images = product.images || [];

  const videos = product.videos || [];

  const galleryItems = [
    ...images.map((image) => ({
      ...image,
      type: "image",
    })),
    ...videos.map((video) => ({
      ...video,
      type: "video",
    })),
  ];

  const selectedMedia = galleryItems[selectedMediaIndex];

  const showPreviousMedia = () => {
    setSelectedMediaIndex((previous) =>
      previous === 0 ? galleryItems.length - 1 : previous - 1
    );
  };

  const showNextMedia = () => {
    setSelectedMediaIndex((previous) =>
      previous === galleryItems.length - 1 ? 0 : previous + 1
    );
  };

  const specifications = [
    {
        label: "Weight",
        value: product.weight
        ? `${product.weight} ${product.weight_unit}`
        : null,
    },
    {
        label: "Length",
        value: product.length
        ? `${product.length} ${product.length_unit}`
        : null,
    },
    {
        label: "Width",
        value: product.width
        ? `${product.width} ${product.width_unit}`
        : null,
    },
    {
        label: "Height",
        value: product.height
        ? `${product.height} ${product.height_unit}`
        : null,
    },
  ].filter((item) => item.value !== null);



  function handleModeChange(mode) {
    setSelectedMode(mode);

    setQuantity(
      mode === "RETAIL"
        ? product.retail_moq || 1
        : product.wholesale_moq || 1
    );
  }

    // Handle Add to Cart and Buy Now
    const handlePurchase = async (action) => {
      setCartMessage("");
      setCartError("");

      // Authentication check
      if (!isAuthenticated) {
        navigate("/login", {
          state: { from: location },
        });
        return;
      }

      // Product availability check
      if (!isAvailable) {
        setCartError("This product is currently unavailable.");
        return;
      }

      // Quantity and MOQ validation
      if (quantity < moq) {
        setCartError(`Minimum order quantity is ${moq}.`);
        return;
      }

      // Stock validation
      if (quantity > product.stock_quantity) {
        setCartError(
          `Only ${product.stock_quantity} units are available.`
        );
        return;
      }

      try {
        setCartLoading(true);

        await addItem({
          product_id: product.id,
          purchase_mode: selectedMode,
          quantity: quantity,
        });

        if (action === "BUY_NOW") {
          navigate("/cart");
        } else {
          setCartMessage("Product successfully added to your cart!");
        }
      } catch (err) {
        setCartError(
          err.message || "Unable to add product to cart."
        );
      } finally {
        setCartLoading(false);
      }
    };

  return (
    <section className="min-h-screen bg-[#F7F4EE] px-6 py-16">

      <div className="mx-auto max-w-[1300px]">

        {/* Breadcrumb */}
        <p className="mb-10 text-xs uppercase tracking-[0.2em] text-[#A98250]">
          Home / Collections / {product.category_name} / {product.name}
        </p>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">

          {/* PRODUCT MEDIA GALLERY */}

          <div>

            {/* MAIN MEDIA */}

            <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE4D9]">

              {selectedMedia ? (
                selectedMedia.type === "video" ? (

                  <video
                    key={selectedMedia.id}
                    src={selectedMedia.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain bg-black"
                  />

                ) : (

                  <img
                    key={selectedMedia.id}
                    src={selectedMedia.image_url}
                    alt={selectedMedia.alt_text || product.name}
                    className="h-full w-full object-cover"
                  />

                )
              ) : (

                <div className="flex h-full items-center justify-center text-[#A98250]">
                  Media Coming Soon
                </div>

              )}

              {/* PREVIOUS BUTTON */}

              {galleryItems.length > 1 && (

                <button
                  type="button"
                  onClick={showPreviousMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#18352B] shadow-md transition hover:bg-[#18352B] hover:text-white"
                  aria-label="Previous media"
                >
                  <ChevronLeft size={23} />
                </button>

              )}

              {/* NEXT BUTTON */}

              {galleryItems.length > 1 && (

                <button
                  type="button"
                  onClick={showNextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#18352B] shadow-md transition hover:bg-[#18352B] hover:text-white"
                  aria-label="Next media"
                >
                  <ChevronRight size={23} />
                </button>

              )}

            </div>


            {/* MEDIA THUMBNAILS */}

            {galleryItems.length > 1 && (

              <div className="mt-5 flex gap-4 overflow-x-auto pb-2">

                {galleryItems.map((item, index) => (

                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative h-24 w-20 shrink-0 overflow-hidden border-2 transition ${
                      selectedMediaIndex === index
                        ? "border-[#A98250]"
                        : "border-transparent"
                    }`}
                  >

                    {item.type === "image" ? (

                      <img
                        src={item.image_url}
                        alt={item.alt_text || product.name}
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="relative flex h-full w-full items-center justify-center bg-[#18352B]">

                        <video
                          src={item.video_url}
                          muted
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-cover opacity-60"
                        />

                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#18352B]">
                          <Play size={15} fill="currentColor" />
                        </span>

                      </div>

                    )}

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* Product Information */}
          <div className="py-4">

            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#A98250]">
              {product.category_name}
            </p>

            <h1 className="font-serif text-4xl leading-tight text-[#18352B] md:text-5xl">
              {product.name}
            </h1>

            <div className="my-8 h-px bg-[#DED7CA]" />

            {/* Price */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A98250]">
                Price
              </p>

              <h2 className="mt-2 text-3xl font-medium text-[#18352B]">
                ₹{Number(price || 0).toLocaleString("en-IN")}
              </h2>
            </div>



            {/* Short Description */}
            {product.short_description && (
              <p className="mt-6 leading-7 text-[#77756F]">
                {product.short_description}
              </p>
            )}

            {/* Selling Modes */}
            <div className="mt-8">

              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#18352B]">
                Purchase Type
              </p>

              <div className="flex flex-wrap gap-3">

                {product.selling_modes?.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`border px-6 py-3 text-xs uppercase tracking-wider transition ${
                      selectedMode === mode
                        ? "border-[#18352B] bg-[#18352B] text-white"
                        : "border-[#DED7CA] text-[#18352B] hover:border-[#A98250]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}

              </div>

            </div>

            {/* MOQ */}
            <div className="mt-8 flex items-center gap-3 text-sm text-[#77756F]">
              <Package size={18} className="text-[#A98250]" />

              Minimum Order Quantity: {moq}
            </div>

            {/* Quantity Selector */}
            <div className="mt-8">

              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#18352B]">
                Quantity
              </p>

              <div className="flex w-fit items-center border border-[#DED7CA]">

                <button
                  onClick={() =>
                    setQuantity((previous) =>
                      Math.max(moq, previous - 1)
                    )
                  }
                  className="px-5 py-3 text-[#18352B]"
                >
                  −
                </button>

                <span className="min-w-12 text-center text-sm">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((previous) => previous + 1)
                  }
                  className="px-5 py-3 text-[#18352B]"
                >
                  +
                </button>

              </div>

            </div>

            {/* Stock Status */}
            <div className="mt-8">

              {isAvailable ? (
                <p className="flex items-center gap-2 text-sm text-green-700">
                  <ShoppingBag size={17} />
                  Available for {isRetail ? "Retail" : "Wholesale"} orders
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={17} />
                  Currently unavailable for this purchase type
                </p>
              )}

              <p className="mt-2 text-xs text-[#77756F]">
                Stock Quantity: {product.stock_quantity}
              </p>

              {product.is_low_stock && product.stock_quantity > 0 && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-700">
                    <AlertCircle size={16} />
                    Low Stock — Only {product.stock_quantity} units left!
                </p>
              )}

            </div>

            <div className="my-8 h-px bg-[#DED7CA]" />

            {/* Cart Feedback */}
            {cartMessage && (
              <div className="mt-5 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {cartMessage}
              </div>
            )}

            {cartError && (
              <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {cartError}
              </div>
            )}

            {/* Purchase Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

              <button
                onClick={() => handlePurchase("ADD_TO_CART")}
                disabled={cartLoading || !isAvailable}
                className="flex items-center justify-center gap-3 border border-[#18352B] px-6 py-4 text-xs uppercase tracking-[0.15em] text-[#18352B] transition hover:bg-[#18352B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={17} />

                {cartLoading ? "Processing..." : "Add to Cart"}
              </button>

              <button
                onClick={() => handlePurchase("BUY_NOW")}
                disabled={cartLoading || !isAvailable}
                className="bg-[#18352B] px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cartLoading ? "Processing..." : "Buy Now"}
              </button>

            </div>
            

            {/* Product Specifications */}
            {specifications.length > 0 && (
                <>
                    <div className="my-8 h-px bg-[#DED7CA]" />

                    <div>
                    <h3 className="mb-5 font-serif text-2xl text-[#18352B]">
                        Product Specifications
                    </h3>

                    <div className="border-t border-[#DED7CA]">
                        {specifications.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between border-b border-[#DED7CA] py-4"
                        >
                            <span className="text-sm text-[#77756F]">
                            {item.label}
                            </span>

                            <span className="text-sm font-medium text-[#18352B]">
                            {item.value}
                            </span>
                        </div>
                        ))}
                    </div>
                    </div>
                </>
            )}


            {/* Full Description */}
            <div>

              <h3 className="mb-4 font-serif text-2xl text-[#18352B]">
                Product Description
              </h3>

              <p className="whitespace-pre-line leading-8 text-[#77756F]">
                {product.description || product.short_description}
              </p>

            </div>

          </div>

        </div>

        <ProductReviews product={product} />

      </div>

    </section>
  );
}