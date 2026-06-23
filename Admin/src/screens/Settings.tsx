import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { useToast } from '../hooks/useToast';
import { useActionPermissions } from '../hooks/usePermissions';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Save, Settings2, Share2, ShoppingBag, Globe, MessageSquare } from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { formatIdentityDisplay, cleanIdentityInput } from '../utils/Formatter';

interface ShopSettings {
  id?: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopGst?: string;
  shopEmail: string;
  minimumOrder: number;
  whatsappNum: string;
  socialMedias: {
    instagram: string;
    facebook: string;
  };
  salesStatus: boolean;
  orderReceiptQrStatus: boolean;
  invoiceQrStatus: boolean;
  siteDiscount: string;
}

// Slice-like hook for Settings operations
export const useSettingsQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery<ShopSettings>({ queryKey: ['settings'], queryFn: async () => { const { data } = await api.get('/settings'); return data.data; } });

  const saveMutation = useMutation({
    mutationFn: (p: ShopSettings) => api.post('/settings', p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved successfully'); },
    onError: (e) => toast.apiError(e, 'Failed to save'),
  });

  return { query, save: saveMutation };
};

export default function Settings() {
  const { query, save } = useSettingsQueries();
  const settings = query.data;
  const isLoading = query.isLoading;
  const { canUpdate } = useActionPermissions('Settings');
  const [form, setForm] = useState<ShopSettings>({
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    shopGst: '',
    shopEmail: '',
    minimumOrder: 3000,
    whatsappNum: '',
    socialMedias: { instagram: '', facebook: '' },
    salesStatus: true,
    orderReceiptQrStatus: true,
    invoiceQrStatus: true,
    siteDiscount: '0'
  });

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName ?? '',
        shopPhone: settings.shopPhone ?? '',
        shopAddress: settings.shopAddress ?? '',
        shopGst: settings.shopGst ?? '',
        shopEmail: settings.shopEmail ?? '',
        minimumOrder: settings.minimumOrder ?? 3000,
        whatsappNum: settings.whatsappNum ?? '',
        socialMedias: settings.socialMedias ?? { instagram: '', facebook: '' },
        salesStatus: settings.salesStatus ?? true,
        orderReceiptQrStatus: settings.orderReceiptQrStatus ?? true,
        invoiceQrStatus: settings.invoiceQrStatus ?? true,
        siteDiscount: settings.siteDiscount ?? '0'
      });
    }
  }, [settings]);

  if (isLoading) return (
    <MasterScreenLayout title="Settings" module="Settings">
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </MasterScreenLayout>
  );

  return (
    <MasterScreenLayout title="Settings" subtitle="Shop configuration" module="Settings">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-col lg:flex-row lg:gap-8 lg:items-start">

          {/* Main Column - Shop Details */}
          <View className="flex-1 lg:max-w-3xl">
            <Card className="mb-6">
              <View className="p-4 border-b border-border flex-row items-center gap-2">
                <Settings2 size={18} color={colors.primary} />
                <Text style={{ fontFamily: Fonts.display }} className="font-black text-base text-foreground">Shop Information</Text>
              </View>
              <View className="p-4 gap-4">
                <Input label="Shop Name" required value={form.shopName} onChangeText={v => setForm({ ...form, shopName: v })} placeholder="e.g. Crackers Kingdom" />
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Input
                      label="Phone Number"
                      required
                      value={formatIdentityDisplay(form.shopPhone)}
                      onChangeText={v => setForm({ ...form, shopPhone: cleanIdentityInput(v) })}
                      keyboardType="phone-pad"
                      placeholder="+91 00000 00000"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="WhatsApp Number"
                      required
                      value={formatIdentityDisplay(form.whatsappNum)}
                      onChangeText={v => setForm({ ...form, whatsappNum: cleanIdentityInput(v) })}
                      keyboardType="phone-pad"
                      placeholder="+91 00000 00000"
                    />
                  </View>
                </View>
                <Input label="Shop Email" value={form.shopEmail} onChangeText={v => setForm({ ...form, shopEmail: v })} keyboardType="email-address" placeholder="contact@example.com" />
                <Input label="Address" required value={form.shopAddress} onChangeText={v => setForm({ ...form, shopAddress: v })} placeholder="Street, City, State, PIN" multiline />
                <Input label="GSTIN (Optional)" value={form.shopGst} onChangeText={v => setForm({ ...form, shopGst: v })} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />
              </View>
            </Card>
          </View>

          {/* Sidebar Column - Config & Status */}
          <View className="lg:w-[400px]">
            {/* Store Status & Features */}
            <Card className="mb-6">
              <View className="p-4 border-b border-border flex-row items-center gap-2">
                <Globe size={18} color={colors.primary} />
                <Text style={{ fontFamily: Fonts.display }} className="font-black text-base text-foreground">Store Status & Features</Text>
              </View>
              <View className="p-4 gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text style={{ fontFamily: Fonts.display }} className="text-sm font-bold text-foreground">Accepting Orders</Text>
                    <Text className="text-xs text-muted-foreground">Enable or disable store sales</Text>
                  </View>
                  <Switch
                    value={form.salesStatus}
                    onValueChange={v => setForm({ ...form, salesStatus: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-border/50">
                  <View className="flex-1 mr-4">
                    <Text style={{ fontFamily: Fonts.display }} className="text-sm font-bold text-foreground">Order Receipt QR</Text>
                    <Text className="text-xs text-muted-foreground">Show payment QR on order receipts</Text>
                  </View>
                  <Switch
                    value={form.orderReceiptQrStatus}
                    onValueChange={v => setForm({ ...form, orderReceiptQrStatus: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-border/50">
                  <View className="flex-1 mr-4">
                    <Text style={{ fontFamily: Fonts.display }} className="text-sm font-bold text-foreground">Invoice QR</Text>
                    <Text className="text-xs text-muted-foreground">Show QR code on tax invoices</Text>
                  </View>
                  <Switch
                    value={form.invoiceQrStatus}
                    onValueChange={v => setForm({ ...form, invoiceQrStatus: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>
            </Card>

            {/* Order Settings */}
            <Card className="mb-6">
              <View className="p-4 border-b border-border flex-row items-center gap-2">
                <ShoppingBag size={18} color={colors.primary} />
                <Text style={{ fontFamily: Fonts.display }} className="font-black text-base text-foreground">Order Configuration</Text>
              </View>
              <View className="p-4">
                <Input
                  label="Min. Order (₹)"
                  required
                  value={form.minimumOrder.toString()}
                  onChangeText={v => setForm({ ...form, minimumOrder: parseInt(v) || 0 })}
                  keyboardType="numeric"
                  placeholder="3000"
                />
                <Input
                  label="Site Discount (%)"
                  value={form.siteDiscount}
                  onChangeText={v => setForm({ ...form, siteDiscount: v })}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                />
              </View>
            </Card>

            {/* Social Media */}
            <Card className="mb-6">
              <View className="p-4 border-b border-border flex-row items-center gap-2">
                <Share2 size={18} color={colors.primary} />
                <Text style={{ fontFamily: Fonts.display }} className="font-black text-base text-foreground">Social Media Links</Text>
              </View>
              <View className="p-4 gap-4">
                <Input
                  label="Instagram URL"
                  value={form.socialMedias.instagram}
                  onChangeText={v => setForm({ ...form, socialMedias: { ...form.socialMedias, instagram: v } })}
                  placeholder="https://instagram.com/yourshop"
                />
                <Input
                  label="Facebook URL"
                  value={form.socialMedias.facebook}
                  onChangeText={v => setForm({ ...form, socialMedias: { ...form.socialMedias, facebook: v } })}
                  placeholder="https://facebook.com/yourshop"
                />
              </View>
            </Card>

            {canUpdate ? (
              <TouchableOpacity
                onPress={() => save.mutate(form)}
                disabled={save.isPending}
                className="h-12 bg-primary rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20"
                style={{ opacity: save.isPending ? 0.7 : 1, borderRadius: Radius.xl }}
              >
                <Save size={18} color={colors.primaryForeground} />
                <Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">
                  {save.isPending ? 'Saving…' : 'Save Settings'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

        </View>
      </ScrollView>
    </MasterScreenLayout>
  );
}

