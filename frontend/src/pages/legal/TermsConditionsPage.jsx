import { Link } from "react-router-dom";
import {
  FileText,
  Mail,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to Royal Agate Export.

These Terms & Conditions govern your access to and use of our website, products, and services.

By accessing our website, creating an account, browsing our collections, or placing an order, you agree to comply with these Terms & Conditions.

If you do not agree with these terms, please discontinue using our website.`,
  },
  {
    title: "2. Website Usage",
    content: `You agree to use this website only for lawful purposes.

You must not:

• Use the website for fraudulent or unlawful activities.
• Attempt to gain unauthorised access to our website or systems.
• Interfere with website functionality or security.
• Submit false, misleading, or inaccurate information.
• Copy or misuse website content without permission.

We reserve the right to restrict access to our website where misuse or suspicious activity is identified.`,
  },
  {
    title: "3. Customer Accounts",
    content: `Customers may create accounts to access certain website features and services.

You are responsible for:

• Providing accurate registration information.
• Maintaining the confidentiality of your login credentials.
• Keeping your account information updated.
• Informing us if you suspect unauthorised access to your account.

Royal Agate Export reserves the right to restrict or suspend accounts involved in fraudulent activities or violations of these Terms & Conditions.

Customers may request account deletion through our official contact channels, subject to applicable legal and record-retention requirements.`,
  },
  {
    title: "4. Products and Natural Variations",
    content: `Royal Agate Export offers natural gemstones, agate products, gemstone jewellery, decorative items, and related creations.

We make reasonable efforts to display accurate product descriptions, images, specifications, and other product information.

However, customers should understand that:

• Natural gemstones may vary in colour, pattern, texture, shape, and appearance.
• Each natural gemstone may have its own distinctive characteristics.
• Product colours may appear slightly different depending on screen settings, lighting, and display devices.
• Natural variations are part of the unique character of gemstone products.

Customers are encouraged to review product descriptions and specifications before placing an order.`,
  },
  {
    title: "5. Product Availability",
    content: `All products are subject to availability.

We reserve the right to update product listings, modify product descriptions, change prices, or discontinue products without prior notice.

If a product becomes unavailable after an order has been placed, our team may contact the customer to discuss the available options.`,
  },
  {
    title: "6. Pricing, Taxes and Payments",
    content: `All product prices and applicable charges will be displayed on the website or during checkout.

Applicable taxes, including GST where applicable, will be reflected in the pricing or checkout details.

Customers are responsible for reviewing the final order amount, including applicable taxes and shipping charges, before confirming a purchase.

Available payment methods will be displayed during checkout.

Where third-party payment services are used, transactions will also be subject to the applicable payment provider's terms and conditions.

Orders may be subject to verification before processing.`,
  },
  {
    title: "7. Orders and Order Confirmation",
    content: `Placing an order through our website constitutes a purchase request.

After an order is placed, Royal Agate Export may contact the customer through WhatsApp to communicate order confirmation and relevant order-related updates.

An order acknowledgement does not necessarily mean that the order has been finally accepted for fulfilment.

Royal Agate Export reserves the right to cancel or decline an order in circumstances such as:

• Product unavailability.
• Incorrect pricing or listing information.
• Suspected fraudulent activity.
• Incomplete or inaccurate order information.
• Other legitimate operational or legal reasons.

If an order is cancelled by Royal Agate Export after payment has been received, the applicable amount will be refunded to the customer in accordance with our Refund & Cancellation Policy.`,
  },
  {
    title: "8. Domestic and International Shipping",
    content: `Royal Agate Export accepts domestic and international orders, subject to product availability and shipping feasibility.

Shipping charges, estimated delivery timelines, and applicable delivery conditions will be communicated during the ordering process or through order-related communications.

International customers should note that customs duties, import taxes, clearance charges, and other destination-specific fees may apply.

Unless expressly stated otherwise, such charges are the responsibility of the customer.

Delivery timelines may vary depending on the destination, courier operations, customs procedures, weather conditions, and other circumstances beyond our reasonable control.

Customers are responsible for providing accurate shipping information.`,
  },
  {
    title: "9. Cancellation, Returns and Refunds",
    content: `Order cancellation, product returns, refunds, and replacements are governed by our separate Refund & Cancellation Policy.

Customers are encouraged to review that policy before placing an order.

In particular, customers should follow the specified reporting procedure and time limits for damaged or incorrect products.`,
  },
  {
    title: "10. Customer Reviews and Feedback",
    content: `Customers may submit ratings, reviews, and feedback about products available on our website.

By submitting a review, you agree that:

• Your review must be genuine and based on your experience.
• You must not submit abusive, defamatory, misleading, or fraudulent content.
• You must not publish another person's private or confidential information.
• Your review may be displayed publicly on the relevant product page.

Royal Agate Export reserves the right to permanently remove reviews that are fake, spam, abusive, or otherwise inappropriate.

Genuine negative feedback will not be removed merely because it expresses dissatisfaction with a product or service.`,
  },
  {
    title: "11. Intellectual Property",
    content: `All website content, including text, photographs, graphics, logos, designs, product descriptions, and other materials, belongs to Royal Agate Export or its respective content owners unless otherwise stated.

You may not reproduce, distribute, modify, or commercially use website content without prior written permission from the relevant rights holder.`,
  },
  {
    title: "12. Third-Party Services and Links",
    content: `Our website may contain links to external websites or services.

These third-party services operate independently and may have their own terms, privacy policies, and conditions.

Royal Agate Export is not responsible for the content, availability, or practices of external websites.`,
  },
  {
    title: "13. Limitation of Liability",
    content: `To the extent permitted by applicable law, Royal Agate Export shall not be responsible for indirect or consequential losses arising from the use of our website or services.

Nothing in these Terms & Conditions excludes or limits any liability that cannot legally be excluded or limited under applicable law.`,
  },
  {
    title: "14. Changes to These Terms",
    content: `Royal Agate Export may update these Terms & Conditions from time to time to reflect changes in business operations, website functionality, products, or applicable legal requirements.

Updated terms will be published on this page with a revised Last Updated date.`,
  },
  {
    title: "15. Governing Law",
    content: `These Terms & Conditions shall be interpreted in accordance with the applicable laws of India.

Any disputes shall be handled by the competent authorities or courts having jurisdiction under applicable law.`,
  },
];

export default function TermsConditionsPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EE]">

      {/* Hero Section */}
      <section className="bg-[#18352B] px-6 py-20 text-center md:py-28">

        <FileText
          size={38}
          strokeWidth={1.3}
          className="mx-auto mb-6 text-[#C5A477]"
        />

        <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#C5A477]">
          Royal Agate Export
        </p>

        <h1 className="font-serif text-4xl text-[#F7F4EE] md:text-6xl">
          Terms & Conditions
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#C3CEC6]">
          Please review the terms governing your use of our website,
          products, and services.
        </p>

        <p className="mt-6 text-xs text-[#C5A477]">
          Last Updated: 12 November 2026
        </p>

      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">

        <div className="mb-10 border-l-2 border-[#A98250] bg-white p-6 md:p-8">
          <p className="text-sm leading-7 text-[#77756F]">
            Thank you for choosing Royal Agate Export. These terms
            are designed to establish clear expectations and ensure
            a transparent shopping experience for our customers.
          </p>
        </div>

        <div className="space-y-10">

          {sections.map((section, index) => (
            <article
              key={index}
              className="border-b border-[#DED7CA] pb-9 last:border-0"
            >
              <h2 className="mb-5 font-serif text-2xl text-[#18352B] md:text-3xl">
                {section.title}
              </h2>

              <div className="whitespace-pre-line text-sm leading-8 text-[#77756F]">
                {section.content}
              </div>
            </article>
          ))}

          {/* Contact Section */}
          <article className="border border-[#DED7CA] bg-white p-7 md:p-10">

            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#A98250]">
              Get in Touch
            </p>

            <h2 className="font-serif text-3xl text-[#18352B]">
              16. Contact Information
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#77756F]">
              For questions, concerns, or assistance regarding these
              Terms & Conditions, please contact Royal Agate Export.
            </p>

            <div className="mt-8 space-y-5">

              <a
                href="mailto:royalagateexport00@gmail.com"
                className="flex items-center gap-4 text-sm text-[#18352B] transition hover:text-[#A98250]"
              >
                <Mail size={20} className="text-[#A98250]" />
                royalagateexport00@gmail.com
              </a>

              <a
                href="https://wa.me/917777905258"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-sm text-[#18352B] transition hover:text-[#A98250]"
              >
                <MessageCircle size={20} className="text-[#A98250]" />
                +91 7777905258
              </a>

              <a
                href="https://wa.me/919909089713"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-sm text-[#18352B] transition hover:text-[#A98250]"
              >
                <MessageCircle className="text-[#A98250]" size={20} />
                +91 9909089713
              </a>

            </div>

          </article>

        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-wrap items-center gap-6">

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#18352B] transition hover:text-[#A98250]"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>

          <Link
            to="/privacy-policy"
            className="text-xs uppercase tracking-[0.15em] text-[#A98250] transition hover:text-[#18352B]"
          >
            Privacy Policy →
          </Link>

          <Link
            to="/refund-policy"
            className="text-xs uppercase tracking-[0.15em] text-[#A98250] transition hover:text-[#18352B]"
          >
            Refund Policy →
          </Link>

        </div>

      </section>

    </main>
  );
}