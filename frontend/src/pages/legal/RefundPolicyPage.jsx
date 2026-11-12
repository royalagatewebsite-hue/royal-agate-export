import {
  RefreshCcw,
  Package,
  Clock,
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    icon: RefreshCcw,
    title: "1. Introduction",
    content: [
      "At Royal Agate Export, customer satisfaction is important to us. This Refund and Cancellation Policy explains the conditions under which orders may be cancelled, products may be returned, and refunds may be issued.",
      "By placing an order through our website, you agree to the terms outlined in this policy, subject to applicable consumer protection laws.",
    ],
  },
  {
    icon: Package,
    title: "2. Order Cancellation",
    content: [
      "Customers may request cancellation of an order before it has been dispatched.",
      "Once an order has been dispatched, cancellation is generally not permitted. However, customers may contact our support team if they have any concerns.",
      "Royal Agate Export reserves the right to cancel an order due to product unavailability, incorrect pricing, suspected fraudulent activity, or other legitimate reasons.",
      "If an order is cancelled after payment has been received, the eligible amount will be refunded to the customer.",
    ],
  },
  {
    icon: AlertCircle,
    title: "3. Damaged or Incorrect Products",
    content: [
      "If you receive a damaged, defective, or incorrect product, please contact us within 48 hours of delivery.",
      "To help us verify your request, please provide:",
    ],
    list: [
      "Your order ID.",
      "Clear photographs or videos showing the issue.",
      "A brief description of the problem.",
    ],
    footer:
      "After verification, Royal Agate Export will arrange an appropriate resolution, which may include a replacement or refund depending on the circumstances and product availability.",
  },
  {
    icon: Clock,
    title: "4. Reporting Time Limit",
    content: [
      "Requests regarding damaged, defective, or incorrect products should be reported within 48 hours of delivery.",
      "Requests received after this period may be reviewed at our discretion, subject to applicable laws and consumer rights.",
    ],
  },
  {
    icon: CheckCircle2,
    title: "5. Refund Eligibility",
    content: [
      "A refund may be considered in the following situations:",
    ],
    list: [
      "An order is cancelled by Royal Agate Export after payment has been received.",
      "A cancellation request is approved before dispatch.",
      "A product is verified to be damaged or defective upon delivery.",
      "An incorrect product has been delivered.",
      "A refund is otherwise required under applicable laws.",
    ],
  },
  {
    icon: CreditCard,
    title: "6. Refund Processing",
    content: [
      "Once a refund request has been reviewed and approved, we will initiate the refund within 5–7 business days.",
      "For online payments, refunds will generally be processed through the original payment method.",
      "For Cash on Delivery (COD) orders, approved refunds will be processed through the customer's bank account or UPI details.",
      "The time taken for the refunded amount to appear in your account may vary depending on your bank, payment provider, or financial institution.",
    ],
  },
  {
    icon: RefreshCcw,
    title: "7. Replacement Policy",
    content: [
      "A replacement may be offered for products verified to be damaged, defective, or incorrectly delivered.",
      "Replacement requests are subject to product availability.",
      "If the same product is unavailable, an appropriate refund may be offered instead.",
    ],
  },
  {
    icon: Package,
    title: "8. Returns and Product Condition",
    content: [
      "If a return is approved, customers must follow the return instructions provided by our support team.",
      "Where applicable, the product should be returned with its original packaging, accessories, and included items.",
      "Customers should not ship any product back before receiving return instructions from Royal Agate Export.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "9. Change of Mind and Non-Defective Products",
    content: [
      "Returns or refunds for change-of-mind reasons, personal preferences, or situations where the product is not defective are not automatically accepted.",
      "Such requests may be considered only with prior approval from Royal Agate Export.",
      "For approved change-of-mind returns, the customer will generally be responsible for the return shipping cost.",
      "This policy does not limit any rights available to customers under applicable consumer protection laws.",
    ],
  },
  {
    icon: Truck,
    title: "10. Return Shipping Responsibility",
    content: [
      "For approved change-of-mind returns, the customer is responsible for the return shipping cost.",
      "For products verified to be damaged, defective, or incorrectly delivered, Royal Agate Export will bear the return shipping responsibility.",
      "Customers should contact our support team before arranging any return shipment.",
    ],
  },
  {
    icon: Package,
    title: "11. International Orders",
    content: [
      "International orders are subject to destination-country regulations, shipping availability, and applicable customs requirements.",
      "Customers with international orders should contact our support team for assistance with cancellation, return, or refund requests.",
      "Any applicable customs duties, import taxes, or other charges will be handled in accordance with the relevant shipping and destination-country requirements.",
    ],
  },
  {
    icon: MessageCircle,
    title: "12. Refund Communication and Support",
    content: [
      "Our support team may contact customers through email or WhatsApp to verify order details, request supporting evidence, and communicate the status of a cancellation, return, or refund request.",
      "Please ensure that the contact information provided with your order is accurate.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "13. Policy Updates",
    content: [
      "Royal Agate Export reserves the right to update or modify this policy when necessary.",
      "Any changes will be published on this page. Customers are encouraged to review this policy periodically.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="bg-[#F7F4EE] min-h-screen">
      {/* Hero */}
      <section className="bg-[#18352B] text-[#F7F4EE] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#A98250] uppercase tracking-[0.3em] text-xs font-medium mb-5">
            Royal Agate Export
          </p>

          <h1 className="font-serif text-4xl md:text-6xl mb-6">
            Refund & Cancellation Policy
          </h1>

          <p className="text-[#D8D5CC] text-sm md:text-base max-w-2xl mx-auto leading-7">
            Clear and transparent information about order cancellations,
            product returns, replacements, and refunds.
          </p>

          <div className="w-16 h-px bg-[#A98250] mx-auto mt-8" />

          <p className="text-[#C8C3B8] text-xs mt-5 tracking-wide">
            Last Updated: 12 November 2026
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="max-w-4xl mx-auto px-6 pt-14 pb-6">
        <div className="bg-white border border-[#DED7CA] p-6 md:p-8 rounded-sm">
          <div className="flex items-start gap-4">
            <div className="bg-[#18352B] p-3 rounded-sm shrink-0">
              <ShieldCheck className="text-[#A98250]" size={23} />
            </div>

            <div>
              <h2 className="font-serif text-xl text-[#18352B] mb-2">
                Our Commitment
              </h2>

              <p className="text-[#77756F] text-sm leading-7">
                We aim to provide a smooth and transparent shopping
                experience. If something goes wrong with your order,
                our team is here to help you find an appropriate solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Sections */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-5">
          {sections.map((section, index) => {
            const Icon = section.icon;

            return (
              <article
                key={index}
                className="bg-white border border-[#DED7CA] p-6 md:p-8 rounded-sm"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="bg-[#18352B] p-3 rounded-sm shrink-0">
                    <Icon className="text-[#A98250]" size={21} />
                  </div>

                  <h2 className="font-serif text-xl md:text-2xl text-[#18352B]">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {section.content.map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      className="text-[#77756F] text-sm leading-7"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="space-y-2 pl-5">
                      {section.list.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-[#77756F] text-sm leading-7 list-disc marker:text-[#A98250]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.footer && (
                    <p className="text-[#77756F] text-sm leading-7">
                      {section.footer}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-4xl mx-auto px-6 pt-4 pb-16">
        <div className="bg-[#18352B] text-[#F7F4EE] p-8 md:p-10 rounded-sm">
          <p className="text-[#A98250] uppercase tracking-[0.25em] text-xs mb-4">
            Need Assistance?
          </p>

          <h2 className="font-serif text-3xl mb-4">
            Contact Our Support Team
          </h2>

          <p className="text-[#D8D5CC] text-sm leading-7 mb-8 max-w-2xl">
            If you have questions about cancellations, returns,
            replacements, or refunds, please get in touch with us.
            We will be happy to assist you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:royalagateexport00@gmail.com"
              className="inline-flex items-center justify-center gap-3 border border-[#A98250] px-5 py-3 text-sm hover:bg-[#A98250] hover:text-[#18352B] transition-colors"
            >
              <Mail size={17} />
              Email Us
            </a>

            <a
              href="https://wa.me/917777905258"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#A98250] text-[#18352B] px-5 py-3 text-sm hover:bg-[#C19A67] transition-colors"
            >
              <MessageCircle size={17} />
              WhatsApp Support
            </a>
          </div>

          <div className="border-t border-[#FFFFFF]/15 mt-8 pt-6">
            <p className="text-[#D8D5CC] text-sm">
              Email: royalagateexport00@gmail.com
            </p>
            <p className="text-[#D8D5CC] text-sm mt-2">
              WhatsApp: +91 77779 05258
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}