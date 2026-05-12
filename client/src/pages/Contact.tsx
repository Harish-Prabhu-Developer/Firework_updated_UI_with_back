import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ArrowRight,
  Truck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ScrollReveal from "@/components/ScrollReveal";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import headerBg from "@/assets/header_contact_bg.png";
import { toast } from "react-hot-toast";
import { ADDRESS_LINES } from "@/lib/businessInfo";

const contactCards = [
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+91 81442 71571", "+91 950 021 1527"],
    note: "Mon – Sat: 9 AM to 9 PM",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["crackerskingdom26@gmail.com"],
    note: "We reply within a few hours",
    color: "text-festive-ruby",
    bg: "bg-festive-ruby/10",
  },
  {
    icon: MapPin,
    title: "Our Address",
    lines: [...ADDRESS_LINES],
    note: "Fireworks Capital of India",
    color: "text-festive-green",
    bg: "bg-festive-green/10",
  },
];

const howItWorks = [
  {
    icon: MessageSquare,
    title: "Submit Your Estimate",
    desc: "Go to our Estimate page, select your products and quantities, then submit the form.",
  },
  {
    icon: Phone,
    title: "We Contact You (Within 2 Hrs)",
    desc: "Our team will call or WhatsApp you within 2 hours to confirm your order details.",
  },
  {
    icon: Truck,
    title: "Parcel Dispatch",
    desc: "We dispatch your order via registered legal transport. No doorstep delivery — collect at your nearest parcel center.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Legal",
    desc: "Every transaction is 100% compliant with Supreme Court guidelines and handled with full transparency.",
  },
];

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Crackers Kingdom",
  description:
    "Contact Crackers Kingdom for estimate support, bulk order enquiries, and parcel dispatch assistance. Based in Sivakasi, serving customers across India.",
  url: "https://crackerskingdom.in/contact",
  inLanguage: "en-IN",
  mainEntity: {
    "@type": "Organization",
    name: "Crackers Kingdom",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91 81442 71571",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Tamil"],
      },
    ],
  },
};

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please fill in your name and message.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message submitted! Our team will contact you within 2 hours.");
      setForm({ name: "", phone: "", subject: "", message: "" });
    }, 1200);
  };

  return (
    <div>
      <SEO
        title="Contact Crackers Kingdom | Fireworks Enquiry and Bulk Orders"
        description="Contact Crackers Kingdom for estimate support, bulk order enquiries, and parcel dispatch assistance. Based in Sivakasi, serving customers across India."
        canonical="/contact"
        keywords="contact crackers kingdom, fireworks enquiry, bulk crackers order, sivakasi fireworks contact"
        ogImage="/og/contact-og.svg?v=2"
        structuredData={contactStructuredData}
      />
      <PageHeader
        title="Get in Touch"
        subtitle="Questions about our products? Ready to order? We're here to help — and we respond within 2 hours!"
        bgImage={headerBg}
      />

      {/* Contact Cards */}
      <section className="section-padding py-12">
        <div className="container-narrow grid sm:grid-cols-3 gap-4">
          {contactCards.map((c, i) => (
            <ScrollReveal key={c.title} delay={i * 0.08}>
              <div className="bg-card rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center">
                <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-4`}>
                  <c.icon size={24} className={c.color} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{c.title}</h3>
                {c.lines.map((l) => (
                  <p key={l} className="text-sm text-muted-foreground">{l}</p>
                ))}
                <p className="text-xs text-muted-foreground/60 mt-2 italic">{c.note}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Form & Details */}
      <section className="py-8 section-padding">
        <div className="container-narrow grid lg:grid-cols-2 gap-10">
          <ScrollReveal direction="left">
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="font-display text-2xl font-bold">Send Us a Message</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Fill in the form below and our team will get back to you within 2 hours. For bulk orders or Diwali estimates, use our{" "}
                <a href="/products" className="text-primary font-medium hover:underline">Estimate Form</a> instead.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your Name *</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your name"
                      maxLength={100}
                      className="focus:ring-2 focus:ring-primary/20 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Your phone / WhatsApp"
                      maxLength={15}
                      className="focus:ring-2 focus:ring-primary/20 transition-shadow"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subject</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="E.g. Bulk Order Enquiry, Diwali Offer, etc."
                    maxLength={200}
                    className="focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Message *</label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here — e.g. the products you're interested in, the city where you want to collect, your preferred date, etc."
                    rows={5}
                    maxLength={1000}
                    className="focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full gap-2 active:scale-[0.97] transition-transform"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold">Other Information</h2>

              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-display font-bold mb-1">Working Hours</h4>
                    <p className="text-sm text-muted-foreground">Mon – Sat: 9:00 AM to 9:00 PM</p>
                    <p className="text-sm text-muted-foreground">Sunday: 10:00 AM to 6:00 PM</p>
                    <p className="text-xs text-muted-foreground/60 mt-2 italic">Extended hours during Diwali season</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="text-festive-gold mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-display font-bold mb-1">2-Hour Response Guarantee</h4>
                    <p className="text-sm text-muted-foreground">
                      After you submit an estimate or message us, our team will contact you within 2 hours (during working hours) to confirm your order, pricing, and nearest parcel center details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <Truck size={20} className="text-festive-green mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-display font-bold mb-1">How We Ship</h4>
                    <p className="text-sm text-muted-foreground">
                      We dispatch via registered legal transport services from Sivakasi. As per regulations, there is no doorstep delivery — you collect your order at the nearest parcel center in your city. We'll share the tracking details on confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <MessageSquare size={20} className="text-festive-ruby mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-display font-bold mb-1">For Bulk & Wholesale Enquiries</h4>
                    <p className="text-sm text-muted-foreground">
                      Interested in bulk ordering for events, retailers, or community celebrations? Mention "Bulk Order" in your subject line. We offer attractive volume discounts and customized bundles for large orders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 section-padding bg-secondary/50">
        <div className="container-narrow">
          <ScrollReveal className="text-center mb-10">
            <span className="text-primary text-xs font-semibold uppercase tracking-widest">🚀 Simple Steps</span>
            <h2 className="font-display text-3xl font-bold mt-2">How Does Ordering Work?</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
              Our ordering process is transparent, safe, and fully compliant with legal regulations.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((h, i) => (
              <ScrollReveal key={h.title} delay={i * 0.1}>
                <div className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <h.icon size={22} className="text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">STEP {String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-display font-bold mb-2">{h.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal className="text-center mt-10">
            <Button asChild size="lg" className="rounded-full gap-2 active:scale-[0.97] transition-transform">
              <a href="/products">Start My Estimate <ArrowRight size={16} /></a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Google Map */}
      <section className="section-padding pb-20">
        <div className="container-narrow">
          <ScrollReveal>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Find Us on the Map</h2>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md border border-border/50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31574.94697684!2d77.7796!3d9.4533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06cec5a0f5d0a1%3A0x91e20c52d2f5c0e4!2sSivakasi%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Crackers Kingdom Location - M/S Nandhini Traders, Viswanatham, Sivakasi"
                className="w-full"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Contact;

