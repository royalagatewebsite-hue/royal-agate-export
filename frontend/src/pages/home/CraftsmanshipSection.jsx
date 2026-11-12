import { ArrowUpRight } from "lucide-react";

const highlights = [
  {
    number: "01",
    title: "Natural Selection",
    description: "Every gemstone is selected for its unique natural character.",
  },
  {
    number: "02",
    title: "Skilled Craftsmanship",
    description: "Carefully shaped and finished with attention to every detail.",
  },
  {
    number: "03",
    title: "Quality Assured",
    description: "A commitment to quality across every creation we offer.",
  },
];

export default function CraftsmanshipSection() {
  return (
    <section className="bg-[#EAE4D9] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Image */}
          <div className="relative">
            <div className="aspect-[5/4] overflow-hidden bg-[#D8D0C2]">
              <img
                src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=85"
                alt="Fine gemstone jewellery craftsmanship"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -right-3 md:-right-6 bg-[#18352B] text-[#F7F4EE] px-7 py-6 md:px-10 md:py-8">
              <p className="font-serif text-3xl md:text-4xl">Nature</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#C5A477] mt-2">
                Our Greatest Inspiration
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="pt-5 lg:pt-0">

            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A98250] mb-5">
              The Art Behind Every Creation
            </p>

            <h2 className="font-serif text-4xl md:text-5xl xl:text-6xl leading-[1.15] text-[#18352B]">
              Crafted with
              <span className="block italic text-[#A98250]">
                Passion & Precision.
              </span>
            </h2>

            <div className="w-16 h-px bg-[#A98250] my-7" />

            <p className="text-sm md:text-base leading-8 text-[#65645D] max-w-xl">
              Every gemstone tells a story shaped over thousands of years.
              At Royal Agate Export, we celebrate nature's artistry through
              carefully selected stones and thoughtful craftsmanship.
              Our focus is on bringing out the natural beauty of every creation.
            </p>

            {/* Highlights */}
            <div className="mt-10 space-y-6">

              {highlights.map((item) => (
                <div
                  key={item.number}
                  className="flex gap-5 border-b border-[#C9BDAA] pb-5"
                >
                  <span className="font-serif text-lg text-[#A98250]">
                    {item.number}
                  </span>

                  <div>
                    <h3 className="font-serif text-xl text-[#18352B]">
                      {item.title}
                    </h3>

                    <p className="text-xs md:text-sm text-[#77746D] mt-2 leading-6">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {/* CTA */}
            <a
              href="/about"
              className="inline-flex items-center gap-4 mt-9 bg-[#18352B] text-white px-7 py-4 text-[10px] uppercase tracking-[0.16em] hover:bg-[#A98250] transition-colors"
            >
              Discover Our Story
              <ArrowUpRight size={16} />
            </a>

          </div>

        </div>
      </div>
    </section>
  );
}