import React, { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { setQuantity, updateQuantity } from "@/redux/Slice/CartSlice";
import { Product } from "@/types/product";
import { API_BASE_URL } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  ChevronDown,
  X,
  Loader2,
  List,
  Table as TableIcon,
  Plus,
  Minus,
  Send,
  ServerCrash,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import LegalDialog from "@/components/LegalDialog";
import headerBg from "@/assets/header_estimate_bg.png";
import heroBanner from "@/assets/hero-banner.jpg";
import rockets from "@/assets/rockets.jpg";
import { useProducts } from "@/hooks/useProducts";

// -- Helpers ------------------------------------------------------------
const MIN_ORDER_AMOUNT = 3000;
const formatCurrency = (n: number) =>
  `₹${n.toLocaleString("en-IN")}`;

const productsStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Fireworks Price List and Estimate Form",
  description:
    "Browse our Sivakasi fireworks price list, add quantities, and submit your estimate form online. Get a confirmation call within 2 hours.",
  url: "https://crackerskingdom.in/products",
  inLanguage: "en-IN",
};

// -- Component ----------------------------------------------------------
const Products = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  const dispatch = useAppDispatch();

  // Quantities remain in Redux as part of the Global UI State (Cart)
  const quantities = useAppSelector((state) => state.cart.quantities);

  // TanStack Query hook handles fetching, caching, and Redux sync
  // It returns data (cached/synced) immediately for "Very Quick Render"
  const { categories, isLoading, error } = useProducts();

  const getImageUrl = (img?: string) => {
    if (!img) return rockets;
    if (img.startsWith("http")) return img;
    return `${API_BASE_URL}/${img.replace(/\\/g, '/')}`;
  };

  const handleQuantityInput = (id: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    dispatch(setQuantity({ id, num }));
  };

  const handleUpdateQty = (id: string, delta: number) => {
    dispatch(updateQuantity({ id, delta }));
  };

  const totals = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    const items: Array<Product & { qty: number }> = [];

    categories.forEach((cat) =>
      cat.products.forEach((p) => {
        const qty = quantities[p.id] || 0;
        if (qty > 0) {
          totalItems += qty;
          totalAmount += qty * p.discPrice;
          items.push({ ...p, qty });
        }
      })
    );
    return { totalItems, totalAmount, items };
  }, [quantities, categories]);

  const isBelowMinimumOrder = totals.totalAmount < MIN_ORDER_AMOUNT;
  const shortfallAmount = Math.max(0, MIN_ORDER_AMOUNT - totals.totalAmount);

  const filteredCategories = useMemo(() => {
    return categories
      .map(category => ({
        ...category,
        products: category.products.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedCategory === "All" || category.name === selectedCategory)
        )
      }))
      .filter(category => category.products.length > 0);
  }, [searchQuery, selectedCategory, categories]);

  // Show legal dialog before checkout
  const handleNext = () => {
    if (isBelowMinimumOrder) {
      toast.error(
        `Minimum order is ${formatCurrency(MIN_ORDER_AMOUNT)}. Add ${formatCurrency(shortfallAmount)} more.`
      );
      return;
    }
    setIsLegalOpen(true);
  };

  const proceedToCheckout = () => {
    if (isBelowMinimumOrder) {
      toast.error(
        `Minimum order is ${formatCurrency(MIN_ORDER_AMOUNT)}. Add ${formatCurrency(shortfallAmount)} more.`
      );
      return;
    }
    setIsLegalOpen(false);

    // Generate summary for checkout page
    const selectedItems = categories.flatMap(cat =>
      cat.products.filter(p => (quantities[p.id] || 0) > 0)
        .map(p => ({ ...p, qty: quantities[p.id] }))
    );

    navigate("/checkout", {
      state: {
        cartItems: selectedItems,
        totals: {
          totalQty: totals.totalItems,
          totalAmount: totals.totalAmount,
        },
        totalAmount: totals.totalAmount,
        subTotal: totals.totalAmount,
      },
    });
  };

  // Rendering Loader only if categories are truly empty and loading
  const shouldShowLoader = isLoading && categories.length === 0;

  return (
    <div>
      <SEO
        title="Fireworks Price List and Estimate Form"
        description="Browse our Sivakasi fireworks price list, add quantities, and submit your estimate form online. Get a confirmation call within 2 hours."
        canonical="/products"
        keywords="fireworks price list, crackers estimate form, sivakasi crackers rates, diwali crackers online estimate"
        ogImage="/og/products-og.svg?v=2"
        structuredData={productsStructuredData}
      />
      <PageHeader
        title="ESTIMATE FORM"
        subtitle="Select your favourite products, add quantities, and submit your estimate. Our team will call within 2 hours!"
        bgImage={headerBg}
      />

      <div className="min-h-screen bg-background pb-36 md:pb-40 overflow-x-hidden font-body">

        {/* -- Banner -- */}
        <div className="container-narrow px-4 mt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl h-48 md:h-80 group"
          >
            <img
              src={heroBanner}
              alt="Happy Diwali Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white text-3xl md:text-6xl font-display italic tracking-tight"
              >
                Happy Diwali
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-primary text-sm md:text-xl mt-3 font-semibold uppercase tracking-[0.3em]"
              >
                Premium Fireworks Selection
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* -- Search + View Switcher -- */}
        <div className="container-narrow px-4 mt-10 flex flex-col md:flex-row gap-6">
          <div className="relative group flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search for crackers..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm font-bold text-foreground placeholder:text-muted-foreground/50 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="bg-card border border-border rounded-2xl p-1 flex shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary'}`}
                title="Table View"
              >
                <TableIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary'}`}
                title="Card View"
              >
                <List size={20} />
              </button>
            </div>

            {viewMode === 'table' && (
              <div className="relative sm:min-w-[220px] group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-12 pr-12 py-3.5 rounded-2xl border border-border focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm font-black text-foreground bg-card cursor-pointer uppercase tracking-widest text-xs h-full"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </div>

        {shouldShowLoader ? (
          <div className="container-narrow px-4 mt-10 pb-20 min-h-[600px]">
            {viewMode === 'table' ? (
              /* Table View Skeleton */
              <div className="bg-card md:rounded-3xl shadow-xl overflow-hidden border border-border/60">
                <div className="bg-footer p-5 hidden md:block">
                  <div className="flex gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-4 flex-1 bg-primary/20" />
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4 md:py-6">
                      <Skeleton className="w-8 h-4 shrink-0 bg-muted" />
                      <Skeleton className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-secondary shrink-0" />
                      <div className="grow space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-muted" />
                        <Skeleton className="h-3 w-1/4 bg-muted/60 md:hidden" />
                      </div>
                      <Skeleton className="w-20 h-4 bg-muted hidden md:block" />
                      <Skeleton className="w-16 h-4 bg-muted" />
                      <Skeleton className="w-16 h-4 bg-primary/10" />
                      <Skeleton className="w-12 h-8 rounded bg-muted" />
                      <Skeleton className="w-16 h-4 bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Card View Skeleton */
              <div className="space-y-6">
                <div className="bg-card rounded-3xl shadow-xl border border-border p-5 mb-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="grow max-w-72">
                      <Skeleton className="h-3 w-24 mb-2 bg-muted-foreground/20" />
                      <Skeleton className="h-10 w-full rounded-xl bg-muted" />
                    </div>
                    <div className="hidden sm:block text-right space-y-2">
                      <Skeleton className="h-2 w-16 ml-auto bg-muted-foreground/20" />
                      <Skeleton className="h-4 w-32 ml-auto bg-primary/20" />
                    </div>
                  </div>
                </div>

                {[...Array(3)].map((_, sectionIdx) => (
                  <div key={sectionIdx} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-primary/10 px-6 py-4">
                      <Skeleton className="h-5 w-40 bg-primary/20 rounded-lg" />
                    </div>
                    <div className="divide-y divide-border/30">
                      {[...Array(3)].map((_, itemIdx) => (
                        <div key={itemIdx} className="p-4 md:p-6 flex items-center gap-4">
                          <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-2xl shrink-0 bg-secondary" />
                          <div className="grow space-y-3">
                            <Skeleton className="h-6 w-1/2 rounded-lg bg-muted" />
                            <Skeleton className="h-4 w-1/4 rounded-lg bg-muted/60" />
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-7 w-24 bg-primary/10 rounded-lg" />
                              <Skeleton className="h-4 w-16 bg-muted rounded-full" />
                            </div>
                          </div>
                          <Skeleton className="w-24 h-10 rounded-2xl bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : error && categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container-narrow px-4 mt-16 max-w-2xl mx-auto"
          >
            <div className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-10 md:p-16 border border-border/60 shadow-[0_30px_100px_-15px_rgba(255,50,50,0.1)] relative overflow-hidden group text-center">
              <div className="absolute inset-0 bg-linear-to-b from-festive-ruby/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-festive-ruby/10 flex items-center justify-center mb-8 relative"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-festive-ruby/20 animate-ping" />
                  <ServerCrash className="w-12 h-12 md:w-14 md:h-14 text-festive-ruby" strokeWidth={1.5} />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-foreground mb-4 tracking-tight">
                  Server Unreachable
                </h2>

                <p className="text-muted-foreground text-sm md:text-base font-medium mb-8 max-w-md mx-auto leading-relaxed">
                  We're having trouble connecting to the Crackers Kingdom secure servers. Our systems might be experiencing heavy traffic.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Attempt Reconnect
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : viewMode === 'table' ? (
          <>
            {/* -- Order Table -- */}
            <div className="max-w-full container-narrow px-0 md:px-4 mt-10 pb-12 w-full overflow-hidden">
              <div className="bg-card md:rounded-3xl shadow-2xl overflow-hidden border border-border/60">
                <table className="w-full text-left border-collapse table-auto">
                  <thead className="bg-footer text-primary uppercase text-[8px] md:text-sm font-bold sticky top-0 z-20">
                    <tr>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 text-right w-6 min-w-[24px]">SNo</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 w-8 min-w-[32px]">Img</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 min-w-[80px]">Name</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 text-center hidden md:table-cell">Content</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 text-right min-w-[45px]">Price</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 text-right min-w-[50px]">Disc.</th>
                      <th className="px-0   md:px-4 py-3 md:py-5 text-center min-w-[50px]">Qty</th>
                      <th className="px-0.5 md:px-4 py-3 md:py-5 text-center min-w-[60px]">Total</th>
                    </tr>
                  </thead>

                  <tbody className="text-foreground/80">
                    <AnimatePresence mode="popLayout">
                      {filteredCategories.map((category) => (
                        <React.Fragment key={category.name}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-primary border-b border-primary/80"
                          >
                            <td colSpan={8} className="px-2 py-1.5 md:px-4 md:py-2.5 text-card font-black italic tracking-wider text-[9px] md:text-base uppercase">
                              {category.name}
                            </td>
                          </motion.tr>

                          {category.products.map((product, idx) => (
                            <motion.tr
                              key={product.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="border-b border-border/30 hover:bg-primary/5 transition-colors"
                            >
                              <td className="px-0.5 md:px-4 py-3 md:py-4 text-center font-medium text-muted-foreground text-[8px] md:text-sm">{idx + 1}</td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4">
                                <motion.div
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedImage({ url: getImageUrl(product.img), name: product.name })}
                                  className="w-6 h-6 md:w-14 md:h-14 rounded md:rounded-lg overflow-hidden border border-border/50 shadow-sm bg-secondary cursor-pointer"
                                >
                                  <img src={getImageUrl(product.img)} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                                </motion.div>
                              </td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4 font-bold text-foreground text-[9px] md:text-sm min-w-[65px] wrap-break-word leading-tight whitespace-normal">
                                {product.name}
                                <div className="md:hidden text-[7px] text-muted-foreground font-normal italic">{product.content}</div>
                              </td>
                              <td className="px-1 md:px-4 py-3 md:py-4 text-center hidden md:table-cell">
                                <span className="bg-secondary px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-tighter">{product.content}</span>
                              </td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4 text-right text-muted-foreground line-through text-[8px] md:text-xs">{formatCurrency(product.price)}</td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4 text-right font-black text-primary text-[9px] md:text-sm">{formatCurrency(product.discPrice)}</td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={quantities[product.id] || ""}
                                  onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                                  className="w-10 md:w-20 px-0 py-1 md:py-1.5 rounded border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-[10px] md:text-sm font-black bg-card outline-none"
                                />
                              </td>
                              <td className="px-0.5 md:px-4 py-3 md:py-4 text-center font-black text-foreground text-[9px] md:text-sm">{formatCurrency((quantities[product.id] || 0) * product.discPrice)}</td>
                            </motion.tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* CARD/LIST VIEW */
          <div className="container-narrow w-full px-4 mt-10 pb-12">
            <div className="bg-card rounded-3xl shadow-xl border border-border p-5 mb-8 sticky top-24 z-30 transition-shadow duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-1">Select Category</h3>
                  <div className="relative w-full md:w-72 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="p-1 px-2 border border-primary/20 bg-primary/5 rounded-lg">
                        <List className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none pl-12 pr-10 py-3 rounded-xl border border-border focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all outline-none shadow-sm font-black text-foreground bg-card cursor-pointer uppercase tracking-widest text-[10px]"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic">Browsing</p>
                  <p className="text-xs font-black text-primary uppercase tracking-tighter">{selectedCategory === "All" ? "Every Product" : selectedCategory}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <div key={category.name} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-primary px-6 py-3">
                      <h2 className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                        {category.name}
                      </h2>
                    </div>
                    <div className="divide-y divide-border/30">
                      {category.products.map(product => {
                        const qty = quantities[product.id] || 0;
                        return (
                          <div key={product.id} className="p-4 md:p-6 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                            <div
                              onClick={() => setSelectedImage({ url: getImageUrl(product.img), name: product.name })}
                              className="w-20 h-20 md:w-28 md:h-28 bg-secondary rounded-2xl overflow-hidden border border-border shrink-0 shadow-inner group cursor-pointer"
                            >
                              <img src={getImageUrl(product.img)} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="grow min-w-0">
                              <h3 className="font-display font-black text-foreground text-sm md:text-xl truncate uppercase tracking-tight">{product.name}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground mb-2 font-medium italic">{product.content}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-primary font-black text-base md:text-2xl italic">{formatCurrency(product.discPrice)}</span>
                                <span className="text-xs md:text-sm text-muted-foreground/60 line-through font-bold">{formatCurrency(product.price)}</span>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {qty > 0 ? (
                                <div className="flex items-center bg-secondary/50 rounded-2xl border border-border overflow-hidden p-1">
                                  <button onClick={() => handleUpdateQty(product.id, -1)} className="p-2 md:p-3 hover:bg-card text-muted-foreground hover:text-festive-ruby transition-colors rounded-xl"><Minus size={16} strokeWidth={3} /></button>
                                  <span className="w-10 text-center font-black text-foreground text-sm md:text-lg">{qty}</span>
                                  <button onClick={() => handleUpdateQty(product.id, 1)} className="p-2 md:p-3 hover:bg-card text-muted-foreground hover:text-primary transition-colors rounded-xl"><Plus size={16} strokeWidth={3} /></button>
                                </div>
                              ) : (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleUpdateQty(product.id, 1)} className="flex items-center gap-2 bg-card border-2 border-primary text-primary px-5 py-2 md:px-8 md:py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                                  <Plus size={14} /> Add
                                </motion.button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-3xl border-2 border-dashed border-border p-20 text-center">
                  <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6"><SearchIcon className="text-muted-foreground/30 w-12 h-12" /></div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-widest mb-2">No Products Found</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mb-8 font-medium italic">We couldn't find items matching your search. Try another term!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -- Order Summary CTA -- */}
        <AnimatePresence>
          {totals.totalItems > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
              <div className="container-narrow py-4 px-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Order Summary</p>
                  <p className="text-sm md:text-base font-black text-foreground">{totals.totalItems} items · <span className="text-primary">{formatCurrency(totals.totalAmount)}</span></p>
                  {isBelowMinimumOrder && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-festive-ruby mt-1">Add {formatCurrency(shortfallAmount)} more to checkout</p>}
                </div>
                <button onClick={handleNext} disabled={isBelowMinimumOrder} className="bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground px-5 md:px-7 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.18em] shadow-xl active:scale-95 transition-all flex items-center gap-2">
                  <Send size={16} />
                  {isBelowMinimumOrder ? "Min Required" : "Checkout"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Image Preview Modal -- */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)} className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
              <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl relative max-w-2xl w-full p-4 md:p-8 flex flex-col items-center">
                <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 md:top-4 md:right-4 p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
                <div className="w-full aspect-square md:aspect-auto rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border/50">
                  <img src={selectedImage.url} alt={selectedImage.name} loading="lazy" className="w-full h-full max-h-[70vh] object-contain bg-card" />
                </div>
                <h3 className="mt-4 md:mt-6 text-lg md:text-2xl font-black text-foreground uppercase tracking-widest text-center">{selectedImage.name}</h3>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <LegalDialog
          isOpen={isLegalOpen}
          onClose={() => setIsLegalOpen(false)}
          onAccept={proceedToCheckout}
        />
      </div>
    </div>
  );
};

export default Products;






