import { useQuery } from "@tanstack/react-query";
import { getShopSettings } from "@/services/productController";

// ─── Shape of the API response ───────────────────────────────────────────────
export interface ShopSettings {
  id?: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopGst?: string;
  shopEmail?: string;
  minimumOrder?: number;
  whatsappNum?: string;
  socialMedias?: { instagram?: string; facebook?: string; [key: string]: string | undefined };
  salesStatus?: boolean;
  orderReceiptQrStatus?: boolean;
  invoiceQrStatus?: boolean;
}

// ─── Static fallbacks (used on SSR / before API resolves) ────────────────────
const FALLBACK: ShopSettings = {
  shopName:    "CRACKERS KINGDOM",
  shopPhone:   "+91 81442 71571",
  shopAddress: "M/S NANDHINI TRADERS, Survey No: 299/13A1C, Sivakasi - 626189, Tamil Nadu, India",
  shopGst:     "GSTIN: 30239HHJ343HG393",
  shopEmail:   "crackerskingdom26@gmail.com",
  minimumOrder: 3000,
  whatsappNum: "918144271571",
  salesStatus: true,
  socialMedias: {
    instagram: "https://www.instagram.com/",
    facebook:  "https://www.facebook.com/",
  },
};

// ─── React Query hook — primary way to consume settings in components ─────────
export const useShopSettings = () => {
  const { data, isLoading, isError } = useQuery<ShopSettings>({
    queryKey: ["shop-settings"],
    queryFn:  getShopSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes — settings rarely change
    retry: 2,
  });

  const settings = data ?? FALLBACK;

  return { settings, isLoading, isError };
};

// ─── Backward-compatible static exports (fallback values) ─────────────────────
// These are used by SEO.tsx, Footer.tsx, Contact.tsx, and Index.tsx.
// Components that need LIVE values should use `useShopSettings()` instead.
export const SHOP_NAME    = FALLBACK.shopName;
export const GSTIN        = `GSTIN: ${FALLBACK.shopGst ?? ""}`;
export const CONTACT_LINE = `${FALLBACK.shopPhone} | ${FALLBACK.shopEmail ?? ""}`;

export const ADDRESS_LINES = [
  "M/S NANDHINI TRADERS",
  "Survey No: 299/13A1C, 299/15A2, Door No: 3/1362/20",
  "Bharathi Nagar - II, Viswanatham",
  "Sivakasi - 626189, Virudhunagar District",
  "Tamil Nadu, India",
] as const;

export const ADDRESS_STREET   = `${SHOP_NAME}, ${ADDRESS_LINES[0]}, ${ADDRESS_LINES[1]}, ${ADDRESS_LINES[2]}`;
export const ADDRESS_LOCALITY = ADDRESS_LINES[3];
export const ADDRESS_REGION   = ADDRESS_LINES[4];
