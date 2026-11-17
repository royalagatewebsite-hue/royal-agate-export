import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const slides = [
  {
    desktopImage: "/images/Hero/desktop/natural-agate.webp",
    mobileImage: "/images/Hero/mobile/natural-agate.webp",
    alt: "Natural Agate Stones Collection",
  },
  {
    desktopImage: "/images/Hero/desktop/crystal-collection.webp",
    mobileImage: "/images/Hero/mobile/crystal-collection.webp",
    alt: "Crystal Collection",
  },
  {
    desktopImage: "/images/Hero/desktop/agate-jewellery.webp",
    mobileImage: "/images/Hero/mobile/agate-jewellery.webp",
    alt: "Agate Jewellery Collection",
  },
  {
    desktopImage: "/images/Hero/desktop/home-decor.webp",
    mobileImage: "/images/Hero/mobile/home-decor.webp",
    alt: "Crystal Home Décor Collection",
  },
];

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const previousSlide = () => {
    setActiveSlide(
      (current) => (current - 1 + slides.length) % slides.length
    );
  };

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <>
      <section className="relative isolate h-[150vw] min-h-[480px] max-h-[700px] overflow-hidden bg-[#18352B] md:h-[33.333vw] md:min-h-0 md:max-h-[620px]">

        {/* Background Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.desktopImage}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              activeSlide === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={activeSlide !== index}
          >
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet={slide.mobileImage}
              />

              <img
                src={slide.desktopImage}
                alt={slide.alt}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-fill"
              />
            </picture>
          </div>
        ))}

        

        {/* Previous / Next Controls */}
        <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 sm:right-10 md:right-16">

          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous slide"
            className="flex h-10 w-10 items-center justify-center border border-white/50 text-white transition-colors hover:bg-white hover:text-[#18352B]"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="flex h-10 w-10 items-center justify-center border border-white/50 text-white transition-colors hover:bg-white hover:text-[#18352B]"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-6 z-20 flex items-center gap-2 sm:left-10 md:left-16">
          {slides.map((slide, index) => (
            <button
              key={slide.desktopImage}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeSlide === index}
              className={`h-1 transition-all duration-300 ${
                activeSlide === index
                  ? "w-10 bg-[#D6B47D]"
                  : "w-5 bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>

      </section>

      {/* Business Credentials Link */}
      <div className="border-b border-[#DED7CA] bg-[#F7F4EE]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center px-5 py-4">
          <a
            href="#business-credentials"
            className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[#18352B] transition-colors hover:text-[#A98250] sm:text-[10px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#A98250]" />
            GST & Export Credentials
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </>
  );
}