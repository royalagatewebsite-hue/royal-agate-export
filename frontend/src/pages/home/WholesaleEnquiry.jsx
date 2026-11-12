import { ArrowUpRight, Globe2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function WholesaleEnquiry() {
  return (
    <section className="bg-[#F7F4EE] py-20 md:py-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="relative overflow-hidden bg-[#18352B] px-8 py-14 md:px-16 md:py-20">

          {/* Decorative Element */}
          <div className="absolute -right-20 -top-28 w-96 h-96 rounded-full border border-[#A98250]/20" />
          <div className="absolute -right-10 -top-20 w-72 h-72 rounded-full border border-[#A98250]/20" />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C49A64] mb-6">
                Business With Royal Agate
              </p>

              <h2 className="font-serif text-4xl md:text-5xl xl:text-6xl leading-[1.15] text-[#F7F4EE]">
                Looking for a
                <span className="block italic text-[#C49A64]">
                  Wholesale Partner?
                </span>
              </h2>

              <div className="w-16 h-px bg-[#A98250] my-8" />

              <p className="text-sm md:text-base leading-8 text-[#D6D1C7] max-w-lg">
                Discover business opportunities with Royal Agate.
                Whether you are a wholesaler, retailer or international
                buyer, let's create something beautiful together.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-4 mt-10 bg-[#A98250] text-white px-8 py-4 text-[10px] uppercase tracking-[0.18em] hover:bg-[#F7F4EE] hover:text-[#18352B] transition-colors"
              >
                Send an Enquiry
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {/* Right Content */}
            <div className="space-y-8 lg:pl-12">

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 shrink-0 border border-[#A98250]/50 flex items-center justify-center text-[#C49A64]">
                  <Globe2 size={21} strokeWidth={1.4} />
                </div>

                <div>
                  <h3 className="font-serif text-xl text-[#F7F4EE]">
                    Global Business Enquiries
                  </h3>
                  <p className="text-xs text-[#C7C2B8] mt-2 leading-6">
                    Connect with us for wholesale and international
                    business opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 shrink-0 border border-[#A98250]/50 flex items-center justify-center text-[#C49A64]">
                  <Mail size={21} strokeWidth={1.4} />
                </div>

                <div>
                  <h3 className="font-serif text-xl text-[#F7F4EE]">
                    Let's Talk Business
                  </h3>
                  <p className="text-xs text-[#C7C2B8] mt-2 leading-6">
                    Share your requirements and our team will
                    get in touch with you.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/15">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C49A64]">
                  Royal Agate Export
                </p>
                <p className="font-serif text-2xl italic text-[#F7F4EE] mt-2">
                  Nature's Artistry. Crafted to Last.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}