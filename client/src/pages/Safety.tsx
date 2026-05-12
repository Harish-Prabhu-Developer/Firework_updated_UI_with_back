import {
  ShieldCheck,
  AlertTriangle,
  Baby,
  Droplets,
  Wind,
  Eye,
  Phone,
  Flame,
  BicepsFlexed,
  CircleAlert,
  ThumbsUp,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import headerBg from "@/assets/header_safety_bg.png";

const tips = [
  {
    icon: ShieldCheck,
    title: "Buy Only Licensed Crackers",
    desc: "Always purchase fireworks from licensed sellers. Crackers Kingdom operates under M/S NANDHINI TRADERS and supplies certified Sivakasi crackers manufactured according to government safety standards.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: AlertTriangle,
    title: "Maintain Safe Distance",
    desc: "Keep at least 5 meters distance from lit fireworks. Never lean over a firework to inspect it after lighting, even if it seems not to ignite.",
    color: "bg-festive-ruby/10 text-festive-ruby",
  },
  {
    icon: Baby,
    title: "Adult Supervision for Children",
    desc: "Children should use crackers only under strict adult supervision. Even sparklers burn at extremely high temperatures and must be handled carefully.",
    color: "bg-festive-gold/10 text-festive-gold",
  },
  {
    icon: Droplets,
    title: "Keep Water Nearby",
    desc: "Always keep a bucket of water, sand, or fire extinguisher ready while bursting crackers. Used fireworks should be soaked in water before disposal.",
    color: "bg-festive-sapphire/10 text-festive-sapphire",
  },
  {
    icon: Wind,
    title: "Use Open Areas",
    desc: "Burst crackers only in open spaces away from buildings, vehicles, dry grass, and electrical wires. Ensure sparks blow away from people.",
    color: "bg-festive-green/10 text-festive-green",
  },
  {
    icon: Eye,
    title: "Wear Proper Clothing",
    desc: "Wear cotton clothing while handling fireworks. Avoid synthetic fabrics and protect your eyes while lighting aerial fireworks.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Flame,
    title: "Light One Firework at a Time",
    desc: "Always light fireworks individually and move back immediately. Never try lighting multiple crackers at once.",
    color: "bg-festive-ruby/10 text-festive-ruby",
  },
  {
    icon: BicepsFlexed,
    title: "Proper Storage",
    desc: "Store crackers in a cool and dry place away from sunlight, heat, and flames. Keep them sealed in their original packaging until use.",
    color: "bg-festive-gold/10 text-festive-gold",
  },
  {
    icon: Phone,
    title: "Know Emergency Contacts",
    desc: "Keep emergency numbers handy: Fire Service (101), Ambulance (108), Police (100). For burns, cool the affected area with water immediately.",
    color: "bg-accent/10 text-accent",
  },
];

const doNots = [
  "Never light fireworks indoors or inside enclosed areas.",
  "Never throw or point fireworks at people or animals.",
  "Never hold a lit firework in your hand.",
  "Never burst crackers under the influence of alcohol.",
  "Never tamper with fireworks or modify the fuse.",
  "Never dispose of fireworks without soaking them in water first.",
];

const safetyStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Fireworks Safety Tips and Guidelines",
  description:
    "Read essential fireworks safety tips from Crackers Kingdom. Follow safe handling guidelines for Diwali and all festive celebrations.",
  url: "https://crackerskingdom.in/safety",
  inLanguage: "en-IN",
};

