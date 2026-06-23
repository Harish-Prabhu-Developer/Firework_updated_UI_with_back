import { lazy, Suspense, useState } from "react";
import { Provider } from "react-redux";
import { Store } from "./redux/Store";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ScrollTop from "@/components/ScrollTop";
import OpenStatement from "@/components/ui/OpenStatement";
import QuickEnquiry from "@/components/QuickEnquiry";
import WhatsAppButton from "./components/WhatsAppButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Safety = lazy(() => import("./pages/Safety"));
const Checkout = lazy(() => import("./pages/Checkout"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 size={32} className="animate-spin text-primary" />
  </div>
);

const App = () => {
  const [isStatementOpen, setIsStatementOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Provider store={Store}>
          <TooltipProvider>
            <SEO />
            <Toaster />
            <BrowserRouter>
              <OpenStatement isOpen={isStatementOpen} onOpenChange={setIsStatementOpen} />
              <ScrollTop />
              <Navbar />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/safety" element={<Safety />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Footer />
              <WhatsAppButton />
              <QuickEnquiry />
            </BrowserRouter>
          </TooltipProvider>
        </Provider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
