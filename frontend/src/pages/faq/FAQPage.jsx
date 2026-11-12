import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, MessageCircle, ArrowRight } from "lucide-react";

const categories = [
  "All Questions",
  "Products",
  "Orders",
  "Payments",
  "Shipping",
  "Wholesale",
];

const faqs = [
  {
    category: "Products",
    question: "Are your agate stones natural?",
    answer:
      "We focus on offering natural gemstone products. Product descriptions will provide relevant details about the individual stone or creation.",
  },
  {
    category: "Products",
    question: "Will every gemstone look exactly the same?",
    answer:
      "Natural gemstones have unique patterns, colours and textures. Slight variations are part of their natural character, making every piece distinctive.",
  },
  {
    category: "Products",
    question: "Do you offer different types of gemstone products?",
    answer:
      "Yes. Our collections include natural agate stones, gemstone jewellery, decorative creations and crystal collections.",
  },
  {
    category: "Orders",
    question: "How can I place an order?",
    answer:
      "Browse our collections, select your preferred products, add them to your cart and proceed through checkout to place your order.",
  },
  {
    category: "Orders",
    question: "Can I track my order?",
    answer:
      "Registered customers can visit the My Orders section of their account to view order details and available order updates.",
  },
  {
    category: "Orders",
    question: "Can I cancel my order?",
    answer:
      "Cancellation options depend on the current order status. You can check your order details or contact our team for assistance.",
  },
  {
    category: "Payments",
    question: "What payment methods are available?",
    answer:
      "Available payment methods are displayed during checkout. Please review the options shown before completing your purchase.",
  },
  {
    category: "Payments",
    question: "Is my payment information secure?",
    answer:
      "Payments are handled through the payment process provided at checkout. Please do not share your payment credentials with anyone.",
  },
  {
    category: "Shipping",
    question: "Do you ship internationally?",
    answer:
      "For international shipping availability, destinations and shipping arrangements, please contact our team with your location and product requirements.",
  },
  {
    category: "Shipping",
    question: "How long will delivery take?",
    answer:
      "Delivery timelines depend on the destination, shipping method and order details. The applicable information can be confirmed with our team.",
  },
  {
    category: "Wholesale",
    question: "Do you accept wholesale enquiries?",
    answer:
      "Yes. We welcome wholesale and business enquiries. Share your product requirements, quantities and business details through our enquiry form.",
  },
  {
    category: "Wholesale",
    question: "How can I request bulk pricing?",
    answer:
      "You can submit a wholesale enquiry through our website. Include the products and approximate quantities you are interested in so our team can assist you.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All Questions");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFAQ, setOpenFAQ] = useState(0);

  const filteredFAQs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "All Questions" ||
        faq.category === activeCategory;

      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setOpenFAQ(0);
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE] text-[#18352B]">

      {/* HERO */}
      <section className="border-b border-[#DED7CA] px-6 py-20 text-center md:py-28">

        <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
          Here to Help
        </p>

        <h1 className="font-serif text-5xl md:text-7xl">
          Frequently Asked
          <br />
          <span className="italic text-[#A98250]">
            Questions.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-sm leading-8 text-[#77756F] md:text-base">
          Find answers to common questions about our gemstone
          collections, orders, payments and business enquiries.
        </p>

        <div className="mx-auto mt-10 flex max-w-xl items-center border border-[#DED7CA] bg-white px-5 py-4">
          <Search size={19} className="shrink-0 text-[#A98250]" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenFAQ(0);
            }}
            placeholder="Search for a question..."
            className="ml-4 w-full bg-transparent text-sm outline-none placeholder:text-[#A5A19A]"
          />
        </div>

      </section>

      {/* FAQ CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">

        {/* CATEGORY FILTERS */}
        <div className="mb-14 flex flex-wrap justify-center gap-3">

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`border px-5 py-3 text-[10px] uppercase tracking-[0.15em] transition duration-300 ${
                activeCategory === category
                  ? "border-[#18352B] bg-[#18352B] text-white"
                  : "border-[#DED7CA] bg-transparent text-[#77756F] hover:border-[#A98250] hover:text-[#18352B]"
              }`}
            >
              {category}
            </button>
          ))}

        </div>

        {/* FAQ LIST */}
        <div className="mx-auto max-w-4xl">

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const isOpen = openFAQ === index;

              return (
                <div
                  key={faq.question}
                  className="border-b border-[#DED7CA]"
                >

                  <button
                    onClick={() => setOpenFAQ(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-7 text-left"
                    aria-expanded={isOpen}
                  >

                    <div>
                      <span className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-[#A98250]">
                        {faq.category}
                      </span>

                      <span className="font-serif text-xl md:text-2xl">
                        {faq.question}
                      </span>
                    </div>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border border-[#DED7CA] transition duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#A98250] bg-[#18352B] text-white"
                          : "text-[#A98250]"
                      }`}
                    >
                      <ChevronDown size={17} />
                    </span>

                  </button>

                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen
                        ? "grid-rows-[1fr] pb-7 opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-3xl text-sm leading-8 text-[#77756F]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="py-20 text-center">

              <Search
                size={35}
                className="mx-auto mb-5 text-[#A98250]"
              />

              <h3 className="font-serif text-2xl">
                No questions found
              </h3>

              <p className="mt-3 text-sm text-[#77756F]">
                Try another search term or select a different category.
              </p>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All Questions");
                  setOpenFAQ(0);
                }}
                className="mt-6 text-xs uppercase tracking-[0.15em] text-[#A98250] underline underline-offset-4"
              >
                Clear Filters
              </button>

            </div>
          )}

        </div>

      </section>

      {/* CONTACT CTA */}
      <section className="bg-[#18352B] px-6 py-20 text-center text-white md:py-24">

        <MessageCircle
          size={35}
          strokeWidth={1.3}
          className="mx-auto mb-7 text-[#C49A64]"
        />

        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#C49A64]">
          Need More Assistance?
        </p>

        <h2 className="font-serif text-4xl md:text-5xl">
          Still Have Questions?
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-sm leading-8 text-white/65">
          Our team would be happy to help you with product
          information, orders or business enquiries.
        </p>

        <Link
          to="/contact"
          className="mt-9 inline-flex items-center gap-4 bg-[#A98250] px-8 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#18352B]"
        >
          Contact Our Team
          <ArrowRight size={16} />
        </Link>

      </section>

    </main>
  );
}