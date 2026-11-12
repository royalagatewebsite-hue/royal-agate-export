import { Link } from "react-router-dom";
import {
  Globe2,
  Package,
  Gem,
  Building2,
  ArrowRight,
  CheckCircle2,
  Mail,
} from "lucide-react";

const productGroups = [
  {
    title: "Agate Products",
    description:
      "Explore our range of natural agate products and handcrafted gemstone creations.",
    icon: Gem,
    items: [
      "Agate Artifacts",
      "Agate Items",
      "Agate Eyes",
      "Tumble Stones",
      "Worry Stones",
      "Natural Points",
    ],
  },
  {
    title: "Gemstone Products",
    description:
      "A diverse selection of gemstones in different colours, patterns and natural formations.",
    icon: Package,
    items: [
      "Amethyst Geodes",
      "Gemstone Bowls",
      "Gemstone Pendulums",
      "Pyramids",
      "Obelisks",
      "Crystal Collections",
    ],
  },
  {
    title: "Metaphysical & Decorative",
    description:
      "Distinctive decorative and metaphysical creations for collectors and businesses.",
    icon: Building2,
    items: [
      "Chakra Products",
      "Reiki Items",
      "Healing Sticks",
      "Himalayan Salt Lamps",
      "Shiva Lingams",
      "Feng Shui Products",
    ],
  },
];

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Australia",
  "Mexico",
  "Austria",
  "And Many More",
];

export default function ExportPage() {
  return (
    <main className="bg-[#F7F4EE] text-[#18352B]">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#DED7CA]">

        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-12 md:py-28">

          <div>
            <p className="mb-6 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
              Global Trade & Partnerships
            </p>

            <h1 className="font-serif text-5xl leading-[1.1] md:text-7xl">
              Bringing Nature's
              <br />
              Beauty
              <br />
              <span className="italic text-[#A98250]">
                Across Borders.
              </span>
            </h1>

            <div className="my-8 h-px w-20 bg-[#A98250]" />

            <p className="max-w-lg text-sm leading-8 text-[#77756F] md:text-base">
              Discover Royal Agate Export's range of natural
              gemstones, agate creations and handcrafted
              products for international markets.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <Link
                to="/contact"
                className="inline-flex items-center gap-4 bg-[#18352B] px-7 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#A98250]"
              >
                Get in Touch
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/collections"
                className="border border-[#A98250] px-7 py-4 text-xs uppercase tracking-[0.15em] transition hover:bg-[#18352B] hover:text-white"
              >
                Explore Products
              </Link>

            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden bg-[#DED7CA]">
              <img
                src="/images/export-global-trade.webp"
                alt="Natural green agate gemstones and international export trade"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="absolute -bottom-5 -left-5 bg-[#18352B] px-8 py-6 text-white md:-left-10">
              <Globe2
                size={27}
                className="mb-3 text-[#C49A64]"
              />
              <p className="font-serif text-2xl">
                Global Reach
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                Royal Agate Export
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">

        <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
          Our Export Business
        </p>

        <h2 className="font-serif text-4xl leading-tight md:text-6xl">
          A World of Gemstones,
          <br />
          <span className="italic text-[#A98250]">
            One Trusted Connection.
          </span>
        </h2>

        <div className="mx-auto my-8 h-px w-16 bg-[#A98250]" />

        <p className="mx-auto max-w-3xl text-sm leading-8 text-[#77756F] md:text-base">
          Royal Agate Export aims to connect the natural beauty
          of gemstones with customers, retailers, wholesalers
          and business partners around the world. Our focus is
          on quality, craftsmanship and building lasting
          business relationships.
        </p>

      </section>

      {/* PRODUCT GROUPS */}
      <section className="border-y border-[#DED7CA] bg-white px-6 py-24 md:py-28">

        <div className="mx-auto max-w-[1300px]">

          <div className="mb-16 text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
              What We Offer
            </p>

            <h2 className="font-serif text-4xl md:text-5xl">
              Our Export Products
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#77756F]">
              A curated range of gemstone products and natural
              creations for different markets and business needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {productGroups.map((group, index) => {
              const Icon = group.icon;

              return (
                <div
                  key={group.title}
                  className="border border-[#DED7CA] p-8 transition duration-300 hover:-translate-y-2 hover:border-[#A98250]"
                >

                  <Icon
                    size={32}
                    strokeWidth={1.3}
                    className="mb-7 text-[#A98250]"
                  />

                  <p className="font-serif text-2xl">
                    {group.title}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-[#77756F]">
                    {group.description}
                  </p>

                  <div className="my-7 h-px bg-[#DED7CA]" />

                  <ul className="space-y-4">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm text-[#77756F]"
                      >
                        <span className="h-1.5 w-1.5 bg-[#A98250]" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-8 text-xs tracking-[0.2em] text-[#A98250]">
                    0{index + 1}
                  </p>

                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* INTERNATIONAL REACH */}
      <section className="bg-[#18352B] px-6 py-24 text-white md:py-28">

        <div className="mx-auto max-w-5xl text-center">

          <Globe2
            size={38}
            strokeWidth={1.2}
            className="mx-auto mb-7 text-[#C49A64]"
          />

          <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#C49A64]">
            International Presence
          </p>

          <h2 className="font-serif text-4xl md:text-6xl">
            Connecting With
            <br />
            Markets Worldwide.
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-8 text-white/65">
            We welcome enquiries from international customers
            and businesses interested in our gemstone and
            jewellery collections.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-3">

            {countries.map((country) => (
              <span
                key={country}
                className="border border-white/20 px-5 py-3 text-xs tracking-wide text-white/80"
              >
                {country}
              </span>
            ))}

          </div>

        </div>
      </section>

      {/* WHY PARTNER WITH US */}
      <section className="px-6 py-24 md:py-28">

        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
              Business Relationships
            </p>

            <h2 className="font-serif text-4xl md:text-5xl">
              Why Partner With Us?
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">

            {[
              "A diverse range of gemstone products",
              "Focus on product quality and craftsmanship",
              "Wholesale and bulk business enquiries",
              "A commitment to lasting business relationships",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 border-b border-[#DED7CA] pb-6"
              >
                <CheckCircle2
                  size={21}
                  className="mt-1 shrink-0 text-[#A98250]"
                />

                <p className="font-serif text-xl">
                  {item}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* BUSINESS ENQUIRY CTA */}
      <section className="border-t border-[#DED7CA] bg-white px-6 py-24 text-center md:py-28">

        <Mail
          size={35}
          strokeWidth={1.3}
          className="mx-auto mb-7 text-[#A98250]"
        />

        <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
          Let's Work Together
        </p>

        <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Looking for a Gemstone
          <span className="italic text-[#A98250]">
            {" "}Export Partner?
          </span>
        </h2>

        <p className="mx-auto mt-7 max-w-xl text-sm leading-8 text-[#77756F]">
          Tell us about your business, product interests and
          requirements. Our team would be happy to hear from you.
        </p>

        <Link
          to="/contact"
          className="mt-10 inline-flex items-center gap-4 bg-[#18352B] px-9 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#A98250]"
        >
          Send Business Enquiry
          <ArrowRight size={16} />
        </Link>

      </section>

    </main>
  );
}