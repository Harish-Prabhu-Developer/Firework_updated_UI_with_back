import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, StatusBar, TouchableOpacity } from "react-native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import { ArrowLeft, Plus, Trash2, Save, Mic, ShoppingCart } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { cn } from "../lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../hooks/useToast";
import Voice from '@react-native-voice/voice';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";
import { formatIdentityDisplay, cleanIdentityInput } from "../utils/Formatter";

interface Product {
  id: string;
  name: string;
  sellingPrice: string;
  mrp: string;
}

interface CartItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  total: number;
}

// Slice-like hook for Billing operations
export const useCreateBillQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products-active'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=999999&isActive=true');
      return data.data?.data ?? data.data ?? [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => api.post('/invoices', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Bill generated successfully!');
    },
    onError: (e) => toast.apiError(e, 'Failed to generate bill'),
  });

  return { products: productsQuery.data || [], isLoading: productsQuery.isLoading, save: saveMutation };
};

export default function CreateBill() {
  const navigation = useNavigation<any>();
  const { products, isLoading, save } = useCreateBillQueries();

  const [customer, setCustomer] = useState({ phone: "", name: "", email: "", address: "" });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [tax, setTax] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const insets = useSafeAreaInsets();
  const toast = useToast();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Voice.onSpeechStart = () => setIsListening(true);
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechResults = (e: any) => {
        const alternatives = e.value || [];
        if (alternatives.length > 0) {
          toast.success("Voice Captured: " + alternatives[0]);
        }
        setIsListening(false);
      };
      Voice.onSpeechError = (e: any) => {
        console.error("Native Voice Error: ", e.error);
        setIsListening(false);
      };
      return () => { Voice.destroy().then(Voice.removeAllListeners); };
    }
  }, []);

  const handleMicPress = async () => {
    if (isListening) {
      if (Platform.OS !== 'web') await Voice.stop();
      setIsListening(false);
      return;
    }
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        Alert.alert("Not Supported", "Voice recognition is not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; recognition.interimResults = false; recognition.maxAlternatives = 5;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => { setIsListening(false); };
      recognition.onresult = (e: any) => {
        const result = e.results[0][0].transcript;
        toast.success("Voice Captured: " + result);
      };
      recognition.start();
    } else {
      try { await Voice.start('en-US'); } catch (e) { console.error("Voice start failed", e); }
    }
  };

  const addProduct = (product: Product) => {
    const existing = cart.find((c) => c.id === product.id);
    const itemPrice = parseFloat(product.sellingPrice) || 0;

    if (existing) {
      setCart(cart.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price } : c));
    } else {
      setCart([...cart, {
        id: product.id,
        productName: product.name,
        qty: 1,
        price: itemPrice,
        total: itemPrice
      }]);
    }
    setShowProductSelect(false);
  };

  const updateQty = (id: string, qtyStr: string) => {
    const qty = parseInt(qtyStr) || 1;
    setCart(cart.map((c) => c.id === id ? { ...c, qty, total: qty * c.price } : c));
  };
  const removeItem = (id: string) => setCart(cart.filter((c) => c.id !== id));
  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.total, 0), [cart]);
  const finalTotal = subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

  const handleSave = () => {
    if (!customer.phone) { toast.error("Phone number is required"); return; }
    if (cart.length === 0) { toast.error("Add at least one product"); return; }

    const payload = {
      CustomerData: {
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        address: customer.address,
      },
      items: cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.price })),
      discountAmount: Number(discount),
      taxAmount: Number(tax),
      paymentMethod: paymentMethod.toLowerCase(),
      notes,
    };

    save.mutate(payload, {
      onSuccess: () => {
        setCart([]);
        setCustomer({ phone: "", name: "", email: "", address: "" });
        setDiscount("0");
        setTax("0");
        setNotes("");
        navigation.navigate('BillHistory');
      }
    });
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onPress={() => navigation.goBack()}>
                <ArrowLeft size={20} color={colors.foreground} />
              </Button>
              <Text className="text-2xl font-bold text-foreground" style={{ fontFamily: Fonts.display }}>Create Bill</Text>
            </View>

            {/* Customer Details */}
            <Card className="mb-6 p-4 md:p-6">
              <Text className="font-semibold text-lg mb-4 text-foreground" style={{ fontFamily: Fonts.display }}>Customer Details</Text>
              <View className="flex-row flex-wrap -mx-2">
                <View className="w-full md:w-1/2 px-2 mb-4">
                  <Input
                    label="Phone Number"
                    required={true}
                    keyboardType="phone-pad"
                    value={customer.phone}
                    onChangeText={(v) => setCustomer({ ...customer, phone: formatIdentityDisplay(v) })}
                    placeholder="Enter phone number"
                  />
                </View>
                <View className="w-full md:w-1/2 px-2 mb-4">
                  <Input
                    label="Name"
                    value={customer.name}
                    onChangeText={(v) => setCustomer({ ...customer, name: v })}
                    placeholder="Customer name"
                  />
                </View>
                <View className="w-full md:w-1/2 px-2 mb-4">
                  <Input
                    label="Email"
                    keyboardType="email-address"
                    value={customer.email}
                    onChangeText={(v) => setCustomer({ ...customer, email: formatIdentityDisplay(v) })}
                    placeholder="Email address"
                  />
                </View>
                <View className="w-full px-2 mb-4">
                  <Textarea
                    label="Address"
                    value={customer.address}
                    onChangeText={(v) => setCustomer({ ...customer, address: v })}
                    placeholder="Street, City, State"
                    rows={3}
                  />
                </View>
              </View>
            </Card>

            {/* Cart Section */}
            <Card className="mb-6 p-4 md:p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <ShoppingCart size={20} color={colors.foreground} />
                  <Text className="font-semibold text-lg text-foreground" style={{ fontFamily: Fonts.display }}>Items</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {/* <Button variant={isListening ? "default" : "outline"} size="sm" className={cn("px-2", isListening && "bg-destructive")} onPress={handleMicPress}>
                    <Mic size={14} color={isListening ? colors.destructiveForeground : colors.mutedForeground} />
                  </Button> */}
                  <Button size="sm" onPress={() => setShowProductSelect(true)} label="+ Add" />
                </View>
              </View>

              {cart.length === 0 ? (
                <View className="py-10 items-center">
                  <ShoppingCart size={40} color={colors.border} />
                  <Text className="text-muted-foreground mt-2" style={{ fontFamily: Fonts.body }}>Cart is empty</Text>
                </View>
              ) : (
                <View className="border border-border rounded-xl overflow-hidden">
                  <View className="flex-row bg-muted px-3 py-2.5 border-b border-border">
                    <Text className="flex-1 text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Item</Text>
                    <Text className="w-16 text-center text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Qty</Text>
                    <Text className="w-24 text-right text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Total</Text>
                    <View className="w-10" />
                  </View>

                  {cart.map((item) => (
                    <View key={item.id} className="flex-row items-center px-3 py-2 border-b border-border/50">
                      <Text className="flex-1 text-sm font-medium text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{item.productName}</Text>
                      <View className="flex-row items-center gap-1">
                        <TouchableOpacity
                          onPress={() => updateQty(item.id, String(Math.max(1, item.qty - 1)))}
                          className="w-7 h-7 rounded-lg bg-muted items-center justify-center border border-border"
                        >
                          <Text className="text-base font-black text-foreground leading-none">−</Text>
                        </TouchableOpacity>
                        <Input
                          value={String(item.qty)}
                          onChangeText={(v) => updateQty(item.id, v)}
                          keyboardType="numeric"
                          className="h-8 w-10 text-center text-xs p-0"
                        />
                        <TouchableOpacity
                          onPress={() => updateQty(item.id, String(item.qty + 1))}
                          className="w-7 h-7 rounded-lg bg-primary items-center justify-center"
                        >
                          <Text className="text-base font-black text-primary-foreground leading-none">+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text className="w-24 text-right text-sm font-bold text-foreground" style={{ fontFamily: Fonts.body }}>₹{item.total.toFixed(0)}</Text>
                      <Pressable onPress={() => removeItem(item.id)} className="w-10 items-center">
                        <Trash2 size={16} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="mb-6 p-4 md:p-6">
              <Text className="font-semibold text-lg mb-4 text-foreground" style={{ fontFamily: Fonts.display }}>Payment Method</Text>
              <View className="flex-row gap-2">
                {["Cash", "UPI", "Card"].map((m) => (
                  <Button key={m} variant={paymentMethod === m ? "default" : "outline"} onPress={() => setPaymentMethod(m)} className="flex-1" label={m} />
                ))}
              </View>
            </Card>

            {/* Adjustments */}
            <Card className="mb-10 p-4 md:p-6">
              <Text className="font-semibold text-lg mb-4 text-foreground" style={{ fontFamily: Fonts.display }}>Adjustments & Notes</Text>
              <View className="flex-row -mx-2 mb-4">
                <View className="w-1/2 px-2">
                  <Input
                    label="Discount (%)"
                    keyboardType="numeric"
                    value={discountPercent}
                    onChangeText={(v) => {
                      setDiscountPercent(v);
                      const val = parseFloat(v) || 0;
                      setDiscount(((val / 100) * subtotal).toFixed(2));
                    }}
                  />
                  {parseFloat(discount || '0') > 0 && (
                    <View className="mt-1.5 flex-row items-center gap-1">
                      <Text className="text-[10px] font-black text-destructive" style={{ fontFamily: Fonts.body }}>
                        -₹{parseFloat(discount).toLocaleString()} ({discountPercent}%)
                      </Text>
                    </View>
                  )}
                </View>
                <View className="w-1/2 px-2">
                  <Input
                    label="Tax (%)"
                    keyboardType="numeric"
                    value={taxPercent}
                    onChangeText={(v) => {
                      setTaxPercent(v);
                      const val = parseFloat(v) || 0;
                      setTax(((val / 100) * subtotal).toFixed(2));
                    }}
                  />
                  {parseFloat(tax || '0') > 0 && (
                    <View className="mt-1.5 flex-row items-center gap-1">
                      <Text className="text-[10px] font-black text-success" style={{ fontFamily: Fonts.body }}>
                        +₹{parseFloat(tax).toLocaleString()} ({taxPercent}%)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Textarea label="Notes" value={notes} onChangeText={setNotes} placeholder="Add any notes..." />
            </Card>
          </ScrollView>

          {/* Sticky Total Footer */}
          <View
            className="bg-card border-t border-border px-6 pt-3"
            style={{
              paddingBottom: Math.max(insets.bottom, 16),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 20
            }}
          >
            {/* Summary breakdown row */}
            <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-border/50">
              <View>
                <Text className="text-[9px] text-muted-foreground uppercase font-black" style={{ fontFamily: Fonts.body }}>Subtotal</Text>
                <Text className="text-xs font-bold text-foreground" style={{ fontFamily: Fonts.body }}>₹{subtotal.toLocaleString()}</Text>
              </View>
              {parseFloat(discount || '0') > 0 && (
                <View className="items-center">
                  <Text className="text-[9px] text-muted-foreground uppercase font-black" style={{ fontFamily: Fonts.body }}>Discount</Text>
                  <Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>
                    -₹{parseFloat(discount).toLocaleString()} ({discountPercent}%)
                  </Text>
                </View>
              )}
              {parseFloat(tax || '0') > 0 && (
                <View className="items-end">
                  <Text className="text-[9px] text-muted-foreground uppercase font-black" style={{ fontFamily: Fonts.body }}>Tax</Text>
                  <Text className="text-xs font-bold text-success" style={{ fontFamily: Fonts.body }}>
                    +₹{parseFloat(tax).toLocaleString()} ({taxPercent}%)
                  </Text>
                </View>
              )}
            </View>

            {/* Grand total + action */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-[10px] text-muted-foreground uppercase font-black mb-1" style={{ fontFamily: Fonts.body }}>Total Amount</Text>
                <Text className="text-3xl font-black text-primary" style={{ fontFamily: Fonts.display }}>₹{finalTotal.toLocaleString()}</Text>
              </View>
              <Button onPress={handleSave} className="px-10 h-14 rounded-2xl shadow-lg shadow-primary/20" label="Generate Bill" textClassName="text-lg font-bold" />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Product Selection Overlay */}
      {showProductSelect && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center p-6">
          <Card className="w-full max-w-sm" style={{ borderRadius: Radius.xxl }}>
            <View className="p-4 border-b border-border flex-row justify-between items-center bg-muted/30">
              <Text className="font-black text-lg text-foreground" style={{ fontFamily: Fonts.display }}>Select Product</Text>
              <Pressable onPress={() => setShowProductSelect(false)} className="w-8 h-8 rounded-full bg-muted items-center justify-center">
                <Text className="text-muted-foreground font-bold">✕</Text>
              </Pressable>
            </View>
            <ScrollView className="max-h-80">
              {products.map((p: Product) => (
                <Pressable key={p.id} onPress={() => addProduct(p)} className="p-4 border-b border-border/50 active:bg-primary/5">
                  <Text className="font-bold text-foreground" style={{ fontFamily: Fonts.body }}>{p.name}</Text>
                  <Text className="text-xs text-primary font-semibold mt-0.5">₹{parseFloat(p.sellingPrice).toFixed(2)}</Text>
                </Pressable>
              ))}
              {products.length === 0 && !isLoading && (
                <View className="p-8 items-center"><Text className="text-muted-foreground">No active products found</Text></View>
              )}
              {isLoading && (
                <View className="p-8 items-center"><Text className="text-muted-foreground">Loading products...</Text></View>
              )}
            </ScrollView>
          </Card>
        </View>
      )}
    </View >
  );
}

