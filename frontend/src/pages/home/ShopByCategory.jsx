import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { getCategories } from "../../services/catalogueService";

const categoryPresentation = {
    "natural-agate-stones": {
        title: "Crystal & Agate Gemstones",
        description: "Explore our natural crystal and agate collection.",
        image: "/images/categories/crystal-agate-gemstones.jpeg",
    },

    "agate": {
        title: "Crystal & Agate Gemstones",
        description: "Explore our natural crystal and agate collection.",
        image: "/images/categories/crystal-agate-gemstones.jpeg",
    },

    "agate-jewellery": {
        title: "Gemstones Jewellery",
        description: "Discover exquisite gemstone jewellery.",
        image: "/images/categories/gemstones-jewellery.jpeg",
    },

    "jewellery": {
        title: "Gemstones Jewellery",
        description: "Discover exquisite gemstone jewellery.",
        image: "/images/categories/gemstones-jewellery.jpeg",
    },

    "gemstone-decor": {
        description: "Natural elegance for your spaces.",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
    },

    "crystal-collection": {
        description: "Discover nature's natural treasures.",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85",
    },
};

function normalizeCategory(value = "") {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export default function ShopByCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await getCategories();

                const data = Array.isArray(response)
                    ? response
                    : response.results || [];

                setCategories(data);
            } catch (error) {
                console.error("Category loading failed:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="bg-[#F7F4EE] py-20 text-center">
                <p className="text-sm text-[#77756F]">
                    Loading categories...
                </p>
            </section>
        );
    }

    return (
        <section className="bg-[#F7F4EE] py-20 md:py-28">
            <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">

                {/* Section Heading */}
                <div className="mb-12 text-center md:mb-16">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#A98250]">
                        Explore Our World
                    </p>

                    <h2 className="font-serif text-4xl text-[#18352B] md:text-5xl">
                        Shop by Category
                    </h2>

                    <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#77746D] md:text-base">
                        Explore our carefully curated collection of natural
                        gemstones, exquisite jewellery and timeless creations.
                    </p>
                </div>

                {/* Category Cards */}
                {categories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                        {categories.map((category) => {
                            const key = normalizeCategory(category.slug);
                            const nameKey = normalizeCategory(category.name);

                            const presentation =
                                categoryPresentation[key] ||
                                categoryPresentation[nameKey] ||
                                {};

                            return (
                                <Link
                                    key={category.id}
                                    to={`/category/${category.slug}`}
                                    className="group block"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE4D9]">

                                        <img
                                            src={
                                                presentation.image ||
                                                category.image_url ||
                                                "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85"
                                            }
                                            alt={category.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-[#14241F]/70 via-transparent to-transparent" />

                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <div className="flex items-end justify-between gap-3">
                                                <div>
                                                    <h3 className="font-serif text-2xl text-white">
                                                        {presentation.title || category.name}
                                                    </h3>

                                                    <p className="mt-2 text-xs text-white/75">
                                                        {presentation.description ||
                                                            category.description ||
                                                            "Explore our exclusive collection."}
                                                    </p>
                                                </div>

                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 text-white transition-all group-hover:bg-white group-hover:text-[#18352B]">
                                                    <ArrowUpRight size={18} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p className="py-12 text-center text-sm text-[#77756F]">
                        No categories are currently available.
                    </p>
                )}
            </div>
        </section>
    );
}