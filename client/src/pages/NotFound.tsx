import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowRight, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center section-padding">
      <SEO
        title="Page Not Found | Crackers Kingdom"
        description="Oops! The page you're looking for doesn't exist. Head back to Crackers Kingdom's home and explore our fireworks collection."
      />
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl font-display font-black text-primary/20 leading-none select-none mb-2">404</div>
        <div className="text-4xl mb-4">🎇</div>
        <h1 className="font-display text-2xl font-bold mb-3 text-foreground">
          Looks Like This Page Fizzled Out!
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have moved. But don't worry — there are plenty of bright things waiting for you at Crackers Kingdom!
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="rounded-full gap-2 active:scale-[0.97] transition-transform">
            <Link to="/">
              <Home size={16} /> Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full gap-2 active:scale-[0.97] transition-transform">
            <Link to="/products">
              <Package size={16} /> Browse Products <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
