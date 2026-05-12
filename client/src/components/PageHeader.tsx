import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  bgImage?: string;
}

const routeLabels: Record<string, string> = {
  "/products": "Estimate",
  "/about": "About Us",
  "/contact": "Contact",
  "/safety": "Safety Tips",
};

const PageHeader = ({ title, subtitle, bgImage }: PageHeaderProps) => {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || title;

  return (
    <section className="relative h-[250px] md:h-[300px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      {bgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-110"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/60" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full container-narrow section-padding text-center">
        <ScrollReveal>
          <h1 className="font-display text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg uppercase italic">
            {title}
          </h1>
          <div className="w-20 h-1.5 bg-primary rounded-full mx-auto mt-4 shadow-lg" />
          {subtitle && (
            <p className="text-white/90 text-sm md:text-base mt-4 max-w-xl mx-auto font-medium drop-shadow-sm line-clamp-2 italic">
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <nav className="flex items-center justify-center gap-2 mt-8 py-2 px-4 bg-black/30 backdrop-blur-md rounded-full w-fit mx-auto border border-white/10 shadow-xl transition-all hover:bg-black/40">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-white/80 hover:text-primary transition-colors font-semibold"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-primary font-bold uppercase tracking-widest text-xs">{currentLabel}</span>
          </nav>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PageHeader;
