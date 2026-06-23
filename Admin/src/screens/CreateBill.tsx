// Admin/src/screens/CreateBill.tsx
// Unified Desktop + Mobile/Android keyboard-first POS billing screen.
// Desktop (web >=768px): two-column split layout with keyboard shortcuts
// Mobile (web <768px / Android): three-tab bottom-nav layout, touch-optimised

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Platform, FlatList, ActivityIndicator, KeyboardAvoidingView,
  Modal, useWindowDimensions,
} from 'react-native';
import {
  Search, Mic, ShoppingCart, Trash2, Printer,
  ChevronDown, Plus, Minus, X, User, CreditCard,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { useToast } from '../hooks/useToast';
import { LightColors as colors } from '../styles/colors';
import { Fonts } from '../styles/globalStyles';
import { cleanIdentityInput, formatCurrency, formatIdentityDisplay } from '../utils/Formatter';

// ─── Responsive helper ────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  mrp: string;
  sellingPrice: string;
  /** DB: products.stock — plain integer column */
  stock?: number;
  /** DB: products.unit — varchar(20) */
  unit?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  stock?: number;
}

type MobileTab = 'search' | 'cart' | 'checkout';
type PayMethod = 'cash' | 'upi' | 'card';
type GSTType = 'INSIDE_TN' | 'OUTSIDE_TN';

const PAY_METHODS: PayMethod[] = ['cash', 'upi', 'card'];
const PAY_COLORS: Record<PayMethod, string> = {
  cash: 'hsl(145, 60%, 40%)',
  upi: 'hsl(38, 80%, 55%)',
  card: 'hsl(280, 60%, 50%)',
};

// ─── GST Calculation Engine ───────────────────────────────────────────────────

interface GSTCalc {
  gstEnabled: boolean;
  gstType: GSTType;
  gstPercentage: number;
  taxableAmount: number;
  cgstPercentage: number;
  sgstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstPercentage: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
}

function calcGST(
  subTotal: number,
  discountAmount: number,
  gstEnabled: boolean,
  gstType: GSTType,
  gstPercentage: number,
): GSTCalc {
  const taxableAmount = parseFloat((subTotal - discountAmount).toFixed(2));

  if (!gstEnabled || gstPercentage === 0) {
    return {
      gstEnabled, gstType, gstPercentage,
      taxableAmount,
      cgstPercentage: 0, sgstPercentage: 0, cgstAmount: 0, sgstAmount: 0,
      igstPercentage: 0, igstAmount: 0,
      totalTaxAmount: 0,
      grandTotal: taxableAmount,
    };
  }

  const totalTaxAmount = parseFloat((taxableAmount * gstPercentage / 100).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + totalTaxAmount).toFixed(2));

  if (gstType === 'INSIDE_TN') {
    const half = parseFloat((totalTaxAmount / 2).toFixed(2));
    return {
      gstEnabled, gstType, gstPercentage, taxableAmount,
      cgstPercentage: gstPercentage / 2,
      sgstPercentage: gstPercentage / 2,
      cgstAmount: half, sgstAmount: half,
      igstPercentage: 0, igstAmount: 0,
      totalTaxAmount, grandTotal,
    };
  }
  return {
    gstEnabled, gstType, gstPercentage, taxableAmount,
    cgstPercentage: 0, sgstPercentage: 0, cgstAmount: 0, sgstAmount: 0,
    igstPercentage: gstPercentage,
    igstAmount: totalTaxAmount,
    totalTaxAmount, grandTotal,
  };
}

/**
 * Sanitizes raw keystrokes for the GST % input.
 * Allows digits and a single decimal point, clamps to the 0-100 range,
 * and supports values like "18", "18.5", "0", "28".
 */
function sanitizeGstInput(raw: string): string {
  // Keep only digits and the first decimal point
  let cleaned = raw.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  // Clamp to 0-100 once it parses to a full number (don't clamp while typing "1" of "100")
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 100) return '100';
  return cleaned;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── CartRow (shared) ─────────────────────────────────────────────────────────

