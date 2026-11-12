import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-[#F7F4EE] overflow-hidden">
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 min-h-[620px]">

        {/* Content */}
        <div className="flex flex-col justify-center px-7 py-20 md:px-16 lg:px-20 order-2 lg:order-1">

          <p className="text-[10px] md:text-xs uppercase tracking-[0.32em] text-[#A98250] mb-7">
            Nature's Finest Creations
          </p>

          <h1 className="font-serif text-[48px] sm:text-6xl xl:text-[76px] leading-[1.08] text-[#18352B]">
            Nature's Artistry,
            <span className="block italic text-[#A98250]">
              Crafted to Last.
            </span>
          </h1>

          <div className="w-16 h-px bg-[#A98250] my-8" />

          <p className="max-w-md text-sm md:text-base leading-8 text-[#65645D]">
            Discover exquisite natural agate stones, handcrafted
            jewellery and timeless gemstone creations, shaped
            by nature and perfected by craftsmanship.
          </p>

          <div className="flex flex-wrap gap-4 mt-9">
            <a
              href="/collections"
              className="inline-flex items-center gap-5 bg-[#18352B] text-white px-7 py-4 text-[10px] uppercase tracking-[0.16em] hover:bg-[#A98250] transition-colors"
            >
              Explore Collections
              <ArrowRight size={16} />
            </a>

            <a
              href="/about"
              className="inline-flex items-center border border-[#A98250] text-[#18352B] px-7 py-4 text-[10px] uppercase tracking-[0.16em] hover:bg-[#EAE4D9] transition-colors"
            >
              Our Story
            </a>

            <a
              href="#business-credentials"
              className="inline-flex items-center gap-2 mt-8 text-[10px] uppercase tracking-[0.16em] text-[#18352B] hover:text-[#A98250] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#A98250]" />
              GST & Export Credentials
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="mt-14 flex items-center gap-4">
            <div className="w-10 h-px bg-[#A98250]" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#77746D]">
              Natural · Authentic · Timeless
            </span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative min-h-[360px] lg:min-h-full order-1 lg:order-2">
          <img
            src="/images/hero-agate-jewellery.webp"
            alt="Natural green agate gemstones and handcrafted gold gemstone jewellery"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#14241F]/20 to-transparent" />

          <div className="absolute bottom-7 right-7 md:bottom-12 md:right-12 bg-[#F7F4EE]/90 backdrop-blur-sm px-6 py-5">
            <p className="font-serif text-xl text-[#18352B]">
              Beauty, Born from Nature.
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#A98250] mt-2">
              Royal Agate Export
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}