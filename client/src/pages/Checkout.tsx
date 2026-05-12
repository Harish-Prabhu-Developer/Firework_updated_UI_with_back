import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Home,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Sparkles,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import headerBg from "@/assets/header_contact_bg.png";
import rockets from "@/assets/rockets.jpg"; // For fallback
import { API_BASE_URL } from "@/services/api";
import axios from "axios";

interface CartItem {
  id: string;
  name: string;
  content: string;
  qty: number;
  discPrice: number;
  img: string;
}

interface CheckoutRouteState {
  cartItems?: CartItem[];
  totals?: {
    totalQty?: number;
    totalAmount?: number;
  };
  totalAmount?: number;
  subTotal?: number;
}

declare global {
  interface Window {
    confetti?: (options?: Record<string, unknown>) => void;
  }
}

const MIN_ENQUIRY_AMOUNT = 3000;
const formatCurrency = (value: number) => `\u20B9${Math.max(0, value).toLocaleString("en-IN")}`;
const cleanPhoneInput = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const formatPhoneDisplay = (value: string) => {
  const cleaned = cleanPhoneInput(value);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getImageUrl = (img?: string) => {
    if (!img) return rockets;
    if (img.startsWith("http")) return img;
    return `${API_BASE_URL}/${img.replace(/\\/g, '/')}`;
  };

  const routeState = (location.state as CheckoutRouteState) || {};
  const initialCartItems = Array.isArray(routeState.cartItems) ? routeState.cartItems : [];
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(initialCartItems);

  const savedEstimate = useMemo(() => {
    return null;
  }, []);

  const fallbackLines = useMemo(() => {
    if (!savedEstimate || typeof savedEstimate.items !== "string") return [];
    return savedEstimate.items.split("\n").map((line: string) => line.trim()).filter(Boolean);
  }, [savedEstimate]);

  const fallbackTotal = typeof savedEstimate?.total === "number" ? savedEstimate.total : 0;
  const routeTotalQty = routeState.totals?.totalQty ?? savedEstimate?.count ?? 0;
  const routeTotalAmount = routeState.totalAmount ?? routeState.totals?.totalAmount ?? fallbackTotal;
  const routeSubTotal = routeState.subTotal ?? routeState.totals?.totalAmount ?? fallbackTotal;

  const liveTotalQty = checkoutItems.reduce((acc, item) => acc + (item.qty || 0), 0);
  const liveTotalAmount = checkoutItems.reduce((acc, item) => acc + (item.qty || 0) * item.discPrice, 0);
  const hasLiveCart = checkoutItems.length > 0;

  const totalQty = hasLiveCart ? liveTotalQty : routeTotalQty;
  const finalTotalAmount = hasLiveCart ? liveTotalAmount : routeTotalAmount;
  const finalSubTotal = hasLiveCart ? liveTotalAmount : routeSubTotal;

  const isBelowMinimum = finalTotalAmount < MIN_ENQUIRY_AMOUNT;
  const minimumShortfall = Math.max(0, MIN_ENQUIRY_AMOUNT - finalTotalAmount);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [placedTimestamp, setPlacedTimestamp] = useState("");
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const lastConfettiFiredAt = useRef(0);
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    name: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (window.confetti) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-confetti-loader="checkout"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
    script.async = true;
    script.defer = true;
    script.dataset.confettiLoader = "checkout";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (checkoutItems.length === 0 && fallbackLines.length === 0) {
      toast.error("Your estimate is empty. Please add products first.");
      navigate("/products");
    }
  }, [checkoutItems.length, fallbackLines.length, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: "" }));

    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: cleanPhoneInput(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQtyDelta = (id: string, delta: number) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const handleQtyInputChange = (id: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, parsed) } : item
      )
    );
  };

  const fireConfettiCannon = (retry = 0) => {
    const confetti = window.confetti;
    if (!confetti) {
      if (retry < 10) {
        window.setTimeout(() => fireConfettiCannon(retry + 1), 120);
      }
      return;
    }

    const now = Date.now();
    if (now - lastConfettiFiredAt.current < 900) return;
    lastConfettiFiredAt.current = now;

    const count = 500;
    const defaults = {
      origin: { y: 0.5, x: 0.5 },
      zIndex: 400,
      disableForReducedMotion: true,
    };

    const fire = (particleRatio: number, options: Record<string, unknown>) => {
      confetti({
        ...defaults,
        ...options,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.4,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (isBelowMinimum) {
      toast.error(
        `Minimum enquiry is ${formatCurrency(MIN_ENQUIRY_AMOUNT)}. Add ${formatCurrency(
          minimumShortfall
        )} more.`
      );
      return;
    }

    if (formData.phone.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (!isValidEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your full name.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Please enter your address.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (checkoutItems.length === 0 && fallbackLines.length === 0) {
      toast.error("No items found for checkout.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerData: {
          phone: formData.phone,
          email: formData.email.trim(),
          name: formData.name.trim(),
          address: formData.address.trim(),
        },
        items: checkoutItems.length > 0
          ? checkoutItems.map((item) => ({
            productId: item.id,
            productName: item.name,
            productContent: item.content,
            productImage: item.img,
            quantity: item.qty,
            unitPrice: item.discPrice,
            totalPrice: item.qty * item.discPrice,
          }))
          : fallbackLines,
        subTotal: finalSubTotal,
        totalAmount: finalTotalAmount,
        totalQty,
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/orders`, payload);

      if (!data.success) {
        throw new Error(data.message || "Failed to place order.");
      }

      const orderId = data.order?.orderNumber || "";
      setPlacedOrderNumber(orderId);
      toast.success(`Order ${orderId} placed successfully! 🎉`);
      setPlacedTimestamp(
        new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      );
      setIsSuccessDialogOpen(true);
      window.requestAnimationFrame(() => fireConfettiCannon());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Unable to place enquiry. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      <SEO
        title="Order Enquiry | Crackers Kingdom"
        description="Confirm your customer details and submit your fireworks enquiry. Our team will contact you within 2 hours."
      />
      <PageHeader
        title="Order Enquiry"
        subtitle="Fill customer details and place your enquiry"
        bgImage={headerBg}
      />

      <section className="section-padding py-10">
        <div className="container-narrow">
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Estimate
          </button>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden"
              >
                <div className="bg-primary p-6 text-white">
                  <h2 className="font-display text-2xl font-black flex items-center gap-2">
                    <User size={20} />
                    Customer Details
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    4 required fields: Phone, Email, Full Name, Address
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Phone Number <span className="text-festive-ruby">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formatPhoneDisplay(formData.phone)}
                        onChange={handleInputChange}
                        placeholder="Enter 10-digit mobile number"
                        className={`h-12 pl-11 bg-secondary/40 border-border focus-visible:ring-primary/30 ${errors.phone ? 'border-festive-ruby ring-1 ring-festive-ruby/20' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] font-bold text-festive-ruby mt-1 ml-1 uppercase tracking-wider animate-shake">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Email <span className="text-festive-ruby">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="example@email.com"
                        className={`h-12 pl-11 bg-secondary/40 border-border focus-visible:ring-primary/30 ${errors.email ? 'border-festive-ruby ring-1 ring-festive-ruby/20' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-festive-ruby mt-1 ml-1 uppercase tracking-wider animate-shake">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Full Name <span className="text-festive-ruby">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <Input
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className={`h-12 pl-11 bg-secondary/40 border-border focus-visible:ring-primary/30 ${errors.name ? 'border-festive-ruby ring-1 ring-festive-ruby/20' : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-festive-ruby mt-1 ml-1 uppercase tracking-wider animate-shake">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Address <span className="text-festive-ruby">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <MapPin className="w-4 h-4 text-muted-foreground absolute left-4 top-4" />
                      <Textarea
                        id="address"
                        name="address"
                        required
                        rows={4}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Door No, Area, City, District, State"
                        className={`pl-11 bg-secondary/40 border-border focus-visible:ring-primary/30 resize-none ${errors.address ? 'border-festive-ruby ring-1 ring-festive-ruby/20' : ''}`}
                      />
                    </div>
                    {errors.address && <p className="text-[10px] font-bold text-festive-ruby mt-1 ml-1 uppercase tracking-wider animate-shake">{errors.address}</p>}
                  </div>
                </form>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden lg:sticky lg:top-24"
              >
                <div className="p-6 border-b border-border/60">
                  <h3 className="font-display text-xl font-black flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    Estimate Summary
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{totalQty} items selected</p>
                </div>

                <div className="p-6 max-h-[360px] overflow-y-auto space-y-4">
                  {checkoutItems.length > 0 ? (
                    checkoutItems.map((item) => (
                      <div key={item.id} className="flex gap-4 border-b border-border/40 pb-5 last:border-0 last:pb-0">
                        {/* Image */}
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedImage({ url: getImageUrl(item.img), name: item.name })}
                          className="w-20 h-20 rounded-2xl overflow-hidden border border-border/60 bg-secondary/40 shrink-0 cursor-pointer"
                        >
                          <img src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover" />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          {/* Top Row: Name and Price */}
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="text-[13px] md:text-sm font-display font-black leading-snug text-foreground uppercase tracking-tight line-clamp-2">
                              {item.name}
                            </h4>
                            <p className="text-sm font-black text-primary whitespace-nowrap">
                              {formatCurrency(item.qty * item.discPrice)}
                            </p>
                          </div>

                          {/* Bottom Row: Controls */}
                          <div className="mt-2 flex items-center gap-1 rounded-xl border border-border/50 bg-secondary/30 p-1 w-fit">
                            <button
                              type="button"
                              onClick={() => handleQtyDelta(item.id, -1)}
                              className="h-8 w-8 rounded-lg bg-card text-festive-ruby hover:bg-festive-ruby/10 transition-colors flex items-center justify-center p-0"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => handleQtyInputChange(item.id, e.target.value)}
                              className="h-8 w-11 rounded-md border-0 bg-transparent text-center text-xs font-black text-foreground outline-none focus:ring-0"
                              aria-label={`Quantity for ${item.name}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyDelta(item.id, 1)}
                              className="h-8 w-8 rounded-lg bg-card text-festive-green hover:bg-festive-green/10 transition-colors flex items-center justify-center p-0"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      {fallbackLines.map((line, idx) => (
                        <p key={`${line}-${idx}`} className="text-sm text-muted-foreground leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-secondary/30 border-t border-border/60 space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Subtotal</span>
                    <span>{formatCurrency(finalSubTotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-foreground border-t border-dashed border-border pt-3">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(finalTotalAmount)}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Minimum Enquiry: {formatCurrency(MIN_ENQUIRY_AMOUNT)}
                  </p>
                  {isBelowMinimum && (
                    <p className="text-xs font-bold text-festive-ruby">
                      Add {formatCurrency(minimumShortfall)} more to place enquiry.
                    </p>
                  )}
                </div>

                <div className="hidden lg:block p-6 border-t border-border/60">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isBelowMinimum}
                    className="w-full h-12 rounded-xl font-black tracking-wide"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : isBelowMinimum ? (
                      <>Minimum {formatCurrency(MIN_ENQUIRY_AMOUNT)} Required</>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Place Enquiry
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground/70 text-center mt-3 uppercase tracking-widest font-bold">
                    Safe and secure enquiry
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 lg:hidden z-50 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
        <div className="section-padding py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Total</p>
            <p className="text-lg font-black text-primary">{formatCurrency(finalTotalAmount)}</p>
            {isBelowMinimum && (
              <p className="text-[10px] font-bold text-festive-ruby">
                Min {formatCurrency(MIN_ENQUIRY_AMOUNT)}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isBelowMinimum}
            className="h-11 rounded-xl font-black text-xs uppercase tracking-widest px-5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isBelowMinimum ? (
              <>Minimum Required</>
            ) : (
              <>
                Place Enquiry
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isSuccessDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-280 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 28 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card/95 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-linear(circle_at_top,rgba(212,175,55,0.26),transparent_62%)]" />
              <button
                type="button"
                onClick={() => setIsSuccessDialogOpen(false)}
                className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full bg-secondary/40 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close success dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.7, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.08 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/35 shadow-[0_0_45px_rgba(212,175,55,0.48)]"
                >
                  <CheckCircle className="w-10 h-10 text-primary" />
                </motion.div>

                <p className="text-center text-[10px] font-black uppercase tracking-[0.26em] text-primary/90">
                  Enquiry Confirmed
                </p>
                <h3 className="mt-2 text-center font-display text-3xl font-black text-foreground leading-tight">
                  Enquiry Placed Successfully
                </h3>
                <p className="mt-3 text-center text-sm md:text-base text-muted-foreground leading-relaxed">
                  Thanks for choosing Crackers Kingdom. Our team will contact you within 2 hours to
                  confirm your order details.
                </p>
                {placedOrderNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-5 w-full rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 via-primary/10 to-transparent overflow-hidden"
                  >
                    <div className="px-5 py-2 border-b border-primary/10 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">Enquiry Reference</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="px-5 py-4 flex flex-col text-center items-center gap-1">
                      <span className="font-bold text-2xl md:text-3xl text-primary text-center drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                        {placedOrderNumber}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                        Keep this ID for your records
                      </span>
                    </div>
                  </motion.div>
                )}
                {placedTimestamp && (
                  <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
                    Placed on: {placedTimestamp}
                  </p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl font-black"
                    onClick={() => {
                      setIsSuccessDialogOpen(false);
                      navigate("/products", { replace: true });
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Continue Shopping
                  </Button>
                  <Button
                    type="button"
                    className="h-11 flex-1 rounded-xl font-black"
                    onClick={() => {
                      setIsSuccessDialogOpen(false);
                      navigate("/", { replace: true });
                    }}
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal (Shared) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl relative max-w-2xl w-full p-4 md:p-8 flex flex-col items-center"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 md:top-4 md:right-4 p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-full aspect-square md:aspect-auto rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border/50">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full h-full max-h-[70vh] object-contain bg-card"
                />
              </div>
              <h3 className="mt-4 md:mt-6 text-lg md:text-2xl font-black text-foreground uppercase tracking-widest text-center">
                {selectedImage.name}
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
