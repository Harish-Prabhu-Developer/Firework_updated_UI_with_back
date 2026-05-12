import {
  BadgeCheck,
  Eye,
  Globe,
  Heart,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import headerBg from "@/assets/header_about_bg.png";

const milestones = [
  {
    year: "2025",
    event: "Founded",
    desc: "Crackers Kingdom officially launched in Sivakasi, Tamil Nadu, with a mission to bring premium fireworks to every corner of India.",
  },
  {
    year: "2025",
    event: "First Batch",
    desc: "Successfully fulfilled our first 100+ customer orders across multiple states, establishing our nationwide parcel delivery network.",
  },
  {
    year: "2025",
    event: "Diwali Season",
    desc: "Launched exclusive Diwali offers with up to 40% off on bulk orders - our biggest festive campaign to date.",
  },
  {
    year: "2026",
    event: "Growing Strong",
    desc: "Expanding our product catalog, improving our 2-hour response guarantee, and serving customers across all major metros.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Safety First",
    desc: (
      <>
        Every product we sell complies with government safety standards. We operate under a valid license -
        <strong className="text-foreground"> M/S NANDHINI TRADERS, Survey No: 299/13A1C, 299/15A2 </strong> - and strictly follow all Supreme Court guidelines on firework sales.
      </>
    ),
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BadgeCheck,
    title: "Certified Quality",
    desc: "Our fireworks are sourced directly from reputed Sivakasi manufacturers with proven quality records. Every batch is checked for safety and performance.",
    color: "bg-festive-green/10 text-festive-green",
  },
  {
    icon: Heart,
    title: "Customer First",
    desc: '"Once our customer, always our customer." We respond within 2 hours for every estimate submitted, ensuring a smooth and personal experience.',
    color: "bg-festive-ruby/10 text-festive-ruby",
  },
  {
    icon: Globe,
    title: "Nationwide Reach",
    desc: "Though we are based in Sivakasi, we serve customers across India through our registered parcel transport network - bringing celebrations to you.",
    color: "bg-festive-sapphire/10 text-festive-sapphire",
  },
  {
    icon: Truck,
    title: "Legal Transport",
    desc: "We exclusively dispatch through government-registered parcel services as per Sivakasi standards. Customers collect at their nearest parcel center.",
    color: "bg-festive-gold/10 text-festive-gold",
  },
  {
    icon: Sparkles,
    title: "Festive Innovation",
    desc: "We constantly update our catalog with fresh collections - from classic ground crackers to modern multi-shot aerials - for every taste and budget.",
    color: "bg-accent/10 text-accent",
  },
];

const legalTickerItems = [
  "Legal Commitment",
  "Estimate-Only Fireworks Enquiry Platform",
  "Supreme Court 2018 Guideline Compliant",
  "No Direct Online Firecracker Sales",
  "Licensed M/S NANDHINI TRADERS",
  "Registered Parcel Dispatch Across India",
  "Explosives Act Compliant Operations",
];

const aboutStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Crackers Kingdom",
  description:
    "Learn about Crackers Kingdom, our Sivakasi roots, licensed operations, safety-first values, and commitment to legal fireworks dispatch across India.",
  url: "https://crackerskingdom.in/about",
  inLanguage: "en-IN",
};

