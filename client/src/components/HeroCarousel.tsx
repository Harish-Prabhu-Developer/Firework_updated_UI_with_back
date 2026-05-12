import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Flower2,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import heroBanner from "@/assets/hero-banner.jpg";
import sparklers from "@/assets/sparklers.jpg";
import flowerPots from "@/assets/flower-pots.jpg";
import chakkars from "@/assets/chakkars.jpg";

const INTERVAL_MS = 3000;

interface Slide {
  image: string;
  badgeIcon: LucideIcon;
  badge: string;
  title: string;
  desc: string;
  cta: string;
  link: string;
}

const slides: Slide[] = [
  {
    image: heroBanner,
    badgeIcon: Sparkles,
    badge: "EXCLUSIVE DIWALI OFFERS — UP TO 40% OFF",
    title: "Grand Festive\nMega Sale",
    desc: "Crackers Kingdom — your ultimate nationwide destination for premium Sivakasi fireworks. Spectacular deals this festive season!",
    cta: "Get My Estimate",
    link: "/products",
  },
  {
    image: sparklers,
    badgeIcon: Zap,
    badge: "CLASSIC & COLORFUL",
    title: "Premium\nSparklers",
    desc: "Safe, colorful, and spectacularly bright sparklers for every family — perfect for Diwali, weddings, and festive moments.",
    cta: "Explore Sparklers",
    link: "/products",
  },
  {
    image: flowerPots,
    badgeIcon: Flower2,
    badge: "BLOOMING LIGHTS",
    title: "Stunning\nFlower Pots",
    desc: "Beautiful fountains of color that light up the sky with mesmerizing patterns. Order via our estimate form today!",
    cta: "View Collection",
    link: "/products",
  },
  {
    image: chakkars,
    badgeIcon: Flame,
    badge: "SPIN THE MAGIC",
    title: "Ground\nChakkars",
    desc: "Spinning wheels of vibrant colors and dazzling patterns. Submit your estimate — our team responds within 2 hours!",
    cta: "Shop Chakkars",
    link: "/products",
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      startTimer();
    },
    [current, startTimer]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
    startTimer();
  }, [startTimer]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative overflow-hidden h-[360px] sm:h-[480px] md:h-[560px] lg:h-[640px]">
      {/* ── Background image slide ── */}
      <AnimatePresence custom={direction} mode="sync">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient — stronger on mobile so text stays legible on smaller area */}
          <div className="absolute inset-0 bg-linear-to-r from-foreground/90 via-foreground/60 to-foreground/10 sm:from-foreground/80 sm:via-foreground/50 sm:to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="w-full px-5 sm:px-10 md:px-14 lg:px-20 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Badge — lucide icon replaces emoji */}
              <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-foreground text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-3 sm:mb-4 backdrop-blur-sm">
                <slide.badgeIcon size={11} className="shrink-0 sm:hidden" />
                <slide.badgeIcon size={13} className="shrink-0 hidden sm:block" />
                {slide.badge}
              </span>

              {/* Title — scales across all breakpoints */}
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-[1.1] max-w-[220px] sm:max-w-md lg:max-w-xl mb-2 sm:mb-3 whitespace-pre-line">
                {slide.title}
              </h1>

              {/* Description — truncated on mobile, full on sm+ */}
              <p className="text-card/80 text-xs sm:text-sm md:text-base max-w-[230px] sm:max-w-md mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {slide.desc}
              </p>

              {/* Buttons — sm size on mobile, lg on sm+ */}
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {/* Mobile */}
                <Button
                  asChild
                  size="sm"
                  className="sm:hidden rounded-full gap-1.5 text-[11px] shadow-lg shadow-primary/30 active:scale-[0.97] transition-transform"
                >
                  <Link to={slide.link}>
                    {slide.cta} <ArrowRight size={12} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="sm:hidden rounded-full text-[11px] bg-card/10 border-card/30 text-card hover:bg-card/20 hover:text-card active:scale-[0.97] transition-transform"
                >
                  <Link to="/contact">Contact Us</Link>
                </Button>

                {/* Desktop (sm+) */}
                <Button
                  asChild
                  size="lg"
                  className="hidden sm:inline-flex rounded-full gap-2 shadow-lg shadow-primary/30 active:scale-[0.97] transition-transform"
                >
                  <Link to={slide.link}>
                    {slide.cta} <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="hidden sm:inline-flex rounded-full bg-card/10 border-card/30 text-card hover:bg-card/20 hover:text-card active:scale-[0.97] transition-transform"
                >
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      <button
        onClick={prev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-card hover:bg-card/40 transition-colors active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft size={16} className="sm:hidden" />
        <ChevronLeft size={20} className="hidden sm:block" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-card hover:bg-card/40 transition-colors active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight size={16} className="sm:hidden" />
        <ChevronRight size={20} className="hidden sm:block" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 active:scale-95 ${i === current
                ? "w-5 sm:w-8 bg-primary"
                : "w-1.5 sm:w-2 bg-card/50 hover:bg-card/80"
              }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
