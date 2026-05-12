import { Link } from "react-router-dom";
import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";
import { ADDRESS_LINES } from "@/lib/businessInfo";

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="max-w-[1400px] mx-auto section-padding py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2 lg:col-span-3">
            <div className="relative inline-flex w-fit mb-1">
              <div className="relative h-28 w-28 rounded-full p-[2px] overflow-visible bg-linear-to-br from-primary via-festive-gold to-primary animate-logo-glow transition-transform duration-300 hover:scale-[1.04]">
                <span className="pointer-events-none absolute -inset-1 rounded-full bg-primary/40 blur-sm opacity-70 animate-pulse [animation-duration:1.6s]" />
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.95)_70deg,transparent_145deg,rgba(255,214,102,0.95)_220deg,transparent_290deg,rgba(255,255,255,0.9)_360deg)] animate-spin [animation-duration:2.8s]" />
                <div className="relative z-10 h-full w-full rounded-full bg-footer/95 ring-1 ring-white/12 flex items-center justify-center overflow-hidden">
                  <img
                    src={logo}
                    alt="Crackers Kingdom"
                    className="h-full w-full rounded-full object-contain p-1"
                  />
                </div>
                <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full">
                  <span className="absolute top-[-14%] left-[-75%] h-[128%] w-[48%] bg-linear-to-r from-transparent via-white/95 to-transparent animate-[shine-sweep_2.1s_linear_infinite]" />
                </span>
              </div>
            </div>

            <div className="max-w-[240px] pt-5 text-left">
              <p className="text-sm leading-relaxed text-footer-foreground/75">
                Premium Sivakasi fireworks, sourced directly from trusted manufacturers and delivered safely across India.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              {[Facebook, Linkedin, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h4 className="font-display font-bold text-card mb-5">Explore</h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Home", to: "/" },
                { label: "Estimate", to: "/products" },
                { label: "About Us", to: "/about" },
                { label: "Safety Tips", to: "/safety" },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm hover:text-primary transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Reach Us */}
          <div className="lg:col-span-4 lg:pl-10">
            <h4 className="font-display font-bold text-card mb-5">Reach Us</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  {ADDRESS_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:crackerskingdom26@gmail.com"
                  className="flex items-start gap-2 text-sm hover:text-primary transition-colors group"
                >
                  <Mail size={15} className="text-primary shrink-0 mt-0.5" />
                  <p className="wrap-break-word leading-snug">crackerskingdom26@gmail.com</p>
                </a>

                <a
                  href="tel:+918144271571"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone size={15} className="text-festive-green shrink-0" />
                  <span>+91 81442 71571</span>
                </a>
              </div>

              <p className="text-xs font-bold text-card">GST IN :30239HHJ343HG393</p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="font-display font-bold text-primary mb-5">Legal Notice</h4>

            <div className="bg-card/5 border border-card/10 rounded-xl p-4 space-y-2">
              <p className="text-xs text-footer-foreground/75 text-justify indent-4 leading-relaxed">
                As per the <span className="text-card font-semibold">Supreme Court Order (2018)</span>,
                direct online sale of firecrackers is not permitted. This website is provided only for
                viewing products and submitting an estimate request.
              </p>

              <p className="text-xs text-footer-foreground/75 text-justify indent-4 leading-relaxed">
                Customers may select products and submit their request using the
                <span className="text-card font-semibold"> "Get Estimate"</span> option.
                Our team will contact you to confirm the order details.
              </p>

              <p className="text-xs text-footer-foreground/75 text-justify indent-4 leading-relaxed">
                We operate under the licensed entity
                <span className="text-card font-semibold"> M/S NANDHINI TRADERS, Survey No: 299/13A1C, 299/15A2 </span>
                and strictly follow all legal and safety regulations.
              </p>

              <p className="text-xs text-footer-foreground/75 text-justify indent-4 leading-relaxed">
                All orders are dispatched only through registered and legally authorized
                parcel transport services as per Sivakasi standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-card/10">
        <div className="max-w-[1400px] mx-auto section-padding py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs opacity-60">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-full p-px overflow-visible bg-linear-to-br from-primary via-festive-gold to-primary animate-logo-glow">
              <span className="pointer-events-none absolute -inset-[2px] rounded-full bg-primary/40 blur-xs opacity-70 animate-pulse [animation-duration:1.6s]" />
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.95)_70deg,transparent_145deg,rgba(255,214,102,0.95)_220deg,transparent_290deg,rgba(255,255,255,0.9)_360deg)] animate-spin [animation-duration:2.8s]" />
              <div className="relative z-10 h-full w-full rounded-full bg-footer/95 ring-1 ring-white/12 overflow-hidden">
                <img src={logo} alt="Crackers Kingdom" className="h-full w-full rounded-full object-contain p-px" />
              </div>
              <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full">
                <span className="absolute top-[-14%] left-[-75%] h-[128%] w-[48%] bg-linear-to-r from-transparent via-white/95 to-transparent animate-[shine-sweep_2.1s_linear_infinite]" />
              </span>
            </div>
            <span>
              Copyright (c) 2026 <strong>Crackers Kingdom</strong>. All rights reserved.
            </span>
          </div>

          <span>
            Designed by{" "}
            <a href="#" className="text-primary underline hover:opacity-80 transition-opacity">
              Harish Prabhu
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
