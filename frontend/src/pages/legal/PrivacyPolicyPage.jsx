import { Link } from "react-router-dom";
import { ShieldCheck, Mail, MessageCircle, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to Royal Agate Export.

We respect your privacy and are committed to protecting the personal information you share with us when using our website, browsing our collections, creating an account, placing an order, or contacting our team.

This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices available to you regarding your personal information.`,
  },
  {
    title: "2. Information We Collect",
    content: `We may collect the following categories of information when you interact with our website:

Personal Information:
• Full name.
• Email address.
• Phone number.
• Billing and shipping address.
• Account registration details.

Order Information:
• Products purchased.
• Order history.
• Delivery information.
• Order status and transaction-related details.

Customer Communication:
• Contact form submissions.
• Product enquiries.
• Customer support conversations, including WhatsApp communications.
• Reviews and feedback submitted through our website.

Technical Information:
Certain technical information may be processed through website infrastructure and security systems, such as browser information, device information, IP address, and basic usage data.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information collected for legitimate business and operational purposes, including:

• Creating and managing customer accounts.
• Processing and fulfilling orders.
• Coordinating shipping and delivery.
• Responding to customer enquiries.
• Providing order updates and customer support.
• Managing product reviews and feedback.
• Maintaining website functionality and security.
• Improving our products, services, and customer experience.
• Complying with applicable legal obligations.

We do not use customer personal information for unsolicited marketing or promotional communications.`,
  },
  {
    title: "4. Payments and Transaction Information",
    content: `When you place an order, relevant order and transaction information may be processed to facilitate payment and order fulfilment.

If third-party payment services are made available on our website, payment transactions will be subject to the applicable payment provider's terms and privacy policy.

We do not intend to store complete card numbers, CVV codes, or other sensitive payment credentials on our website servers.`,
  },
  {
    title: "5. Sharing of Information",
    content: `We may share relevant information with trusted third parties when necessary to operate our business and provide services.

These may include:

• Shipping and logistics partners for order delivery.
• Payment service providers for transaction processing.
• Website hosting and technology service providers.
• Service providers assisting with website operations and customer support.
• Government authorities or legal institutions when disclosure is required by applicable law.

We do not sell customers' personal information to third parties.`,
  },
  {
    title: "6. Data Security",
    content: `We take reasonable technical and organisational measures to protect personal information against unauthorised access, alteration, disclosure, or destruction.

However, no method of internet transmission or electronic storage can be guaranteed to be completely secure.

Customers are also responsible for maintaining the confidentiality of their account credentials.`,
  },
  {
    title: "7. Cookies and Website Technologies",
    content: `Our website may use essential cookies or similar technologies to support website functionality, maintain user sessions, and improve website performance.

We do not currently use Google Analytics or Meta Pixel for website tracking or advertising analytics.

You can manage cookie preferences through your browser settings. Disabling certain cookies may affect some website features.`,
  },
  {
    title: "8. Data Retention",
    content: `We retain personal information for as long as reasonably necessary to fulfil the purposes described in this Privacy Policy, provide our services, maintain business records, resolve disputes, and comply with applicable legal requirements.

When information is no longer required, it will be handled in accordance with applicable data protection and retention requirements.`,
  },
  {
    title: "9. Account Deletion and Privacy Rights",
    content: `Customers who wish to delete their accounts may submit a deletion request through our official business email or WhatsApp number.

Our team will review and process the request. Once verified, the account and associated personal information will be deleted where legally permissible.

Some information may need to be retained where required by applicable laws, financial recordkeeping obligations, or legitimate business requirements.

Subject to applicable laws, customers may also request access to their personal information, correction of inaccurate information, or deletion of personal information where applicable.`,
  },
  {
    title: "10. Customer Reviews and Public Information",
    content: `Customers may submit product reviews and feedback through our website.

Submitted reviews may be publicly displayed on the relevant product pages, including the review content, rating, and customer display name.

Customers should avoid including sensitive personal information in publicly visible reviews.`,
  },
  {
    title: "11. WhatsApp and Customer Support",
    content: `Customers may contact Royal Agate Export through WhatsApp for product enquiries, order-related assistance, and customer support.

Information shared through WhatsApp will be used to respond to customer requests and provide relevant assistance.

WhatsApp communications are also subject to WhatsApp's own privacy policy and terms of service.`,
  },
  {
    title: "12. Third-Party Websites",
    content: `Our website may contain links to third-party websites or services.

Royal Agate Export is not responsible for the privacy practices, content, or security of external websites. We encourage customers to review the privacy policies of those services before sharing personal information.`,
  },
  {
    title: "13. Changes to This Privacy Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our business operations, website functionality, or applicable legal requirements.

Any updated version will be published on this page with a revised Last Updated date.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EE]">
      {/* Header */}
      <section className="bg-[#18352B] px-6 py-20 text-center md:py-28">
        <ShieldCheck
          size={38}
          strokeWidth={1.3}
          className="mx-auto mb-6 text-[#C5A477]"
        />

        <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#C5A477]">
          Royal Agate Export
        </p>

        <h1 className="font-serif text-4xl text-[#F7F4EE] md:text-6xl">
          Privacy Policy
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#C3CEC6]">
          Your privacy matters to us. Learn how we collect, use, and protect
          your personal information.
        </p>

        <p className="mt-6 text-xs text-[#C5A477]">
          Last Updated: 12 November 2026
        </p>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
        <div className="mb-10 border-l-2 border-[#A98250] bg-white p-6 md:p-8">
          <p className="text-sm leading-7 text-[#77756F]">
            At Royal Agate Export, we value the trust you place in us. This
            policy explains our approach to handling your personal information
            when you interact with our website and services.
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
              14. Contact Us
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#77756F]">
              If you have questions, concerns, or requests regarding this
              Privacy Policy or the handling of your personal information,
              please contact Royal Agate Export through our official contact
              channels.
            </p>

            <div className="mt-8 space-y-5">
              <a
                href="mailto:royalagateexport00@gmail.com"
                className="flex items-center gap-4 text-sm text-[#18352B] transition hover:text-[#A98250]"
              >
                <Mail className="text-[#A98250]" size={20} />
                royalagateexport00@gmail.com
              </a>

              <a
                href="https://wa.me/917777905258"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-sm text-[#18352B] transition hover:text-[#A98250]"
              >
                <MessageCircle className="text-[#A98250]" size={20} />
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

        {/* Back Link */}
        <div className="mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#18352B] transition hover:text-[#A98250]"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}