interface CartRowProps {
  item: CartItem;
  isSelected: boolean;
  isMobile?: boolean;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

const CartRow = memo(({
  item, isSelected, isMobile = false,
  onIncrease, onDecrease, onRemove, onSelect,
}: CartRowProps) => {
  const fs = isMobile ? 14 : 13;
  const subFs = isMobile ? 12 : 11;
  const stepSz = isMobile ? 34 : 26;
  const iconSz = isMobile ? 14 : 11;

  return (
    <TouchableOpacity
      onPress={() => onSelect(item.productId)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: isMobile ? 14 : 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: isSelected ? 'hsl(145, 45%, 95%)' : colors.card,
      }}
    >
      <View style={{ flex: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: fs, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: subFs, color: colors.mutedForeground, marginTop: 2, fontFamily: Fonts.body }}>
          ₹{item.price.toFixed(2)} each {item.stock !== undefined ? ` • Stock: ${item.stock}` : ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 }}>
        <TouchableOpacity
          onPress={() => onDecrease(item.productId)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{ width: stepSz, height: stepSz, borderRadius: 999, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={iconSz} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ marginHorizontal: isMobile ? 12 : 10, fontSize: isMobile ? 16 : 14, fontWeight: '700', color: colors.foreground, minWidth: 22, textAlign: 'center', fontFamily: Fonts.body }}>
          {item.qty}
        </Text>
        <TouchableOpacity
          onPress={() => onIncrease(item.productId)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{ width: stepSz, height: stepSz, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={iconSz} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <Text 
        numberOfLines={1} 
        adjustsFontSizeToFit 
        style={{ width: isMobile ? 85 : 90, fontSize: fs, fontWeight: '700', color: colors.foreground, textAlign: 'right', fontFamily: Fonts.body }}
      >
        ₹{item.total.toFixed(2)}
      </Text>

      <TouchableOpacity
        onPress={() => onRemove(item.productId)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={{ marginLeft: 8, width: isMobile ? 32 : 26, height: isMobile ? 32 : 26, borderRadius: 999, backgroundColor: 'hsl(0,72%,95%)', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={isMobile ? 13 : 12} color={colors.destructive} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ─── Qty Bottom Sheet (mobile only) ──────────────────────────────────────────

interface QtyModalProps {
  product: Product | null;
  visible: boolean;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}

const QtyModal = memo(({ product, visible, onConfirm, onClose }: QtyModalProps) => {
  const [val, setVal] = useState('1');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setVal('1');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  const confirm = useCallback(() => {
    onConfirm(Math.max(1, parseInt(val, 10) || 1));
  }, [val, onConfirm]);

  if (!product) return null;

  const price = parseFloat(product.sellingPrice) || 0;
  const qty = parseInt(val, 10) || 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => { }} style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />

          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body, marginBottom: 4 }} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: Fonts.body, marginBottom: 24 }}>
            ₹{price.toFixed(2)} per unit{product.unit ? `  ·  ${product.unit}` : ''}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setVal(v => String(Math.max(1, (parseInt(v, 10) || 1) - 1)))}
              style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={22} color={colors.foreground} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={val}
              onChangeText={t => setVal(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              onSubmitEditing={confirm}
              selectTextOnFocus
              style={{
                width: 84, height: 60,
                borderWidth: 2, borderColor: colors.primary, borderRadius: 14,
                fontSize: 26, fontWeight: '800', color: colors.foreground,
                textAlign: 'center', backgroundColor: colors.muted,
                fontFamily: Fonts.body,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
              }}
            />
            <TouchableOpacity
              onPress={() => setVal(v => String((parseInt(v, 10) || 1) + 1))}
              style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={22} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: colors.muted, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: Fonts.body }}>
              {qty} × ₹{price.toFixed(2)}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, fontFamily: Fonts.body }}>
              ₹{(qty * price).toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={confirm}
            style={{ backgroundColor: colors.primary, borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryForeground, fontFamily: Fonts.body }}>
              Add to Bill
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── SummaryFooter (mobile cart + desktop sidebar) ───────────────────────────

const SummaryFooter = memo(({ subTotal, discountAmount, discountPct, gst }: {
  subTotal: number; discountAmount: number; discountPct: string; gst: GSTCalc;
}) => (
  <View style={{ margin: 16, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
    <View style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: Fonts.body }}>Subtotal</Text>
        <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>₹{subTotal.toFixed(2)}</Text>
      </View>
      {discountAmount > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Discount ({discountPct}%)</Text>
          <Text style={{ fontWeight: '600', color: colors.destructive, fontSize: 14 }}>-₹{discountAmount.toFixed(2)}</Text>
        </View>
      )}
      {gst.gstEnabled && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Taxable Amount</Text>
          <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>₹{gst.taxableAmount.toFixed(2)}</Text>
        </View>
      )}
      {gst.gstEnabled && gst.gstType === 'INSIDE_TN' && gst.cgstAmount > 0 && (<>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>CGST ({gst.cgstPercentage}%)</Text>
          <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>+₹{gst.cgstAmount.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>SGST ({gst.sgstPercentage}%)</Text>
          <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>+₹{gst.sgstAmount.toFixed(2)}</Text>
        </View>
      </>)}
      {gst.gstEnabled && gst.gstType === 'OUTSIDE_TN' && gst.igstAmount > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>IGST ({gst.igstPercentage}%)</Text>
          <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>+₹{gst.igstAmount.toFixed(2)}</Text>
        </View>
      )}
    </View>
    <View style={{ backgroundColor: colors.foreground, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.card, fontFamily: Fonts.body }}>Total</Text>
      <Text style={{ fontSize: 24, fontWeight: '900', color: colors.card, fontFamily: Fonts.body }}>₹{gst.grandTotal.toFixed(2)}</Text>
    </View>
  </View>
));

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

interface SharedProps {
  searchQuery: string; setSearchQuery: (v: string) => void;
  qtyText: string; setQtyText: (v: string) => void;
  highlightedIndex: number; setHighlightedIndex: (v: number | ((p: number) => number)) => void;
  cart: CartItem[];
  customerName: string; setCustomerName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  discountPct: string; setDiscountPct: (v: string) => void;
  // GST
  gstEnabled: boolean; setGstEnabled: (v: boolean) => void;
  gstType: GSTType; setGstType: (v: GSTType) => void;
  gstRateText: string; setGstRateText: (v: string) => void;
  gst: GSTCalc;
  paymentMethod: PayMethod; setPaymentMethod: (v: PayMethod) => void;
  showPaymentDropdown: boolean; setShowPaymentDropdown: (v: boolean | ((p: boolean) => boolean)) => void;
  showGstTypeDropdown: boolean; setShowGstTypeDropdown: (v: boolean | ((p: boolean) => boolean)) => void;
  isSearchFocused: boolean; setIsSearchFocused: (v: boolean) => void;
  searchResults: Product[]; isSearchFetching: boolean;
  subTotal: number; discountAmount: number;
  selectedCartId: string | null; setSelectedCartId: (v: string | null) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  saveMutation: any;
  handleSelectProduct: (p: Product, qty?: number) => void;
  confirmAdd: () => void;
  focusSearch: () => void; focusCustomer: () => void; focusPayment: () => void;
  searchInputRef: React.RefObject<TextInput | null>;
  qtyInputRef: React.RefObject<TextInput | null>;
  customerNameRef: React.RefObject<TextInput | null>;
  phoneRef: React.RefObject<TextInput | null>;
  emailRef: React.RefObject<TextInput | null>;
  addressRef: React.RefObject<TextInput | null>;
  discountRef: React.RefObject<TextInput | null>;
  gstCheckboxRef: React.RefObject<View | null>;
  gstTypeRef: React.RefObject<View | null>;
  gstRateRef: React.RefObject<TextInput | null>;
  paymentDropdownRef: React.RefObject<View | null>;
  printButtonRef: React.RefObject<View | null>;
  pendingProductRef: React.MutableRefObject<Product | null>;
}

