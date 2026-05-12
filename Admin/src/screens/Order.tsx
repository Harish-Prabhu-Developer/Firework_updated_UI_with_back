import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Trash2, FileText, Eye, Receipt, ShoppingCart } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { API_URL } from '../utils/constants';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

interface OrderItem { id: string; productName?: string; quantity: number; unitPrice: string; totalPrice: string; }
interface Order {
  id: string; orderNumber: string;
  customer?: { id: string; name: string; phone: string };
  items?: OrderItem[];
  subTotal: string; totalAmount: string;
  status: 'pending' | 'confirmed' | 'converted' | 'cancelled';
  paymentMethod: 'cash' | 'upi' | 'card';
  notes?: string; createdAt: string;
}

// Slice-like hook for Order operations
export const useOrderQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['orders'], queryFn: async () => { const { data } = await api.get('/orders?limit=999999'); return data.data?.data ?? []; } });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/orders/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.delete('/orders/bulk', { data: { ids } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Deleted'); } });
  
  const convertMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.post(`/orders/${id}/convert`, { ...payload, discountAmount: Number(payload.discountAmount), taxAmount: Number(payload.taxAmount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Order converted to invoice!'); },
    onError: (e) => toast.apiError(e, 'Conversion failed'),
  });

  return { query, remove: deleteMutation, bulkRemove: bulkDeleteMutation, convert: convertMutation };
};

export default function Orders() {
  const toast = useToast();
  const { query, remove, bulkRemove, convert } = useOrderQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState(''); const [filterPayment, setFilterPayment] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [convertOrder, setConvertOrder] = useState<Order | null>(null);
  const [convertForm, setConvertForm] = useState({ discountAmount: '0', taxAmount: '0', paymentMethod: 'cash', notes: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as Order[];
    if (search) d = d.filter(o => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customer?.name?.toLowerCase().includes(search.toLowerCase()) || o.customer?.phone?.includes(search));
    if (filterStatus) d = d.filter(o => o.status === filterStatus);
    if (filterPayment) d = d.filter(o => o.paymentMethod === filterPayment);
    return d;
  }, [all, search, filterStatus, filterPayment]);

  const openPDF = async (order: Order) => {
    try {
      const { data } = await api.get(`/orders/${order.id}/token`);
      const token = data.data?.token;
      if (token) Linking.openURL(`${API_URL.replace('/api', '')}/api/v1/orders/pdf/${token}`);
    } catch (e) { toast.apiError(e, 'Failed to generate PDF link'); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Order>[] = [
    { key: 'orderNumber', label: 'Order #', width: 150, render: (o) => <Text className="font-black text-sm font-mono text-primary" style={{ fontFamily: Fonts.body }}>{o.orderNumber}</Text> },
    { key: 'customer', label: 'Customer', width: 180, render: (o) => <View><Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{o.customer?.name || '—'}</Text><Text className="text-[10px] font-mono text-muted-foreground">{o.customer?.phone}</Text></View> },
    { key: 'totalAmount', label: 'Total', width: 100, align: 'right', render: (o) => <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(o.totalAmount).toFixed(2)}</Text> },
    { key: 'status', label: 'Status', width: 110, render: (o) => <StatusBadge status={o.status} size="md" /> },
    { key: 'paymentMethod', label: 'Payment', width: 90, render: (o) => <StatusBadge status={o.paymentMethod} /> },
    { key: 'createdAt', label: 'Date', width: 110, render: (o) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text> },
    { key: 'actions', label: 'Actions', width: 140, render: (o) => (
      <View className="flex-row gap-1">
        <TouchableOpacity onPress={() => setDetailOrder(o)} className="w-8 h-8 rounded-lg bg-muted items-center justify-center"><Eye size={14} color={colors.mutedForeground} /></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(o)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><FileText size={14} color={colors.primary} /></TouchableOpacity>
        {o.status !== 'converted' && o.status !== 'cancelled' && (
          <TouchableOpacity onPress={() => { setConvertOrder(o); setConvertForm({ discountAmount: '0', taxAmount: '0', paymentMethod: o.paymentMethod, notes: o.notes ?? '' }); }} className="w-8 h-8 rounded-lg bg-success/10 items-center justify-center"><Receipt size={14} color={colors.success} /></TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setDeleteId(o.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
      </View>
    )},
  ];

  const renderCard = (o: Order, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-start justify-between mb-4">
        <View><Text className="font-black text-primary font-mono text-sm" style={{ fontFamily: Fonts.body }}>{o.orderNumber}</Text><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text></View>
        <StatusBadge status={o.status} size="md" />
      </View>
      <View className="flex-row items-center justify-between mb-4">
        <View><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>Customer</Text><Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{o.customer?.name || '—'}</Text><Text className="text-[10px] font-mono text-muted-foreground">{o.customer?.phone}</Text></View>
        <View className="items-end"><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>Total</Text><Text className="font-black text-lg text-foreground" style={{ fontFamily: Fonts.display }}>₹{parseFloat(o.totalAmount).toFixed(2)}</Text><StatusBadge status={o.paymentMethod} /></View>
      </View>
      <View className="flex-row border-t border-border/40 pt-2 flex-wrap">
        <TouchableOpacity onPress={() => setDetailOrder(o)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Eye size={13} color={colors.mutedForeground} /><Text className="text-xs font-bold text-muted-foreground" style={{ fontFamily: Fonts.body }}>View</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(o)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><FileText size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>PDF</Text></TouchableOpacity>
        {o.status !== 'converted' && o.status !== 'cancelled' && <TouchableOpacity onPress={() => { setConvertOrder(o); setConvertForm({ discountAmount: '0', taxAmount: '0', paymentMethod: o.paymentMethod, notes: o.notes ?? '' }); }} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Receipt size={13} color={colors.success} /><Text className="text-xs font-bold text-success" style={{ fontFamily: Fonts.body }}>Invoice</Text></TouchableOpacity>}
        <TouchableOpacity onPress={() => setDeleteId(o.id)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Orders" subtitle="Manage customer orders">
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No orders found"
        searchValue={search} onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Status', options: [{ label: 'Pending', value: 'pending' }, { label: 'Confirmed', value: 'confirmed' }, { label: 'Converted', value: 'converted' }, { label: 'Cancelled', value: 'cancelled' }] },
          { key: 'payment', label: 'Payment', options: [{ label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'Card', value: 'card' }] },
        ]}
        filterValues={{ status: filterStatus, payment: filterPayment }}
        onFilterChange={(k, v) => { if (k === 'status') setFilterStatus(v); else setFilterPayment(v); }}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Orders Report" exportFilename="orders"
        exportColumns={[{ key: 'orderNumber', label: 'Order #' }, { key: 'status', label: 'Status' }, { key: 'paymentMethod', label: 'Payment' }, { key: 'totalAmount', label: 'Total' }, { key: 'createdAt', label: 'Date' }]}
        renderCard={renderCard}
      />

      {/* Order Detail */}
      <FormModal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Order: ${detailOrder?.orderNumber}`} subtitle={`Customer: ${detailOrder?.customer?.name}`}>
        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Status</Text><StatusBadge status={detailOrder?.status ?? 'pending'} size="md" /></View>
            <View className="flex-1 bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Payment</Text><StatusBadge status={detailOrder?.paymentMethod ?? 'cash'} size="md" /></View>
            <View className="flex-1 bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Total</Text><Text className="font-black text-base text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(detailOrder?.totalAmount ?? '0').toFixed(2)}</Text></View>
          </View>
          {detailOrder?.items && detailOrder.items.length > 0 && (
            <View className="bg-muted/30 rounded-2xl overflow-hidden border border-border">
              <View className="flex-row bg-muted px-4 py-2.5 border-b border-border">
                <Text className="flex-1 text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Product</Text>
                <Text className="w-12 text-[10px] font-black text-muted-foreground uppercase text-center" style={{ fontFamily: Fonts.body }}>Qty</Text>
                <Text className="w-24 text-[10px] font-black text-muted-foreground uppercase text-right" style={{ fontFamily: Fonts.body }}>Amount</Text>
              </View>
              {detailOrder.items.map(item => (
                <View key={item.id} className="flex-row px-4 py-3 border-b border-border/50">
                  <Text className="flex-1 text-sm font-medium text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{item.productName || '—'}</Text>
                  <Text className="w-12 text-sm text-center text-foreground" style={{ fontFamily: Fonts.body }}>{item.quantity}</Text>
                  <Text className="w-24 text-sm font-bold text-right text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(item.totalPrice).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
          {detailOrder?.notes && <View className="bg-accent/10 p-4 rounded-xl border border-accent/20"><Text className="text-[10px] font-black text-accent uppercase mb-1" style={{ fontFamily: Fonts.body }}>Notes</Text><Text className="text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{detailOrder.notes}</Text></View>}
        </View>
      </FormModal>

      {/* Convert to Invoice */}
      <FormModal open={!!convertOrder} onClose={() => setConvertOrder(null)} title="Convert to Invoice" subtitle={`Order: ${convertOrder?.orderNumber}`}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setConvertOrder(null)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => convertOrder && convert.mutate({ id: convertOrder.id, payload: convertForm }, { onSuccess: () => setConvertOrder(null) })} disabled={convert.isPending} className="flex-1 h-11 rounded-xl bg-success items-center justify-center"><Text className="text-sm font-bold text-success-foreground" style={{ fontFamily: Fonts.body }}>{convert.isPending ? 'Converting…' : 'Create Invoice'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <View className="bg-muted p-4 rounded-xl border border-border"><Text className="text-xs text-muted-foreground mb-1" style={{ fontFamily: Fonts.body }}>Sub Total</Text><Text className="font-black text-2xl text-foreground" style={{ fontFamily: Fonts.display }}>₹{parseFloat(convertOrder?.totalAmount ?? '0').toFixed(2)}</Text></View>
          <View className="flex-row gap-3">
            <View className="flex-1"><Input label="Discount ₹" value={convertForm.discountAmount} onChangeText={v => setConvertForm({ ...convertForm, discountAmount: v })} keyboardType="numeric" /></View>
            <View className="flex-1"><Input label="Tax ₹" value={convertForm.taxAmount} onChangeText={v => setConvertForm({ ...convertForm, taxAmount: v })} keyboardType="numeric" /></View>
          </View>
          <Select label="Payment Method" value={convertForm.paymentMethod} onValueChange={v => setConvertForm({ ...convertForm, paymentMethod: v })} options={[{ label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'Card', value: 'card' }]} />
          <Input label="Notes" value={convertForm.notes} onChangeText={v => setConvertForm({ ...convertForm, notes: v })} placeholder="Additional notes" multiline />
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="order" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="order" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}

