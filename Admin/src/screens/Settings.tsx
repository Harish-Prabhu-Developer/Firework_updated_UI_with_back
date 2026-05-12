import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Save, Settings2 } from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

interface ShopSettings { id?: string; shopName: string; shopPhone: string; shopAddress: string; shopGst?: string; }

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
  const [form, setForm] = useState<ShopSettings>({ shopName: '', shopPhone: '', shopAddress: '', shopGst: '' });

  useEffect(() => { if (settings) setForm({ shopName: settings.shopName, shopPhone: settings.shopPhone, shopAddress: settings.shopAddress, shopGst: settings.shopGst ?? '' }); }, [settings]);

  if (isLoading) return (
    <MasterScreenLayout title="Settings">
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </MasterScreenLayout>
  );

  return (
    <MasterScreenLayout title="Settings" subtitle="Shop configuration">
      <View className="max-w-2xl">
        <Card className="mb-6">
          <View className="p-4 border-b border-border flex-row items-center gap-2">
            <Settings2 size={18} color={colors.primary} />
            <Text style={{ fontFamily: Fonts.display }} className="font-black text-base text-foreground">Shop Information</Text>
          </View>
          <View className="p-4 gap-4">
            <Input label="Shop Name *" value={form.shopName} onChangeText={v => setForm({ ...form, shopName: v })} placeholder="e.g. Crackers Kingdom" />
            <Input label="Phone Number *" value={form.shopPhone} onChangeText={v => setForm({ ...form, shopPhone: v })} keyboardType="phone-pad" placeholder="9944336113" />
            <Input label="Address *" value={form.shopAddress} onChangeText={v => setForm({ ...form, shopAddress: v })} placeholder="Street, City, State, PIN" multiline />
            <Input label="GSTIN (Optional)" value={form.shopGst} onChangeText={v => setForm({ ...form, shopGst: v })} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />
          </View>
        </Card>

        <TouchableOpacity
          onPress={() => save.mutate(form)}
          disabled={save.isPending}
          className="h-12 bg-primary rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20"
          style={{ opacity: save.isPending ? 0.7 : 1, borderRadius: Radius.xl }}
        >
          <Save size={18} color={colors.primaryForeground} />
          <Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">{save.isPending ? 'Saving…' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>
    </MasterScreenLayout>
  );
}

