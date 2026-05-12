import { Provider } from "react-redux";
import { Store } from "./redux/Store";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Safety from "./pages/Safety";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ScrollTop from "@/components/ScrollTop";

import { useState } from "react";
import OpenStatement from "@/components/ui/OpenStatement";
import QuickEnquiry from "@/components/QuickEnquiry";
import WhatsAppButton from "./components/WhatsAppButton";
import Products from "./pages/Products";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  const [isStatementOpen, setIsStatementOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Provider store={Store}>
          <TooltipProvider>
            <SEO /> {/* Global Default SEO */}
            <Toaster />
            <BrowserRouter>
              <OpenStatement isOpen={isStatementOpen} onOpenChange={setIsStatementOpen} />
              <ScrollTop />
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
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