const Safety = () => (
  <div>
    <SEO
      title="Fireworks Safety Tips and Guidelines"
      description="Read essential fireworks safety tips from Crackers Kingdom. Follow safe handling guidelines for Diwali and all festive celebrations."
      canonical="/safety"
      keywords="fireworks safety tips, diwali safety guide, safe crackers usage, fireworks precautions"
      ogImage="/og/safety-og.svg?v=2"
      structuredData={safetyStructuredData}
    />

    <PageHeader
      title="Safety Tips"
      subtitle="Celebrate responsibly with proper firework safety practices."
      bgImage={headerBg}
    />

    {/* Intro */}
    <section className="py-16 section-padding">
      <div className="container-narrow grid lg:grid-cols-3 gap-8 items-start">

        <ScrollReveal className="lg:col-span-2" direction="left">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Safety First
          </span>

          <h2 className="font-display text-3xl font-bold mt-2 text-balance">
            Celebrate Brightly
            <br />
            <span className="text-primary">Celebrate Safely</span>
          </h2>

          <p className="text-muted-foreground text-sm text-justify indent-4 leading-relaxed mt-4">
            At <strong>Crackers Kingdom</strong>, we believe celebrations should be joyful and safe.
            Fireworks add excitement to festivals like Diwali, weddings, and temple celebrations,
            but they must always be used responsibly.
          </p>

          <p className="text-muted-foreground text-justify indent-4 text-sm leading-relaxed mt-3">
            Our crackers are sourced from licensed Sivakasi manufacturers and supplied under the
            registered license <strong>M/S NANDHINI TRADERS, Survey No: 299/13A1C, 299/15A2</strong>.
            Please follow the safety guidelines below to ensure a safe celebration for you and your family.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="bg-foreground text-card rounded-2xl p-6 space-y-4">

            <div className="flex items-center gap-3">
              <CircleAlert size={22} className="text-festive-ruby shrink-0" />
              <h3 className="font-display font-bold">Legal Reminder</h3>
            </div>

            <p className="text-sm text-card/70 text-justify indent-4 leading-relaxed">
              As per the <strong className="text-primary">Supreme Court Order (2018)</strong>,
              online sale of firecrackers is not permitted. Customers may browse products and
              submit an estimate request through our website. Orders are confirmed by our team
              and dispatched through registered parcel transport services.
            </p>

            <Button
              asChild
              size="sm"
              className="rounded-full bg-primary gap-1.5 w-full"
              variant="outline"
            >
              <Link to="/about">Learn More About Our Process</Link>
            </Button>

          </div>
        </ScrollReveal>

      </div>
    </section>

    {/* Tips Grid */}
    <section className="py-8 pb-20 section-padding bg-secondary/50">
      <div className="container-narrow">

        <ScrollReveal className="text-center mb-12">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <BookOpen size={14} />
            Safety Guidelines
          </span>

          <h2 className="font-display text-3xl font-bold mt-2">
            Essential Safety Rules
          </h2>

          <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
            Follow these precautions to ensure a safe and responsible fireworks celebration.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((t, i) => (
            <ScrollReveal key={t.title} delay={i * 0.06}>
              <div className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">

                <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center mb-4`}>
                  <t.icon size={22} />
                </div>

                <h3 className="font-display font-bold text-lg mb-2">
                  {t.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.desc}
                </p>

              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    {/* Do Nots */}
    <section className="py-20 section-padding">
      <div className="container-narrow grid lg:grid-cols-2 gap-12 items-start">

        <ScrollReveal direction="left">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-festive-ruby/10 flex items-center justify-center">
              <AlertTriangle size={22} className="text-festive-ruby" />
            </div>

            <h2 className="font-display text-2xl font-bold">
              What NOT to Do
            </h2>
          </div>

          <div className="space-y-3">
            {doNots.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-festive-ruby/5 border border-festive-ruby/10 rounded-xl p-4"
              >
                <AlertTriangle
                  size={16}
                  className="text-festive-ruby mt-0.5 shrink-0"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

        </ScrollReveal>

        <ScrollReveal direction="right">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-festive-green/10 flex items-center justify-center">
              <ThumbsUp size={22} className="text-festive-green" />
            </div>

            <h2 className="font-display text-2xl font-bold">
              Best Practices
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Read Instructions",
                desc: "Always read the instructions printed on firework packaging before lighting.",
              },
              {
                title: "Supervise Children",
                desc: "Children must always be supervised by adults while handling sparklers or crackers.",
              },
              {
                title: "Inform Neighbors",
                desc: "Let neighbors know before bursting crackers, especially if they have pets or elderly family members.",
              },
              {
                title: "Follow Local Timing Rules",
                desc: "Respect local government timing regulations for bursting crackers.",
              },
              {
                title: "Dispose Safely",
                desc: "After use, soak spent fireworks in water before disposing them in waste bins.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-festive-green/5 border border-festive-green/10 rounded-xl p-4"
              >
                <BookOpen
                  size={16}
                  className="text-festive-green mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold mb-0.5">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </ScrollReveal>

      </div>
    </section>

    {/* CTA */}
    <section className="py-16 section-padding bg-primary">
      <div className="container-narrow text-center">

        <ScrollReveal>

          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Ready to Celebrate Safely?
          </h2>

          <p className="text-primary-foreground/80 mt-3 max-w-lg mx-auto text-sm">
            Explore our wide range of quality Sivakasi crackers and place your estimate request.
            Our team will contact you shortly to confirm the order.
          </p>

          <div className="flex gap-4 flex-wrap justify-center mt-8">

            <Button
              asChild
              size="lg"
              className="rounded-full gap-2 bg-white text-primary hover:bg-white/90 active:scale-[0.97] transition-transform"
            >
              <Link to="/products">Browse Products</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/90 bg-black/10 text-white hover:bg-black/10 active:scale-[0.97] transition-transform"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>

          </div>

        </ScrollReveal>

      </div>
    </section>
  </div>
);

export default Safety;