const About = () => {
  return (
    <div>
      <SEO
        title="About Crackers Kingdom | Sivakasi Fireworks Brand Story"
        description="Learn about Crackers Kingdom, our Sivakasi roots, licensed operations, safety-first values, and commitment to legal fireworks dispatch across India."
        canonical="/about"
        keywords="about crackers kingdom, sivakasi fireworks shop, licensed fireworks seller, legal fireworks dispatch"
        ogImage="/og/about-og.svg?v=2"
        structuredData={aboutStructuredData}
      />
      <PageHeader
        title="About Us"
        subtitle="Born from a passion for celebrations - here is our story."
        bgImage={headerBg}
      />

      {/* Story Section */}
      <section className="py-20 section-padding overflow-hidden">
        <div className="container-narrow grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* LEFT IMAGE */}
          <ScrollReveal direction="left" className="relative pr-6 pb-6 lg:pr-0 lg:pb-0">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-4xl blur-2xl -z-10" />

              <div className="relative overflow-hidden rounded-2xl shadow-2xl border bg-muted/20">
                <img
                  src="https://placehold.co/800x600?text=Crackers+Kingdom+Shop"
                  alt="Crackers Kingdom Shop"
                  className="w-full h-[400px] object-cover hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
              </div>

              <div className="absolute -bottom-8 -right-4 sm:-right-8 bg-background/95 backdrop-blur-md shadow-xl rounded-2xl p-6 text-center border border-border/50 min-w-[180px] group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <Heart className="text-primary w-6 h-6" />
                </div>
                <p className="text-3xl font-display font-black text-primary tracking-tight">250+</p>
                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                  Happy Customers
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* RIGHT CONTENT */}
          <ScrollReveal direction="right" className="lg:pl-8 pt-8 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" /> Trusted Sivakasi Fireworks
            </div>

            <h2 className="font-display text-4xl lg:text-5xl font-extrabold leading-[1.15] text-balance mb-6">
              Discover the World of <br className="hidden lg:block" />
              <span className="text-primary bg-clip-text bg-linear-to-r from-primary to-destructive">Crackers Kingdom</span>
            </h2>

            <div className="space-y-4">
              <p className="text-muted-foreground text-[15px] text-justify indent-4 leading-[1.8]">
                Welcome to <strong className="text-foreground">Crackers Kingdom</strong>, your trusted source for premium Sivakasi firecrackers. Located in Sivakasi - the heart of India&apos;s fireworks industry - we bring customers a carefully selected range of high-quality crackers that make every celebration vibrant and memorable.
              </p>

              <p className="text-muted-foreground text-[15px] text-justify indent-4 leading-[1.8]">
                Our collection includes sparklers, flower pots, ground chakkars, rockets, aerial shots, kids&apos; crackers, and festive gift boxes. Every product is safely selected with a focus on strict safety protocols, superior quality, and unparalleled excitement for every celebration.
              </p>

              <p className="text-muted-foreground text-[15px] text-justify indent-4 leading-[1.8]">
                Whether it is Diwali, weddings, birthdays, temple festivals, or corporate events, our estimate system helps you choose the right crackers while staying within your budget.
              </p>

              <p className="text-muted-foreground text-[15px] text-justify indent-4 leading-[1.8]">
                In strict accordance with legal guidelines, this digital platform is used exclusively for enquiry and estimate purposes. All valid orders are confirmed after direct communication and dispatched through registered legal parcel transport services across India.
              </p>
            </div>

            <blockquote className="mt-8 relative p-6 bg-secondary/40 rounded-r-2xl border-l-4 border-primary hover:shadow-sm transition-shadow">
              <div className="absolute top-4 left-3 text-primary/20">
                <Quote className="w-8 h-8" />
              </div>
              <p className="relative z-10 text-[15px] text-foreground font-semibold italic pl-8 leading-relaxed">
                Lighting up celebrations safely across India with authentic, verified Sivakasi fireworks.
              </p>
            </blockquote>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Button asChild size="lg" className="rounded-full h-12 px-8 font-bold tracking-wide shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
                <Link to="/products">Explore Crackers</Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8 font-bold tracking-wide border-2 hover:bg-secondary transition-all">
                <Link to="/contact">Get Estimate</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 section-padding bg-secondary/50">
        <div className="container-narrow">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest">
              <BadgeCheck className="w-3.5 h-3.5" />
              What We Stand For
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Our Core Values</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
              Every decision we make is guided by these principles - from sourcing our products to delivering them to you.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 0.08}>
                <div className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full border border-border/60">
                  <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mb-4`}>
                    <v.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-20 section-padding">
        <div className="container-narrow">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5" />
              Our Journey
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">How We Got Here</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
              Every great journey begins with a single spark. Here is ours.
            </p>
          </ScrollReveal>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <ScrollReveal key={m.event} delay={i * 0.1}>
                  <div className="sm:pl-16 relative">
                    <div className="hidden sm:flex absolute left-0 top-1 w-12 h-12 rounded-full bg-primary text-primary-foreground items-center justify-center font-display font-bold text-xs z-10 shadow-lg shadow-primary/30">
                      {m.year.slice(2)}
                    </div>
                    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{m.year}</span>
                        <h3 className="font-display font-bold text-lg">{m.event}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 section-padding bg-secondary/50">
        <div className="container-narrow grid md:grid-cols-2 gap-8">
          <ScrollReveal delay={0}>
            <div className="bg-card rounded-2xl p-8 shadow-sm h-full hover:shadow-md transition-shadow duration-300 border border-border/60">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye size={24} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Our Vision</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To become India&apos;s most trusted online fireworks destination - where every customer can safely and legally access premium Sivakasi fireworks for any celebration. Our motto: <strong className="text-primary">Our Customer&apos;s Joy is Our Pride.</strong>
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="bg-card rounded-2xl p-8 shadow-sm h-full hover:shadow-md transition-shadow duration-300 border border-border/60">
              <div className="w-12 h-12 rounded-xl bg-festive-green/10 flex items-center justify-center mb-4">
                <Target size={24} className="text-festive-green" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To connect celebration-lovers across India with the finest Sivakasi fireworks through a transparent, legal, and reliable process. We organize every order with care, communicate within 2 hours, and dispatch through certified transport so your festive moments are always bright.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Legal Commitment */}
      <section className="py-12 overflow-hidden">
        <ScrollReveal>
          <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-primary/40 bg-primary shadow-[0_10px_26px_hsl(var(--primary)/0.35)]">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-primary via-primary/85 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-primary via-primary/85 to-transparent" />

            <div className="animate-marquee flex w-max min-w-full items-center whitespace-nowrap py-4 [animation-duration:26s] hover:[animation-play-state:paused]">
              {[0, 1].map((copy) => (
                <div key={`legal-line-${copy}`} className="flex shrink-0 items-center gap-10 px-8">
                  {legalTickerItems.map((item) => (
                    <span
                      key={`legal-ticker-${copy}-${item}`}
                      className="inline-flex items-center gap-3 text-sm md:text-base font-black uppercase tracking-[0.08em] text-foreground"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default About;

