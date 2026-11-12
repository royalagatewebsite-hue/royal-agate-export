import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Gem } from "lucide-react";
import { submitContactInquiry } from "../../services/contactService";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    try {
      setLoading(true);

      await submitContactInquiry(form);

      setSuccess(
        "Thank you for contacting Royal Agate. Your inquiry has been submitted successfully."
      );

      setForm(initialForm);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-[#DED7CA] bg-white px-4 py-3 text-sm text-[#18352B] outline-none transition focus:border-[#A98250]";

  return (
    <div className="min-h-screen bg-[#F7F4EE]">

      {/* Hero */}
      <section className="border-b border-[#DED7CA] px-5 py-20 text-center md:py-28">
        <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-[#A98250]">
          Royal Agate Export
        </p>

        <h1 className="font-serif text-5xl text-[#18352B] md:text-7xl">
          Get in Touch
        </h1>

        <div className="mx-auto mb-6 mt-7 h-px w-16 bg-[#A98250]" />

        <p className="mx-auto max-w-xl text-sm leading-7 text-[#77756F] md:text-base">
          Have a question about our natural gemstones, handcrafted
          jewellery or wholesale collections? We'd love to hear from you.
        </p>
      </section>

      {/* Contact Content */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20 md:py-24">

        {/* Introduction */}
        <div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center border border-[#A98250] text-[#A98250]">
            <Gem size={27} strokeWidth={1.3} />
          </div>

          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#A98250]">
            Let's Connect
          </p>

          <h2 className="mb-6 font-serif text-4xl leading-tight text-[#18352B] md:text-5xl">
            Every great creation begins with a conversation.
          </h2>

          <p className="text-sm leading-8 text-[#77756F]">
            Whether you are exploring our collections, looking for
            wholesale opportunities or simply want to learn more about
            our craftsmanship, send us a message.
          </p>

          <div className="mt-10 border-t border-[#DED7CA] pt-6">
            <p className="font-serif text-xl text-[#18352B]">
              Royal Agate Export
            </p>

            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A98250]">
              Nature's Artistry. Crafted to Last.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="border border-[#DED7CA] bg-white p-6 md:p-10">

          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#A98250]">
            Send an Enquiry
          </p>

          <h2 className="mb-8 font-serif text-3xl text-[#18352B]">
            We'd love to hear from you.
          </h2>

          {success && (
            <div className="mb-6 flex gap-3 border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 size={20} className="shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-xs text-[#77756F]">
                  Full Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={inputClass}
                  required
                  maxLength={150}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-[#77756F]">
                  Email Address *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={inputClass}
                  required
                />
              </div>

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-xs text-[#77756F]">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-[#77756F]">
                  Subject *
                </label>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className={inputClass}
                  required
                  maxLength={200}
                />
              </div>

            </div>

            <div>
              <label className="mb-2 block text-xs text-[#77756F]">
                Your Message *
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your enquiry..."
                rows={6}
                className={`${inputClass} resize-none`}
                required
                maxLength={2000}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 bg-[#18352B] px-7 py-4 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[#A98250] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {loading ? "Submitting..." : "Send Message"}
              {!loading && <Send size={15} />}
            </button>

          </form>
        </div>

      </section>
    </div>
  );
}