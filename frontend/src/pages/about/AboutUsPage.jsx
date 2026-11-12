import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  Sparkles,
  Globe2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { apiRequest } from "../../services/api";

const fallbackContent = {
  title: "About Royal Agate Export",
  content: `At Royal Agate Export, we believe that every gemstone carries a unique story shaped by nature over millions of years.

Our passion lies in bringing the natural beauty of gemstones and the elegance of handcrafted creations closer to people around the world.

We offer a thoughtfully curated range of natural agate stones, gemstone creations, handcrafted jewellery and decorative pieces that celebrate nature's beauty and timeless craftsmanship.`,
};

const values = [
  {
    icon: Gem,
    title: "Natural Beauty",
    description:
      "We celebrate the unique patterns, colours and character found in natural gemstones.",
  },
  {
    icon: Sparkles,
    title: "Thoughtful Craftsmanship",
    description:
      "We value attention to detail and designs that bring out the natural beauty of every creation.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Focus",
    description:
      "We believe in careful product selection, quality standards and customer satisfaction.",
  },
  {
    icon: Globe2,
    title: "Global Vision",
    description:
      "We aim to connect gemstone enthusiasts and businesses across international markets.",
  },
];

export default function AboutUsPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAboutPage() {
      try {
        const response = await apiRequest(
          "/content/pages/about-us/"
        );

        if (isMounted) {
          setPage(response);
        }
      } catch (error) {
        console.error("About page loading failed:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAboutPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const content = page?.content || fallbackContent.content;
  const title = page?.title || fallbackContent.title;

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="bg-[#F7F4EE] text-[#18352B]">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#DED7CA]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-12 md:py-32">

          <div>
            <p className="mb-6 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
              The Story Behind Royal Agate
            </p>

            <h1 className="font-serif text-5xl leading-[1.1] md:text-7xl">
              A Legacy of
              <br />
              Natural Beauty.
              <br />
              <span className="italic text-[#A98250]">
                Crafted to Last.
              </span>
            </h1>

            <div className="my-8 h-px w-20 bg-[#A98250]" />

            <p className="max-w-lg text-sm leading-8 text-[#77756F] md:text-base">
              Discover our passion for natural gemstones,
              thoughtful craftsmanship and timeless creations.
              Every piece reflects the remarkable beauty of nature.
            </p>

            <Link
              to="/collections"
              className="mt-9 inline-flex items-center gap-4 bg-[#18352B] px-8 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#A98250]"
            >
              Explore Collections
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden bg-[#DED7CA]">
              <img
                src="/images/about-agate-heritage.webp"
                alt="Natural green agate stones and crystal gemstone collection"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="absolute -bottom-6 -left-5 border border-[#A98250] bg-[#F7F4EE] px-7 py-5 md:-left-10">
              <p className="font-serif text-xl italic">
                Nature's Artistry
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#A98250]">
                Royal Agate Export
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* OUR STORY */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">

        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
            Who We Are
          </p>

          <h2 className="font-serif text-4xl md:text-6xl">
            {title}
          </h2>

          <div className="mx-auto my-8 h-px w-16 bg-[#A98250]" />

          {loading ? (
            <p className="text-sm text-[#77756F]">
              Loading our story...
            </p>
          ) : (
            <div className="space-y-6 text-left text-sm leading-8 text-[#77756F] md:text-base">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* OUR VALUES */}
      <section className="border-y border-[#DED7CA] bg-white px-6 py-24 md:py-28">

        <div className="mx-auto max-w-[1300px]">

          <div className="mb-16 text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
              What Defines Us
            </p>

            <h2 className="font-serif text-4xl md:text-5xl">
              Our Values
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#77756F]">
              The principles that guide our approach to gemstones,
              craftsmanship and customer relationships.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="border border-[#DED7CA] p-8 transition duration-300 hover:-translate-y-2 hover:border-[#A98250]"
                >
                  <span className="mb-7 flex h-12 w-12 items-center justify-center border border-[#A98250] text-[#A98250]">
                    <Icon size={23} strokeWidth={1.4} />
                  </span>

                  <p className="mb-4 font-serif text-2xl">
                    {value.title}
                  </p>

                  <p className="text-sm leading-7 text-[#77756F]">
                    {value.description}
                  </p>

                  <p className="mt-8 text-xs tracking-[0.2em] text-[#A98250]">
                    0{index + 1}
                  </p>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* GLOBAL VISION */}
      <section className="bg-[#18352B] px-6 py-24 text-white md:py-32">

        <div className="mx-auto max-w-4xl text-center">

          <Globe2
            size={38}
            strokeWidth={1.2}
            className="mx-auto mb-8 text-[#A98250]"
          />

          <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#C49A64]">
            Beyond Boundaries
          </p>

          <h2 className="font-serif text-4xl leading-tight md:text-6xl">
            Connecting Nature's
            <br />
            Beauty to the World.
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-sm leading-8 text-white/70 md:text-base">
            We aim to connect the beauty of natural gemstones
            with customers and businesses across international
            markets. Whether you are an individual buyer,
            retailer, wholesaler or business partner, we welcome
            opportunities to build meaningful relationships.
          </p>

        </div>
      </section>

      {/* OUR PROMISE */}
      <section className="px-6 py-24 text-center md:py-32">

        <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
          Our Promise
        </p>

        <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Every creation tells a story.
          <span className="italic text-[#A98250]">
            {" "}Let yours begin here.
          </span>
        </h2>

        <Link
          to="/contact"
          className="mt-10 inline-flex items-center gap-4 border border-[#18352B] px-9 py-4 text-xs uppercase tracking-[0.2em] transition hover:bg-[#18352B] hover:text-white"
        >
          Connect With Us
          <ArrowRight size={16} />
        </Link>

      </section>

    </main>
  );
}