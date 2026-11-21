import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCurrency } from "../../context/CurrencyContext";

export default function ProductCard({ product }) {
  const image = product.primary_image_url;

  const { formatPrice } = useCurrency();

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
            className="h-full w-full object-cover transition-transform duration-300 sm:duration-500 sm:group-hover:scale-105"
            decoding="async"
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

        
      </Link>

      {/* Product Information */}
      <div className="pt-3 sm:pt-5">

        <p className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-[#A98250] sm:mb-2 sm:text-[10px] sm:tracking-[0.22em]">
          {product.category_name}
        </p>

        <Link to={`/collections/${product.slug}`}>
          <h3 className="font-sans text-[15px] font-medium leading-snug text-[#18352B] transition-colors duration-200 sm:text-base sm:group-hover:text-[#A98250]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">

          {hasRetail ? (
            <p className="text-sm font-semibold text-[#343832]">
              {formatPrice(product.retail_price)}
            </p>
          ) : (
            <p className="text-xs font-medium text-[#A98250]">
              Wholesale Pricing Available
            </p>
          )}

          <Link
            to={`/collections/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#18352B]/30 text-[#18352B] transition-colors duration-200 hover:bg-[#18352B] hover:text-white"
          >
            <ArrowUpRight size={18} strokeWidth={1.5} />
          </Link>

        </div>

      </div>
    </article>
  );
}