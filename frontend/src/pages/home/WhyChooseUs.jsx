import {
  Gem,
  HandHeart,
  ShieldCheck,
  Globe2,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: Gem,
    title: "Natural Beauty",
    description:
      "Discover gemstones with unique colours, patterns and natural character.",
  },
  {
    number: "02",
    icon: HandHeart,
    title: "Thoughtful Craftsmanship",
    description:
      "Every creation deserves attention, care and an eye for detail.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Quality Focused",
    description:
      "We value quality and consistency in every gemstone creation.",
  },
  {
    number: "04",
    icon: Globe2,
    title: "Global Vision",
    description:
      "Bringing the beauty of natural gemstones closer to buyers worldwide.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-[#18352B] py-20 md:py-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">

        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A477] mb-5">
            The Royal Difference
          </p>

          <h2 className="font-serif text-4xl md:text-5xl text-[#F7F4EE] leading-tight">
            Why Choose
            <span className="block italic text-[#C5A477]">
              Royal Agate Export?
            </span>
          </h2>

          <div className="w-16 h-px bg-[#A98250] mx-auto my-7" />

          <p className="text-sm md:text-base leading-8 text-[#D2D8D2]">
            We believe every gemstone has a story worth discovering.
            Our approach brings together natural beauty, thoughtful
            craftsmanship and a commitment to quality.
          </p>

        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.number}
                className={`px-7 py-8 md:px-8 border-[#557064]
                  ${index !== features.length - 1 ? "lg:border-r" : ""}
                  ${index < 2 ? "sm:border-b lg:border-b-0" : ""}
                  ${index === 2 ? "lg:border-r" : ""}
                  `}
              >

                <div className="flex items-center justify-between mb-10">

                  <Icon
                    size={30}
                    strokeWidth={1.2}
                    className="text-[#C5A477]"
                  />

                  <span className="font-serif text-sm text-[#C5A477]">
                    {feature.number}
                  </span>

                </div>

                <h3 className="font-serif text-2xl text-[#F7F4EE] mb-4">
                  {feature.title}
                </h3>

                <p className="text-sm leading-7 text-[#C3CEC6]">
                  {feature.description}
                </p>

                <div className="w-10 h-px bg-[#A98250] mt-8" />

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}