import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import QuickEstimateImg from "@/assets/Quick-Estimate.png";

/**
 * QuickEnquiry Floating Action Button
 * Simplified version: just shows the brand image asset.
 * Clicking navigates to the products page.
 * Hides automatically on /products and /checkout pages.
 */
const QuickEnquiry = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Do not show on products/estimate or checkout page
    if (pathname === "/products" || pathname === "/checkout") return null;

    return (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-10 z-100 transition-all duration-300 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 1.2
                }}
                className="pointer-events-auto"
            >
                <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => navigate("/products")}
                    className="relative h-22 w-22 md:h-28 md:w-28 animate-bounce cursor-pointer group flex items-center justify-center"
                    role="button"
                    aria-label="Get Price Estimate"
                >
                    {/* Pulsing effect layer */}
                    <div className="absolute inset-2 rounded-full bg-primary/20 animate-ping opacity-60 z-[-1]" />
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse opacity-40 z-[-1]" />

                    <img
                        src={QuickEstimateImg}
                        alt="Get Estimate"
                        className="w-full h-full object-contain filter drop-shadow-2xl transition-all duration-500 group-hover:brightness-110"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default QuickEnquiry;
