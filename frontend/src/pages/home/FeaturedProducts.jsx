import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { getProducts } from "../../services/catalogueService";
import ProductCard from "../../components/product/ProductCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const productsRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const data = await getProducts({
            ordering: "-created_at",
            page_size: 8,
        });

        setProducts(data.results || []);
      } catch (err) {
        setError("Unable to load featured products.");
        console.error("Featured products loading failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const element = productsRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
        if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
        }
        },
        {
        threshold: 0.15,
        }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [loading]);

  return (
    <section className="bg-[#F7F4EE] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1440px]">

        {/* Section Heading */}
        <div className="mb-9 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#A98250]">
              Royal Agate Export
            </p>

            <h2 className="font-serif text-3xl text-[#18352B] sm:text-4xl md:text-5xl">
              Explore Our Collections
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#77756F]">
              Discover our finest selection of natural gemstones
              and handcrafted creations.
            </p>
          </div>

          <Link
            to="/collections"
            className="hidden items-center gap-3 border-b border-[#A98250] pb-2 text-[10px] uppercase tracking-[0.15em] text-[#18352B] transition-colors hover:text-[#A98250] sm:inline-flex"
          >
            View All Collections
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77756F]">
            Loading collections...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-600">
            {error}
          </div>
        ) : products.length > 0 ? (
          <>
            <div
                ref={productsRef}
                className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7"
            >
              {products.map((product, index) => (
                <div
                    key={product.id}
                    className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
                    isVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-8 scale-[0.97] opacity-0"
                    }`}
                    style={{
                    transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                    }}
                >
                    <ProductCard product={product} />
                </div>
                ))}
            </div>

            {/* Mobile View All */}
            <div className="mt-10 flex justify-center sm:hidden">
              <Link
                to="/collections"
                className="inline-flex items-center gap-3 border-b border-[#A98250] pb-2 text-[10px] uppercase tracking-[0.15em] text-[#18352B]"
              >
                View All Collections
                <ArrowRight size={15} />
              </Link>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-sm text-[#77756F]">
            No featured products available right now.
          </div>
        )}

      </div>
    </section>
  );
}