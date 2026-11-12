import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ product }) {
  const image = product.primary_image_url;

  const hasRetail = product.selling_modes?.includes("RETAIL");

  return (
    <article className="group">

      {/* Product Image */}
      <Link
        to={`/collections/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[#EAE4D9]"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#A98250]">
            Image Coming Soon
          </div>
        )}

        {product.is_featured && (
          <span className="absolute left-4 top-4 bg-[#18352B] px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-white">
            Featured
          </span>
        )}

        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-[#F7F4EE] text-[#18352B] opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </Link>

      {/* Product Information */}
      <div className="pt-5">

        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#A98250]">
          {product.category_name}
        </p>

        <Link to={`/collections/${product.slug}`}>
          <h3 className="font-serif text-xl text-[#18352B] transition-colors duration-300 group-hover:text-[#A98250]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between gap-3">

          {hasRetail ? (
            <p className="text-sm font-medium text-[#343832]">
              ₹{Number(product.retail_price).toLocaleString("en-IN")}
            </p>
          ) : (
            <p className="text-xs text-[#A98250]">
              Wholesale Pricing Available
            </p>
          )}

          <Link
            to={`/collections/${product.slug}`}
            className="text-[10px] uppercase tracking-[0.15em] text-[#18352B] underline underline-offset-4 transition-colors hover:text-[#A98250]"
          >
            Explore
          </Link>

        </div>

      </div>
    </article>
  );
}