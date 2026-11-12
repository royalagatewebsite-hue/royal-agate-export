import {
  Instagram,
  Facebook,
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
  FileCheck,
} from "lucide-react";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "All Collections", href: "/collections" },
  { name: "Agate", href: "/category/agate" },
  { name: "Jewellery", href: "/category/jewellery" },
  { name: "Home Decoration", href: "/category/home-decoration" },
  { name: "Crystal Collection", href: "/category/crystal-collection" },
  { name: "About Us", href: "/about" },
  { name: "FAQs", href: "/faqs" },
  { name: "Export", href: "/export" },
  { name: "Contact", href: "/contact" },
];

const collections = [
  { name: "Natural Agate Stones", href: "/category/agate" },
  { name: "Agate Jewellery", href: "/category/jewellery" },
  { name: "Home Decoration", href: "/category/home-decoration" },
  { name: "Crystal Collection", href: "/category/crystal-collection" },
];
export default function Footer() {
  return (
    <footer className="bg-[#18352B] text-[#F7F4EE]">

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-20 pb-14">

        {/* Top Brand Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">

          {/* Brand */}
          <div>
            <a href="/" className="inline-block">
              <h2 className="font-serif text-3xl tracking-[0.12em]">
                ROYAL AGATE
              </h2>

              <p className="text-[9px] tracking-[0.5em] text-[#C5A477] text-center mt-2">
                EXPORT
              </p>
            </a>

            <p className="text-sm leading-7 text-[#C3CEC6] mt-7 max-w-xs">
              Discover the natural beauty of gemstones and
              timeless creations shaped by nature and
              thoughtful craftsmanship.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-8">

              {/* Instagram - Official */}
              <a
                href="https://www.instagram.com/royal_agate_export_official?vrfl=MWN5ZXFkeHAxcGlodA=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Royal Agate Export Instagram"
                title="Royal Agate Export Instagram"
                className="w-10 h-10 border border-[#557064] flex items-center justify-center text-[#C5A477] hover:bg-[#C5A477] hover:text-[#18352B] transition-colors"
              >
                <Instagram size={17} />
              </a>

              {/* Instagram - Gems and Jewellery */}
              <a
                href="https://www.instagram.com/royalgemsandjewellerys?vrfl=c25zZ3lvZjdtbGl2"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Royal Gems and Jewellery Instagram"
                title="Royal Gems and Jewellery Instagram"
                className="w-10 h-10 border border-[#557064] flex items-center justify-center text-[#C5A477] hover:bg-[#C5A477] hover:text-[#18352B] transition-colors"
              >
                <Instagram size={17} />
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/19oG8gAeQw/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Royal Agate Export Facebook"
                title="Royal Agate Export Facebook"
                className="w-10 h-10 border border-[#557064] flex items-center justify-center text-[#C5A477] hover:bg-[#C5A477] hover:text-[#18352B] transition-colors"
              >
                <Facebook size={17} />
              </a>

            </div>
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-xl mb-8">
              Quick Links
            </h3>

            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-[#C3CEC6] hover:text-[#C5A477] transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h3 className="font-serif text-xl mb-8">
              Our Collections
            </h3>

            <ul className="space-y-4">
              {collections.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-[#C3CEC6] hover:text-[#C5A477] transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-xl mb-8">
              Get in Touch
            </h3>

            <div className="space-y-6">

              <div className="flex gap-4">
                <Mail
                  size={18}
                  className="shrink-0 text-[#C5A477]"
                />

                <div>
                  <p className="text-xs text-[#C5A477] mb-1">
                    Email
                  </p>
                  <p className="text-sm text-[#C3CEC6]">
                    <a
                      href="mailto:royalagateexport00@gmail.com"
                      className="text-sm text-[#C3CEC6] hover:text-[#C5A477] transition-colors"
                    >
                      royalagateexport00@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone
                  size={18}
                  className="shrink-0 text-[#C5A477]"
                />

                <div>
                  <p className="text-xs text-[#C5A477] mb-1">
                    Phone
                  </p>
                  <a
                    href="tel:+917777905258"
                    className="block text-sm text-[#C3CEC6] hover:text-[#C5A477] transition-colors"
                  >
                    +91 77779 05258
                  </a>

                  <a
                    href="tel:+919909089713"
                    className="block text-sm text-[#C3CEC6] mt-3 hover:text-[#C5A477] transition-colors"
                  >
                    +91 9909089713
                  </a>

                </div>
              </div>

              <div className="flex gap-4">
                <MapPin
                  size={18}
                  className="shrink-0 text-[#C5A477]"
                />

                <div>
                  <p className="text-xs text-[#C5A477] mb-1">
                    Location
                  </p>
                  <p className="text-sm leading-7 text-[#C3CEC6]">
                    DA0837, CHITARI BAZAR DARUVADA NI KHADAKI,
                    KHAMBHAT, ANAND, GUJARAT, 388620
                  </p>
                </div>
              </div>

            </div>

            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#C5A477] mt-8 hover:text-white transition-colors"
            >
              Contact Us
              <ArrowUpRight size={15} />
            </a>

          </div>

        </div>

      </div>

      {/* Business Credentials */}
      <div id="business-credentials" className="border-t border-[#557064] scroll-mt-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-10">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 border border-[#A98250]/50 flex items-center justify-center text-[#C5A477]">
                <FileCheck size={23} strokeWidth={1.4} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C5A477] mb-2">
                  Business Credentials
                </p>

                <h3 className="font-serif text-xl text-[#F7F4EE]">
                  Royal Agate Export
                </h3>

                <p className="text-xs text-[#C3CEC6] mt-2">
                  Official business registration details and documentation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">

            {/* GST Registration */}
            <div className="border border-[#557064] px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A477] mb-3">
                GST Registration
              </p>

              <p className="text-sm text-[#C3CEC6]">
                GSTIN: 24BPXPS2423E1ZP
              </p>

              <a
                href="/documents/royal-agate-export-business-certificates.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-[10px] uppercase tracking-[0.15em] text-[#C5A477] hover:text-white transition-colors"
              >
                <FileCheck size={14} />
                View GST Certificate
                <ArrowUpRight size={14} />
              </a>
            </div>

            {/* Import Export Code */}
            <div className="border border-[#557064] px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A477] mb-3">
                Import Export Code
              </p>

              <p className="text-sm text-[#C3CEC6]">
                IEC: BPXPS2423E
              </p>

              <a
                href="/documents/royal-agate-export-business-certificates.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-[10px] uppercase tracking-[0.15em] text-[#C5A477] hover:text-white transition-colors"
              >
                <FileCheck size={14} />
                View IEC Certificate
                <ArrowUpRight size={14} />
              </a>
            </div>

          </div>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#557064]">

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-5">

          <p className="text-[11px] text-[#AEBDB3] text-center">
            © {new Date().getFullYear()} Royal Agate Export. All rights reserved.
          </p>

          <div className="flex items-center gap-6">

            <a
              href="/privacy-policy"
              className="text-[11px] text-[#AEBDB3] hover:text-[#C5A477] transition-colors"
            >
              Privacy Policy
            </a>

            <a
              href="/terms"
              className="text-[11px] text-[#AEBDB3] hover:text-[#C5A477] transition-colors"
            >
              Terms & Conditions
            </a>

            <a 
             href="/refund-policy"
             className="text-[11px] text-[#AEBDB3] hover:text-[#C5A477] transition-colors"
            >
              Refund Policy
            </a>

          </div>

          <p className="text-[10px] tracking-[0.12em] uppercase text-[#C5A477]">
            Developed by{" "}
            <span className="font-semibold text-[#F7F4EE]">
              Mohammad Fahad
            </span>
          </p>

        </div>

      </div>

    </footer>
  );
}