const MobileCreateBill = (props: SharedProps) => {
  const {
    searchQuery, setSearchQuery, highlightedIndex, setHighlightedIndex,
    cart, customerName, setCustomerName, phone, setPhone, email, setEmail, address, setAddress,
    discountPct, setDiscountPct,
    gstEnabled, setGstEnabled, gstType, setGstType, gstRateText, setGstRateText, gst,
    paymentMethod, setPaymentMethod,
    showGstTypeDropdown, setShowGstTypeDropdown,
    isSearchFocused, setIsSearchFocused,
    searchResults, isSearchFetching,
    subTotal, discountAmount,
    increaseQty, decreaseQty, removeFromCart, clearCart,
    saveMutation, handleSelectProduct, focusSearch, searchInputRef, gstRateRef,
  } = props;

  const [activeTab, setActiveTab] = useState<MobileTab>('search');
  const [qtyModalProduct, setQtyModalProduct] = useState<Product | null>(null);
  const pendingRef = useRef<Product | null>(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleMobileProductTap = useCallback((product: Product) => {
    pendingRef.current = product;
    setQtyModalProduct(product);
    setIsSearchFocused(false);
  }, [setIsSearchFocused]);

  const handleQtyConfirm = useCallback((qty: number) => {
    if (pendingRef.current) {
      handleSelectProduct(pendingRef.current, qty);
    }
    setQtyModalProduct(null);
    pendingRef.current = null;
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 120);
  }, [handleSelectProduct, setSearchQuery, searchInputRef]);

  // ── Tab: Search ───────────────────────────────────────────────────────────
  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const stock = item.stock ?? 0;
    const price = parseFloat(item.sellingPrice) || 0;
    const mrp = parseFloat(item.mrp) || 0;
    const hasDiscount = mrp > price;
    const discPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

    return (
      <TouchableOpacity
        onPress={() => handleMobileProductTap(item)}
        activeOpacity={0.6}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          backgroundColor: colors.card,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
            {item.unit ? (
              <View style={{ backgroundColor: colors.muted, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground }}>{item.unit}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 11, fontWeight: '600', color: stock > 0 ? colors.success : colors.destructive, fontFamily: Fonts.body }}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4, marginRight: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.foreground, fontFamily: Fonts.body }}>
            ₹{price.toFixed(2)}
          </Text>
          {hasDiscount && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, textDecorationLine: 'line-through' }}>₹{mrp.toFixed(0)}</Text>
              <View style={{ backgroundColor: 'hsl(145,60%,92%)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success }}>{discPct}% off</Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} color={colors.primaryForeground} />
        </View>
      </TouchableOpacity>
    );
  }, [handleMobileProductTap]);

  // ── Tab: Cart ─────────────────────────────────────────────────────────────
  const renderCartItem = useCallback(({ item }: { item: CartItem }) => (
    <CartRow
      item={item}
      isSelected={false}
      isMobile
      onIncrease={increaseQty}
      onDecrease={decreaseQty}
      onRemove={removeFromCart}
      onSelect={() => { }}
    />
  ), [increaseQty, decreaseQty, removeFromCart]);

  // ── Bottom tab bar config ─────────────────────────────────────────────────
  const TABS: { key: MobileTab; label: string; Icon: any }[] = [
    { key: 'search', label: 'Search', Icon: Search },
    { key: 'cart', label: 'Cart', Icon: ShoppingCart },
    { key: 'checkout', label: 'Checkout', Icon: CreditCard },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── SEARCH TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={{
            backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.muted, borderRadius: 12,
              paddingHorizontal: 12, height: 50,
              borderWidth: 1.5,
              borderColor: isSearchFocused ? colors.primary : colors.border,
            }}>
              <Search size={20} color={isSearchFocused ? colors.primary : colors.mutedForeground} />
              <TextInput
                ref={searchInputRef}
                style={{
                  flex: 1, marginLeft: 10, fontSize: 15,
                  color: colors.foreground, fontFamily: Fonts.body, height: 50,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
                }}
                placeholder="Search product or scan barcode..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={t => { setSearchQuery(t); setHighlightedIndex(0); }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                blurOnSubmit={false}
              />
              {searchQuery.length > 0
                ? <TouchableOpacity onPress={() => { setSearchQuery(''); focusSearch(); }}><X size={18} color={colors.mutedForeground} /></TouchableOpacity>
                : <TouchableOpacity><Mic size={20} color={colors.mutedForeground} /></TouchableOpacity>
              }
            </View>
          </View>

          {/* Results */}
          {searchQuery.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 }}>
              <Search size={52} color={colors.border} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedForeground, fontFamily: Fonts.body }}>
                Start typing to search
              </Text>
              <Text style={{ fontSize: 13, color: colors.border }}>Name, barcode, or category</Text>
            </View>
          ) : isSearchFetching ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.mutedForeground, fontFamily: Fonts.body }}>Searching...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 }}>
              <AlertCircle size={40} color={colors.mutedForeground} />
              <Text style={{ fontSize: 15, color: colors.mutedForeground, fontFamily: Fonts.body }}>
                No products for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={p => p.id}
              renderItem={renderProductItem}
              keyboardShouldPersistTaps="always"
              removeClippedSubviews
              maxToRenderPerBatch={20}
              contentContainerStyle={{ paddingBottom: 90 }}
            />
          )}
        </View>
      )}

      {/* ── CART TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'cart' && (
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 14,
            backgroundColor: colors.card,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body }}>
              Cart
              {cart.length > 0 && (
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.mutedForeground }}>
                  {'  '}({cart.length} items)
                </Text>
              )}
            </Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Trash2 size={15} color={colors.destructive} />
                <Text style={{ fontSize: 13, color: colors.destructive, fontWeight: '600' }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 80 }}>
              <ShoppingCart size={54} color={colors.border} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedForeground, fontFamily: Fonts.body }}>Cart is empty</Text>
              <TouchableOpacity
                onPress={() => setActiveTab('search')}
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryForeground }}>Add Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={i => i.productId}
              renderItem={renderCartItem}
              removeClippedSubviews
              maxToRenderPerBatch={20}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 170 }}
              ListFooterComponent={
                <SummaryFooter
                  subTotal={subTotal}
                  discountAmount={discountAmount}
                  discountPct={discountPct}
                  gst={gst}
                />
              }
            />
          )}
        </View>
      )}

      {/* ── CHECKOUT TAB ───────────────────────────────────────────────── */}
      {activeTab === 'checkout' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer */}
          <View style={{ margin: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: 'hsl(40,15%,96%)', borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <User size={15} color={colors.mutedForeground} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.6, fontFamily: Fonts.body }}>CUSTOMER</Text>
            </View>
            <View style={{ padding: 16, gap: 14 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 6, fontFamily: Fonts.body }}>Name *</Text>
                <TextInput
                  value={customerName} onChangeText={setCustomerName}
                  placeholder="Walk-in Customer" placeholderTextColor={colors.mutedForeground}
                  style={{ width: '100%', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 6, fontFamily: Fonts.body }}>Phone *</Text>
                <TextInput
                  value={formatIdentityDisplay(phone)} onChangeText={(v) => setPhone(cleanIdentityInput(v))}
                  placeholder="Enter phone number" placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 6, fontFamily: Fonts.body }}>Email *</Text>
                <TextInput
                  value={email} onChangeText={setEmail}
                  placeholder="Email address" placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 6, fontFamily: Fonts.body }}>Address (optional)</Text>
                <TextInput
                  value={address} onChangeText={setAddress}
                  placeholder="Billing address" placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, minHeight: 80, fontSize: 15, color: colors.foreground, fontFamily: Fonts.body, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                />
              </View>
            </View>
          </View>

          {/* Adjustments */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: 'hsl(40,15%,96%)', borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <CreditCard size={15} color={colors.mutedForeground} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.6, fontFamily: Fonts.body }}>ADJUSTMENTS</Text>
            </View>
            <View style={{ padding: 16, gap: 16 }}>
              {/* Discount */}
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>Discount</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.destructive, fontFamily: Fonts.body }}>
                    {discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : '—'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 46 }}>
                  <TextInput
                    value={discountPct} onChangeText={setDiscountPct}
                    keyboardType="numeric" selectTextOnFocus
                    style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.mutedForeground, fontFamily: Fonts.body }}>% off</Text>
                </View>
              </View>
              {/* GST Toggle */}
              <TouchableOpacity
                onPress={() => setGstEnabled(!gstEnabled)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 5,
                  borderWidth: 2,
                  borderColor: gstEnabled ? colors.primary : colors.border,
                  backgroundColor: gstEnabled ? colors.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {gstEnabled && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>GST Billing</Text>
              </TouchableOpacity>
              {/* GST Controls */}
              {gstEnabled && (<>
                {/* GST Type */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 8, fontFamily: Fonts.body }}>GST TYPE</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['INSIDE_TN', 'OUTSIDE_TN'] as GSTType[]).map(t => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setGstType(t)}
                        style={{ flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: gstType === t ? colors.primary : colors.muted, borderWidth: gstType === t ? 0 : 1, borderColor: colors.border }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: gstType === t ? '#fff' : colors.mutedForeground, fontFamily: Fonts.body }}>
                          {t === 'INSIDE_TN' ? 'Inside TN' : 'Outside TN'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* GST Rate — free numeric input, supports decimals (18, 18.5, etc) */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground, marginBottom: 8, fontFamily: Fonts.body }}>GST %</Text>
                  <TextInput
                    ref={gstRateRef}
                    value={gstRateText}
                    onChangeText={t => setGstRateText(sanitizeGstInput(t))}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    placeholder="Enter GST %"
                    placeholderTextColor={colors.mutedForeground}
                    onSubmitEditing={() => gstRateRef.current?.blur()}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    style={{ width: '100%', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 17, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                  />
                </View>
                {/* GST Breakup */}
                {gst.totalTaxAmount > 0 && (
                  <View style={{ backgroundColor: 'hsl(145,45%,96%)', borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: 'hsl(145,45%,88%)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Taxable Amount</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>₹{gst.taxableAmount.toFixed(2)}</Text>
                    </View>
                    {gstType === 'INSIDE_TN' ? (<>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>CGST ({gst.cgstPercentage}%)</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>₹{gst.cgstAmount.toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>SGST ({gst.sgstPercentage}%)</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>₹{gst.sgstAmount.toFixed(2)}</Text>
                      </View>
                    </>) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>IGST ({gst.igstPercentage}%)</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>₹{gst.igstAmount.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>)}
            </View>
          </View>

          {/* Payment method chips */}
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.mutedForeground, marginBottom: 10, letterSpacing: 0.6, fontFamily: Fonts.body }}>
              PAYMENT METHOD
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {PAY_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={{
                    flex: 1, height: 50, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: paymentMethod === m ? PAY_COLORS[m] : colors.card,
                    borderWidth: paymentMethod === m ? 0 : 1.5,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: paymentMethod === m ? '#fff' : colors.mutedForeground, fontFamily: Fonts.body }}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Net total block */}
          <View style={{ marginHorizontal: 16, backgroundColor: colors.foreground, borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.body, letterSpacing: 0.5 }}>NET TOTAL</Text>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit
                style={{ fontSize: 30, fontWeight: '900', color: '#fff', fontFamily: Fonts.body, marginTop: 2, maxWidth: 180 }}
              >
                ₹{gst.grandTotal.toFixed(2)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.body }}>
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </Text>
              {gst.gstEnabled && (
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontFamily: Fonts.body }}>
                  {gst.gstType === 'INSIDE_TN' ? `CGST+SGST ${gst.gstPercentage}%` : `IGST ${gst.gstPercentage}%`}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.4, fontFamily: Fonts.body }}>
                {paymentMethod}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Floating Save bar (cart + checkout tabs) ───────────────────── */}
      {(activeTab === 'cart' || activeTab === 'checkout') && cart.length > 0 && (
        <View style={{ position: 'absolute', bottom: 78, left: 16, right: 16 }}>
          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              backgroundColor: colors.primary, borderRadius: 16, height: 58,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: saveMutation.isPending ? 0.75 : 1,
              shadowColor: colors.primary, shadowOpacity: 0.4,
              shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
              elevation: 10,
            }}
          >
            {saveMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Printer size={20} color="#fff" />
            }
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: Fonts.body }}>
              {saveMutation.isPending ? 'Saving...' : `Save & Print  ·  ₹${gst.grandTotal.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Tab Bar ─────────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.card,
        borderTopWidth: 1, borderTopColor: colors.border,
        height: 68,
        paddingBottom: Platform.OS === 'ios' ? 14 : 0,
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          const showBadge = key === 'cart' && cartCount > 0;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8, gap: 3 }}
            >
              <View style={{ position: 'relative' }}>
                <Icon size={22} color={active ? colors.primary : colors.mutedForeground} strokeWidth={active ? 2.5 : 1.8} />
                {showBadge && (
                  <View style={{
                    position: 'absolute', top: -5, right: -7,
                    backgroundColor: colors.destructive, borderRadius: 999,
                    minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.card,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.mutedForeground, fontFamily: Fonts.body }}>
                {label}
              </Text>
              {active && (
                <View style={{ position: 'absolute', bottom: 0, width: 24, height: 2.5, backgroundColor: colors.primary, borderRadius: 999 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Qty bottom sheet */}
      <QtyModal
        product={qtyModalProduct}
        visible={!!qtyModalProduct}
        onConfirm={handleQtyConfirm}
        onClose={() => { setQtyModalProduct(null); pendingRef.current = null; }}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

const DesktopCreateBill = (props: SharedProps & { sidebarWidth: number }) => {
  const {
    searchQuery, setSearchQuery, highlightedIndex, setHighlightedIndex,
    cart, customerName, setCustomerName, phone, setPhone, email, setEmail, address, setAddress,
    discountPct, setDiscountPct,
    gstEnabled, setGstEnabled, gstType, setGstType, gstRateText, setGstRateText, gst,
    paymentMethod, setPaymentMethod,
    showPaymentDropdown, setShowPaymentDropdown,
    showGstTypeDropdown, setShowGstTypeDropdown,
    isSearchFocused, setIsSearchFocused,
    searchResults, isSearchFetching,
    subTotal, discountAmount,
    selectedCartId, setSelectedCartId,
    increaseQty, decreaseQty, removeFromCart, clearCart,
    saveMutation, handleSelectProduct, confirmAdd,
    focusSearch, focusCustomer,
    searchInputRef, qtyInputRef, customerNameRef,
    phoneRef, emailRef, addressRef, discountRef,
    gstCheckboxRef, gstTypeRef, gstRateRef, paymentDropdownRef, printButtonRef,
    pendingProductRef,
    qtyText, setQtyText,
    sidebarWidth,
  } = props;
  // Compact mode for narrower desktops (768-1023px) — hide hint badges
  const isCompact = sidebarWidth <= 260;

  const showDropdown = isSearchFocused && searchQuery.length > 0;

  const renderSearchResult = useCallback(({ item, index }: { item: Product; index: number }) => {
    const stock = item.stock ?? 0;
    return (
      <TouchableOpacity
        onPress={() => handleSelectProduct(item)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
          backgroundColor: index === highlightedIndex ? 'hsl(145,45%,96%)' : colors.card,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>{item.name}</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>{item.unit ?? ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>₹{parseFloat(item.sellingPrice).toFixed(2)}</Text>
          {parseFloat(item.mrp) > parseFloat(item.sellingPrice) && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textDecorationLine: 'line-through' }}>₹{parseFloat(item.mrp).toFixed(2)}</Text>
          )}
          <Text style={{ fontSize: 11, color: stock > 0 ? colors.success : colors.destructive, fontWeight: '600', marginTop: 2 }}>
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [highlightedIndex, handleSelectProduct]);

  const renderCartItem = useCallback(({ item }: { item: CartItem }) => (
    <CartRow
      item={item}
      isSelected={selectedCartId === item.productId}
      onIncrease={increaseQty}
      onDecrease={decreaseQty}
      onRemove={removeFromCart}
      onSelect={setSelectedCartId}
    />
  ), [selectedCartId, increaseQty, decreaseQty, removeFromCart, setSelectedCartId]);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'hsl(40,20%,97%)' }}>

      {/* Left panel */}
      <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border, minWidth: 0 }}>
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.muted, borderRadius: 10, paddingHorizontal: 10, height: 42,
            borderWidth: 1, borderColor: isSearchFocused ? colors.primary : colors.border,
          }}>
            <Search size={18} color={isSearchFocused ? colors.primary : colors.mutedForeground} />
            <TextInput
              ref={searchInputRef}
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.foreground, fontFamily: Fonts.body, minWidth: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
              placeholder="Search products... (CTRL+F)"
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={t => { setSearchQuery(t); setHighlightedIndex(0); }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Enter' && searchResults.length > 0) handleSelectProduct(searchResults[highlightedIndex]); }}
              returnKeyType="next" autoCorrect={false} autoCapitalize="none" blurOnSubmit={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); focusSearch(); }}><X size={15} color={colors.mutedForeground} /></TouchableOpacity>
            )}
            <TouchableOpacity style={{ marginLeft: 6 }}><Mic size={17} color={colors.mutedForeground} /></TouchableOpacity>
          </View>
          {/* Qty */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: colors.mutedForeground, marginBottom: 2, fontWeight: '600' }}>QTY</Text>
            <TextInput
              ref={qtyInputRef}
              style={{
                backgroundColor: pendingProductRef.current ? 'hsl(145,45%,94%)' : colors.muted,
                borderWidth: 1.5,
                borderColor: pendingProductRef.current ? colors.primary : colors.border,
                borderRadius: 10, paddingHorizontal: 10, height: 42,
                fontSize: 15, fontWeight: '700', color: colors.foreground,
                textAlign: 'center', minWidth: 62, fontFamily: Fonts.body,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
              }}
              value={qtyText}
              onChangeText={t => setQtyText(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad" selectTextOnFocus
              onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Enter') confirmAdd(); }}
              onSubmitEditing={confirmAdd}
              returnKeyType="done" blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Cart + overlay */}
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={{ flex: 1, backgroundColor: colors.card }}>
            {/* Cart header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'hsl(40,15%,94%)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={17} color={colors.foreground} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body }}>Current Order</Text>
                {cart.length > 0 && (
                  <View style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryForeground }}>{cart.length}</Text>
                  </View>
                )}
              </View>
              {cart.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={13} color={colors.destructive} />
                  <Text style={{ fontSize: 12, color: colors.destructive, fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Column headers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'hsl(40,15%,96%)' }}>
              <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: colors.mutedForeground }}>PRODUCT</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: colors.mutedForeground, textAlign: 'center' }}>QTY</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.mutedForeground, width: 90, textAlign: 'right' }}>TOTAL</Text>
              <View style={{ width: 34 }} />
            </View>
            {cart.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ShoppingCart size={38} color={colors.border} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: Fonts.body }}>Search and add products</Text>
                <Text style={{ fontSize: 12, color: colors.border }}>Press CTRL+F to search</Text>
              </View>
            ) : (
              <FlatList
                data={cart} keyExtractor={i => i.productId}
                renderItem={renderCartItem} style={{ flex: 1 }}
                removeClippedSubviews maxToRenderPerBatch={20}
                windowSize={10} initialNumToRender={20}
              />
            )}
          </View>

          {/* Dropdown overlay */}
          {showDropdown && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, maxHeight: 380,
              backgroundColor: colors.card,
              borderWidth: 1, borderTopWidth: 0, borderColor: colors.border,
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 10,
              ...(Platform.OS === 'android' ? { elevation: 8 } : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }),
            }}>
              {isSearchFetching ? (
                <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.primary} /></View>
              ) : searchResults.length === 0 ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No products found for "{searchQuery}"</Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults} keyExtractor={p => p.id}
                  renderItem={renderSearchResult}
                  keyboardShouldPersistTaps="always"
                  maxToRenderPerBatch={20} removeClippedSubviews
                />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Right sidebar */}
      <View style={{ width: sidebarWidth, maxWidth: sidebarWidth, minWidth: sidebarWidth, flex: 1, backgroundColor: colors.card, borderLeftWidth: 1, borderLeftColor: colors.border }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
          {/* Customer */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 12, fontFamily: Fonts.body }}>Customer Info</Text>
            <View style={{ gap: 10 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground, marginBottom: 4 }}>Name * (CTRL+L)</Text>
                <TextInput
                  ref={customerNameRef}
                  style={{ width: '100%', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                  placeholder="Enter name..." placeholderTextColor={colors.mutedForeground}
                  value={customerName} onChangeText={setCustomerName}
                  onSubmitEditing={() => phoneRef.current?.focus()} returnKeyType="next" blurOnSubmit={false}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground, marginBottom: 4 }}>Phone *</Text>
                <TextInput
                  ref={phoneRef}
                  style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                  placeholder="Enter phone..." placeholderTextColor={colors.mutedForeground}
                  value={formatIdentityDisplay(phone)} onChangeText={t => setPhone(cleanIdentityInput(t))} keyboardType="phone-pad"
                  onSubmitEditing={() => emailRef.current?.focus()} returnKeyType="next" blurOnSubmit={false}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground, marginBottom: 4 }}>Email *</Text>
                <TextInput
                  ref={emailRef}
                  style={{ width: '100%', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.foreground, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                  placeholder="Enter email..." placeholderTextColor={colors.mutedForeground}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  onSubmitEditing={() => addressRef.current?.focus()} returnKeyType="next" blurOnSubmit={false}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground, marginBottom: 4 }}>Address</Text>
                <TextInput
                  ref={addressRef}
                  style={{ width: '100%', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.foreground, fontFamily: Fonts.body, minHeight: 60, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                  placeholder="Enter address..." placeholderTextColor={colors.mutedForeground}
                  value={address} onChangeText={setAddress} multiline
                  onSubmitEditing={() => discountRef.current?.focus()} returnKeyType="next" blurOnSubmit={false}
                />
              </View>
            </View>
          </View>

          {/* Summary */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 12, fontFamily: Fonts.body }}>Summary</Text>
            <View style={{ gap: 10 }}>
              {/* Subtotal */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Subtotal</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>₹{subTotal.toFixed(2)}</Text>
              </View>
              {/* Discount — inline on wide sidebar, stacked on compact */}
              {isCompact ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Discount</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.destructive }}>-{formatCurrency(discountAmount.toFixed(2))}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' }}>
                    <TextInput
                      ref={discountRef}
                      style={{ width: 44, fontSize: 13, textAlign: 'right', color: colors.foreground, padding: 0, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                      value={discountPct} onChangeText={setDiscountPct} keyboardType="numeric"
                      onSubmitEditing={() => gstCheckboxRef.current?.focus?.()}
                      returnKeyType="next" blurOnSubmit={false}
                    />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 2 }}>%</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Discount</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <TextInput
                        ref={discountRef}
                        style={{ width: 32, fontSize: 12, textAlign: 'right', color: colors.foreground, padding: 0, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                        value={discountPct} onChangeText={setDiscountPct} keyboardType="numeric"
                        onSubmitEditing={() => gstCheckboxRef.current?.focus?.()}
                        returnKeyType="next" blurOnSubmit={false}
                      />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 1 }}>%</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.destructive }}>-{formatCurrency(discountAmount.toFixed(2))}</Text>
                </View>
              )}
              {/* GST Toggle */}
              <TouchableOpacity
                ref={gstCheckboxRef}
                onPress={() => setGstEnabled(!gstEnabled)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: gstEnabled }}
              >
                <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: gstEnabled ? colors.primary : colors.border, backgroundColor: gstEnabled ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {gstEnabled && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 14 }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: gstEnabled ? colors.primary : colors.mutedForeground, fontFamily: Fonts.body }}>GST Billing (CTRL+G)</Text>
              </TouchableOpacity>
              {/* GST Controls */}
              {gstEnabled && (<>
                {/* GST Type — dropdown matching Payment Method pattern */}
                <View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>GST Type</Text>
                  <TouchableOpacity
                    ref={gstTypeRef}
                    onPress={() => setShowGstTypeDropdown(v => !v)}
                    style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: showGstTypeDropdown ? colors.primary : colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, fontFamily: Fonts.body }}>
                      {gstType === 'INSIDE_TN' ? 'Inside TN' : 'Outside TN'}
                    </Text>
                    <ChevronDown size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {showGstTypeDropdown && (
                    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: 2, overflow: 'hidden' }}>
                      {(['INSIDE_TN', 'OUTSIDE_TN'] as GSTType[]).map((t, i) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => { setGstType(t); setShowGstTypeDropdown(false); setTimeout(() => gstRateRef.current?.focus(), 50); }}
                          style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: gstType === t ? 'hsl(145,45%,94%)' : colors.card, borderBottomWidth: i < 1 ? 1 : 0, borderBottomColor: colors.border }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: gstType === t ? '700' : '400', color: gstType === t ? colors.primary : colors.foreground }}>
                            {t === 'INSIDE_TN' ? 'Inside TN' : 'Outside TN'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                {/* GST Rate — free numeric input (TAB chain: GST Type -> GST % -> Payment) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>GST %</Text>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <TextInput
                      ref={gstRateRef}
                      value={gstRateText}
                      onChangeText={t => setGstRateText(sanitizeGstInput(t))}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                      onSubmitEditing={() => { setShowPaymentDropdown(true); setTimeout(() => paymentDropdownRef.current?.focus?.(), 50); }}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      style={{ flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'right', color: colors.foreground, padding: 0, fontFamily: Fonts.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
                    />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 2 }}>%</Text>
                  </View>
                </View>
                {/* GST Breakup */}
                {gst.totalTaxAmount > 0 && (
                  <View style={{ backgroundColor: 'hsl(145,45%,96%)', borderRadius: 8, padding: 10, gap: 5, borderWidth: 1, borderColor: 'hsl(145,45%,88%)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Taxable</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>₹{gst.taxableAmount.toFixed(2)}</Text>
                    </View>
                    {gstType === 'INSIDE_TN' ? (<>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>CGST ({gst.cgstPercentage}%)</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>₹{gst.cgstAmount.toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>SGST ({gst.sgstPercentage}%)</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>₹{gst.sgstAmount.toFixed(2)}</Text>
                      </View>
                    </>) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>IGST ({gst.igstPercentage}%)</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>₹{gst.igstAmount.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>)}
            </View>
            <View style={{ marginTop: 14, backgroundColor: colors.foreground, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.card }}>Net Total</Text>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit
                style={{ fontSize: 22, fontWeight: '900', color: colors.card, flex: 1, textAlign: 'right', marginLeft: 8 }}
              >
                ₹{gst.grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

          {/* Payment + actions */}
          <View style={{ padding: 16, backgroundColor: 'hsl(40,15%,96%)' }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground, marginBottom: 6 }}>Payment Method (CTRL+P)</Text>
            <TouchableOpacity
              ref={paymentDropdownRef}
              onPress={() => setShowPaymentDropdown(v => !v)}
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: showPaymentDropdown ? colors.primary : colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPaymentDropdown ? 0 : 14 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, textTransform: 'capitalize' }}>{paymentMethod}</Text>
              <ChevronDown size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showPaymentDropdown && (
              <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
                {PAY_METHODS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => { setPaymentMethod(m); setShowPaymentDropdown(false); setTimeout(() => printButtonRef.current?.focus?.(), 50); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: paymentMethod === m ? 'hsl(145,45%,94%)' : colors.card, borderBottomWidth: m !== 'card' ? 1 : 0, borderBottomColor: colors.border }}
                  >
                    <Text style={{ fontSize: 13, textTransform: 'capitalize', fontWeight: paymentMethod === m ? '700' : '400', color: paymentMethod === m ? colors.primary : colors.foreground }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              ref={printButtonRef}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || cart.length === 0}
              style={{ backgroundColor: cart.length === 0 ? colors.mutedForeground : colors.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: saveMutation.isPending ? 0.7 : 1 }}
            >
              {saveMutation.isPending ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Printer size={17} color={colors.primaryForeground} />}
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryForeground }}>
                {saveMutation.isPending ? 'Saving...' : 'Print & Save'}
              </Text>
              {Platform.OS === 'web' && !isCompact && (
                <View style={{ backgroundColor: 'hsl(145,30%,20%)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primaryForeground }}>CTRL+I</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearCart}
              style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: colors.card }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.mutedForeground }}>New Bill</Text>
              {Platform.OS === 'web' && !isCompact && (
                <View style={{ backgroundColor: colors.muted, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.mutedForeground }}>CTRL+N</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CreateBill = () => {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const queryClient = useQueryClient();
  // Live dimension tracking – reacts to browser resize & orientation change
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = Platform.OS === 'android' || (Platform.OS === 'web' && windowWidth < MOBILE_BREAKPOINT);

  // Sidebar scales with window width:
  //  768-1023px  → 260px compact   (tablet / narrow desktop)
  //  1024-1365px → 296px standard
  //  ≥1366px     → 320px wide
  const sidebarWidth = windowWidth < 1024 ? 260 : windowWidth < 1366 ? 296 : 320;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<TextInput>(null);
  const qtyInputRef = useRef<TextInput>(null);
  const customerNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const discountRef = useRef<TextInput>(null);
  // GST keyboard-flow refs: checkbox -> type dropdown -> rate input -> payment -> print
  const gstCheckboxRef = useRef<View>(null);
  const gstTypeRef = useRef<View>(null);
  const gstRateRef = useRef<TextInput>(null);
  const paymentDropdownRef = useRef<View>(null);
  const printButtonRef = useRef<View>(null);
  const pendingProductRef = useRef<Product | null>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [qtyText, setQtyText] = useState('1');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  // GST state
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstType, setGstType] = useState<GSTType>('INSIDE_TN');
  const [gstRateText, setGstRateText] = useState('18');
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('cash');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showGstTypeDropdown, setShowGstTypeDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 250);

  // ── Focus helpers ──────────────────────────────────────────────────────────
  const focusSearch = useCallback(() => { setTimeout(() => searchInputRef.current?.focus(), 50); }, []);
  const focusQty = useCallback(() => { setTimeout(() => qtyInputRef.current?.focus(), 50); }, []);
  const focusCustomer = useCallback(() => { setTimeout(() => customerNameRef.current?.focus(), 50); }, []);
  const focusPayment = useCallback(() => setShowPaymentDropdown(true), []);

  // Auto-focus search on mount (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [isMobile]);

  // ── Product search ─────────────────────────────────────────────────────────
  const { data: searchResults = [], isFetching: isSearchFetching } = useQuery({
    queryKey: ['products-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { data } = await api.get(`/products?search=${encodeURIComponent(debouncedSearch)}&limit=20&status=true`);
      const list = [data, data?.data, data?.data?.data].find(Array.isArray);
      return (list ?? []) as Product[];
    },
    enabled: debouncedSearch.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => { setHighlightedIndex(0); }, [searchResults]);

  // ── Cart operations ────────────────────────────────────────────────────────
  const addToCart = useCallback((product: Product, qty: number) => {
    const price = parseFloat(product.sellingPrice) || 0;
    // DB: products.stock is a plain integer column
    const stock = product.stock ?? 0;
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * i.price, stock } : i);
      return [...prev, { productId: product.id, name: product.name, price, qty, total: price * qty, stock }];
    });
  }, []);

  const increaseQty = useCallback((productId: string) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i));
  }, []);

  const decreaseQty = useCallback((productId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(i => i.productId !== productId);
      return prev.map(i => i.productId === productId ? { ...i, qty: i.qty - 1, total: (i.qty - 1) * i.price } : i);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
    setSelectedCartId(null);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]); setSelectedCartId(null);
    setCustomerName(''); setPhone(''); setEmail(''); setAddress('');
    setDiscountPct('0');
    setGstEnabled(false); setGstType('INSIDE_TN'); setGstRateText('18');
    setPaymentMethod('cash');
    focusSearch();
  }, [focusSearch]);

  // Desktop: select product → focus qty field
  // Mobile: called with qty already determined
  const handleSelectProduct = useCallback((product: Product, qty?: number) => {
    if (qty !== undefined) {
      addToCart(product, qty);
      return;
    }
    pendingProductRef.current = product;
    setSearchQuery('');
    setIsSearchFocused(false);
    setQtyText('1');
    focusQty();
  }, [addToCart, focusQty]);

  const confirmAdd = useCallback(() => {
    const product = pendingProductRef.current;
    if (!product) { focusSearch(); return; }
    addToCart(product, Math.max(1, parseInt(qtyText, 10) || 1));
    pendingProductRef.current = null;
    setSearchQuery('');
    setQtyText('1');
    focusSearch();
  }, [qtyText, addToCart, focusSearch]);

  // ── Totals + GST ──────────────────────────────────────────────────────────
  const { subTotal, discountAmount, gst } = useMemo(() => {
    const sub = parseFloat(cart.reduce((s, i) => s + i.total, 0).toFixed(2));
    const disc = parseFloat((sub * (parseFloat(discountPct) || 0) / 100).toFixed(2));
    const parsedGstRate = Math.min(100, Math.max(0, parseFloat(gstRateText) || 0));
    const g = calcGST(sub, disc, gstEnabled, gstType, parsedGstRate);
    return { subTotal: sub, discountAmount: disc, gst: g };
  }, [cart, discountPct, gstEnabled, gstType, gstRateText]);

  // ── Save mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error('Cart is empty');
      if (!customerName.trim()) throw new Error('Customer Name is required');
      if (!phone.trim()) throw new Error('Customer Phone is required');
      if (!email.trim()) throw new Error('Customer Email is required');

      const { data: custData } = await api.post('/customers/upsert', {
        name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
      });
      const customerId = custData?.data?.id ?? custData?.id;
      return api.post('/invoices', {
        customerId, paymentMethod,
        subTotal: subTotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        taxAmount: gst.totalTaxAmount.toFixed(2),
        totalAmount: gst.grandTotal.toFixed(2),
        // GST breakdown
        gstEnabled: gst.gstEnabled,
        gstType: gst.gstType,
        gstPercentage: gst.gstPercentage,
        taxableAmount: gst.taxableAmount.toFixed(2),
        cgstPercentage: gst.cgstPercentage,
        cgstAmount: gst.cgstAmount.toFixed(2),
        sgstPercentage: gst.sgstPercentage,
        sgstAmount: gst.sgstAmount.toFixed(2),
        igstPercentage: gst.igstPercentage,
        igstAmount: gst.igstAmount.toFixed(2),
        items: cart.map(i => ({
          productId: i.productId, productName: i.name,
          quantity: i.qty, unitPrice: i.price.toFixed(2), totalPrice: i.total.toFixed(2),
        })),
      });
    },
    onSuccess: (res) => {
      const invoice = res.data?.data ?? res.data;
      toast.success(`Invoice ${invoice?.invoiceNumber ?? ''} saved!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (invoice?.id) {
        api.get(`/invoices/${invoice.id}/token`).then(({ data }) => {
          const token = data?.data?.token;
          if (token) navigation.navigate('PdfViewer', { uri: `${api.defaults.baseURL}/invoices/pdf/${token}?template=3`, title: `Invoice ${invoice.invoiceNumber}` });
        }).catch(() => { });
      }
      clearCart();
    },
    onError: (e) => toast.apiError(e, 'Failed to save invoice'),
  });

  // ── Desktop keyboard shortcuts ─────────────────────────────────────────────
  // CRITICAL FIX: the previous version applied cart-navigation shortcuts
  // (ArrowUp/Down, +, -, Delete) globally on `window`, even while the operator
  // was typing inside the discount, GST%, customer, or any other text field.
  // That stole keystrokes mid-typing (e.g. typing "18" into GST% would also
  // try to move the cart selection or trigger qty changes). The fix below
  // checks document.activeElement and skips ALL cart-navigation shortcuts
  // whenever an <input>, <textarea>, or contentEditable element is focused.
  // Global app shortcuts (CTRL+F/L/I/N/P/G) still work everywhere, since
  // they're modifier-based and don't conflict with normal typing.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || isMobile) return;

    const isTypingInField = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = (e.key || '').toLowerCase();

      // ── Global modifier shortcuts: always active, regardless of focus ──
      if (ctrl && ['f', 'l', 'i', 'n', 'p', 'g'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'f') focusSearch();
        else if (key === 'l') focusCustomer();
        else if (key === 'i') saveMutation.mutate();
        else if (key === 'n') clearCart();
        else if (key === 'p') focusPayment();
        else if (key === 'g') gstCheckboxRef.current?.focus?.();
        return;
      }

      // ── Product search dropdown navigation (only while search is open) ──
      const showDropdown = isSearchFocused && searchQuery.length > 0;
      if (showDropdown && searchResults.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, searchResults.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Escape') { setSearchQuery(''); setIsSearchFocused(false); }
        return;
      }

      // ── Cart row navigation: ONLY when the operator is NOT typing anywhere ──
      // This guard is the actual fix — without it, arrow keys, +, -, and
      // Delete would hijack input fields across the entire screen.
      if (!showDropdown && !isTypingInField() && cart.length > 0) {
        const idx = cart.findIndex(i => i.productId === selectedCartId);
        if (e.key === 'ArrowDown' && !ctrl) { e.preventDefault(); setSelectedCartId(cart[Math.min(idx + 1, cart.length - 1)].productId); }
        else if (e.key === 'ArrowUp' && !ctrl) { e.preventDefault(); setSelectedCartId(cart[Math.max(idx - 1, 0)].productId); }
        else if (selectedCartId) {
          if (e.key === '+' || (ctrl && e.key === 'ArrowUp')) { e.preventDefault(); increaseQty(selectedCartId); }
          else if (e.key === '-' || (ctrl && e.key === 'ArrowDown')) { e.preventDefault(); decreaseQty(selectedCartId); }
          else if (e.key === 'Delete') { e.preventDefault(); removeFromCart(selectedCartId); }
        }
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
    }, [isMobile, isSearchFocused, searchQuery, searchResults, cart, selectedCartId, focusSearch, focusCustomer, focusPayment, clearCart, increaseQty, decreaseQty, removeFromCart, saveMutation])
  );

  // ── Shared prop bundle ─────────────────────────────────────────────────────
  const shared: SharedProps = {
    searchQuery, setSearchQuery, qtyText, setQtyText,
    highlightedIndex, setHighlightedIndex, cart,
    customerName, setCustomerName, phone, setPhone, email, setEmail, address, setAddress,
    discountPct, setDiscountPct,
    gstEnabled, setGstEnabled, gstType, setGstType, gstRateText, setGstRateText, gst,
    paymentMethod, setPaymentMethod,
    showPaymentDropdown, setShowPaymentDropdown,
    showGstTypeDropdown, setShowGstTypeDropdown,
    isSearchFocused, setIsSearchFocused,
    searchResults, isSearchFetching,
    subTotal, discountAmount,
    selectedCartId, setSelectedCartId,
    increaseQty, decreaseQty, removeFromCart, clearCart,
    saveMutation, handleSelectProduct, confirmAdd,
    focusSearch, focusCustomer, focusPayment,
    searchInputRef, qtyInputRef, customerNameRef,
    phoneRef, emailRef, addressRef, discountRef,
    gstCheckboxRef, gstTypeRef, gstRateRef, paymentDropdownRef, printButtonRef,
    pendingProductRef,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isMobile ? <MobileCreateBill {...shared} /> : <DesktopCreateBill {...shared} sidebarWidth={sidebarWidth} />}
    </KeyboardAvoidingView>
  );
};

export default CreateBill;