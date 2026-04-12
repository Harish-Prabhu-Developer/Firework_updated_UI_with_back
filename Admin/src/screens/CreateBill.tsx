import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, StatusBar } from "react-native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import { ArrowLeft, Plus, Trash2, Save, Mic, ShoppingCart } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { cn } from "../lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../hooks/useToast";

interface CartItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  total: number;
}

const sampleProducts = [
  { name: "Flower Pots Small", price: 60 },
  { name: "Classic Laxmi Bomb", price: 25 },
  { name: "Sparkler Pack 10", price: 150 },
  { name: "Sky Shot 30", price: 500 },
  { name: "Ground Chakra", price: 80 },
];

export default function CreateBill() {
  const navigation = useNavigation<any>();
  const [customer, setCustomer] = useState({ phone: "", name: "", email: "", address: "" });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [showProductSelect, setShowProductSelect] = useState(false);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const addProduct = (productName: string) => {
    const product = sampleProducts.find((p) => p.name === productName);
    if (!product) return;
    const existing = cart.find((c) => c.productName === productName);
    if (existing) {
      setCart(cart.map((c) => c.productName === productName ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price } : c));
    } else {
      setCart([...cart, { id: String(Date.now()), productName: product.name, qty: 1, price: product.price, total: product.price }]);
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
    if (!customer.phone) {
      toast.error("Phone number is required");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    toast.success("Bill saved successfully!");
  };

  return (
    <View className="flex-1 bg-background" style={{ height: Platform.OS === 'web' ? ('100vh' as any) : '100%' }}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView className="flex-1 p-4 md:p-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#1e293b" />
            </Button>
            <Text className="text-2xl font-bold text-foreground">Create Bill</Text>
          </View>

          {/* Customer Details */}
          <Card className="mb-6 p-4 md:p-6">
            <Text className="font-semibold text-lg mb-4 text-foreground">Customer Details</Text>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-full md:w-1/2 px-2 mb-4">
                <Input
                  label="Phone Number *"
                  keyboardType="phone-pad"
                  value={customer.phone}
                  onChangeText={(v) => setCustomer({ ...customer, phone: v })}
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
                  onChangeText={(v) => setCustomer({ ...customer, email: v })}
                  placeholder="Email address"
                />
              </View>
              <View className="w-full md:w-1/2 px-2 mb-4">
                <Input
                  label="Address"
                  value={customer.address}
                  onChangeText={(v) => setCustomer({ ...customer, address: v })}
                  placeholder="Street, City, State"
                />
              </View>
            </View>
          </Card>

          {/* Cart Section */}
          <Card className="mb-6 p-4 md:p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <ShoppingCart size={20} color="#1e293b" />
                <Text className="font-semibold text-lg text-foreground">Items</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Button variant="outline" size="sm" className="px-2" onPress={() => { }}>
                  <Mic size={14} color="#64748b" />
                </Button>
                <Button size="sm" onPress={() => setShowProductSelect(true)} label="+ Add" />
              </View>
            </View>

            {cart.length === 0 ? (
              <View className="py-10 items-center">
                <ShoppingCart size={40} color="#cbd5e1" />
                <Text className="text-muted-foreground mt-2">Cart is empty</Text>
              </View>
            ) : (
              <View className="border border-border rounded-lg overflow-hidden">
                {/* Header for Table-like view */}
                <View className="flex-row bg-muted/50 p-2 border-b border-border">
                  <Text className="flex-1 text-xs font-bold text-muted-foreground uppercase">Item</Text>
                  <Text className="w-16 text-center text-xs font-bold text-muted-foreground uppercase">Qty</Text>
                  <Text className="w-20 text-right text-xs font-bold text-muted-foreground uppercase">Total</Text>
                  <View className="w-10" />
                </View>

                {cart.map((item) => (
                  <View key={item.id} className="flex-row items-center p-2 border-b border-border">
                    <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>{item.productName}</Text>
                    <View className="w-16 items-center">
                      <Input
                        value={String(item.qty)}
                        onChangeText={(v) => updateQty(item.id, v)}
                        keyboardType="numeric"
                        className="h-8 w-12 text-center text-xs p-0"
                      />
                    </View>
                    <Text className="w-20 text-right text-sm font-bold">₹{item.total.toFixed(0)}</Text>
                    <Pressable onPress={() => removeItem(item.id)} className="w-10 items-center">
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="mb-6 p-4 md:p-6">
            <Text className="font-semibold text-lg mb-4 text-foreground">Payment Method</Text>
            <View className="flex-row gap-2">
              {["Cash", "UPI", "Card"].map((m) => (
                <Button
                  key={m}
                  variant={paymentMethod === m ? "default" : "outline"}
                  onPress={() => setPaymentMethod(m)}
                  className="flex-1"
                  label={m}
                />
              ))}
            </View>
          </Card>

          {/* Adjustments */}
          <Card className="mb-10 p-4 md:p-6">
            <Text className="font-semibold text-lg mb-4 text-foreground">Adjustments & Notes</Text>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Input label="Discount (₹)" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Input label="Tax (₹)" keyboardType="numeric" value={tax} onChangeText={setTax} />
              </View>
            </View>
            <Textarea
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
            />
          </Card>

        </ScrollView>
        {/* Sticky Total Footer */}
        <View
          className="bg-card border-t border-border flex-row items-center justify-between px-6 pt-4"
          style={{
            paddingBottom: Math.max(insets.bottom, 24),

            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <View className="flex-1 mr-4">
            <Text className="text-xs text-muted-foreground uppercase font-bold" numberOfLines={1}>
              Total Amount
            </Text>
            <Text className="text-2xl font-bold text-primary" numberOfLines={1}>
              ₹{finalTotal.toLocaleString()}
            </Text>
          </View>
          <Button
            onPress={handleSave}
            className="px-8 h-12 rounded-xl"
            label="Generate Bill"
            textClassName="text-lg font-bold"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Product Selection Overlay (Simplified) */}
      {showProductSelect && (
        <View className="absolute inset-0 bg-black/60 z-50 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <View className="p-4 border-b border-border flex-row justify-between items-center">
              <Text className="font-bold text-lg">Select Product</Text>
              <Pressable onPress={() => setShowProductSelect(false)}>
                <Text className="text-muted-foreground">Close</Text>
              </Pressable>
            </View>
            <ScrollView className="max-h-80">
              {sampleProducts.map((p) => (
                <Pressable
                  key={p.name}
                  onPress={() => addProduct(p.name)}
                  className="p-4 border-b border-border active:bg-muted"
                >
                  <Text className="font-medium">{p.name}</Text>
                  <Text className="text-xs text-muted-foreground">Price: ₹{p.price}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Card>
        </View>
      )}
    </View >
  );
}
