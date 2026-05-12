import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Trash2, FileText, Eye } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

interface InvoiceItem { id: string; productName?: string; quantity: number; unitPrice: string; totalPrice: string; }
interface Invoice {
  id: string; invoiceNumber: string;
  customer?: { id: string; name: string; phone: string };
  items?: InvoiceItem[];
  subTotal: string; discountAmount: string; taxAmount: string; totalAmount: string;
  paymentMethod: 'cash' | 'upi' | 'card';
  notes?: string; createdAt: string;
}

// Slice-like hook for Bill operations
export const useBillQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['invoices'], queryFn: async () => { const { data } = await api.get('/invoices?limit=999999'); return data.data?.data ?? []; } });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/invoices/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.delete('/invoices/bulk', { data: { ids } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Deleted'); } });

  return { query, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function BillHistory() {
  const toast = useToast();
  const navigation = useNavigation<any>();
  const { query, remove, bulkRemove } = useBillQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterPayment, setFilterPayment] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<'1' | '2'>('1');

  const data = useMemo(() => {
    let d = all as Invoice[];
    if (search) d = d.filter(i => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || i.customer?.name?.toLowerCase().includes(search.toLowerCase()));
    if (filterPayment) d = d.filter(i => i.paymentMethod === filterPayment);
    return d;
  }, [all, search, filterPayment]);

  const openPDF = async (invoice: Invoice, template: '1' | '2' = '1') => {
    try {
      const { data } = await api.get(`/invoices/${invoice.id}/token`);
      const token = data.data?.token;
      if (token) Linking.openURL(`${API_URL}/api/v1/invoices/pdf/${token}?template=${template}`);
    } catch (e) { toast.apiError(e, 'Failed to generate PDF link'); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice #', width: 160, render: (i) => <Text className="font-black text-sm font-mono text-primary" style={{ fontFamily: Fonts.body }}>{i.invoiceNumber}</Text> },
    { key: 'customer', label: 'Customer', width: 180, render: (i) => <View><Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{i.customer?.name || '—'}</Text><Text className="text-[10px] font-mono text-muted-foreground">{i.customer?.phone}</Text></View> },
    { key: 'totalAmount', label: 'Total', width: 100, align: 'right', render: (i) => <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(i.totalAmount).toFixed(2)}</Text> },
    { key: 'paymentMethod', label: 'Payment', width: 90, render: (i) => <StatusBadge status={i.paymentMethod} /> },
    { key: 'createdAt', label: 'Date', width: 110, render: (i) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(i.createdAt).toLocaleDateString('en-IN')}</Text> },
    { key: 'actions', label: 'Actions', width: 140, render: (inv) => (
      <View className="flex-row gap-1">
        <TouchableOpacity onPress={() => setDetailInvoice(inv)} className="w-8 h-8 rounded-lg bg-muted items-center justify-center"><Eye size={14} color={colors.mutedForeground} /></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(inv, '1')} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><FileText size={14} color={colors.primary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(inv, '2')} className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center"><FileText size={14} color={colors.accent} /></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(inv.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
      </View>
    )},
  ];

  const renderCard = (inv: Invoice, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-start justify-between mb-4">
        <View><Text className="font-black text-primary font-mono text-sm" style={{ fontFamily: Fonts.body }}>{inv.invoiceNumber}</Text><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</Text></View>
        <StatusBadge status={inv.paymentMethod} size="md" />
      </View>
      <View className="flex-row items-center justify-between mb-4">
        <View><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>Customer</Text><Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{inv.customer?.name || '—'}</Text></View>
        <View className="items-end"><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>Total</Text><Text className="font-black text-lg text-foreground" style={{ fontFamily: Fonts.display }}>₹{parseFloat(inv.totalAmount).toFixed(2)}</Text></View>
      </View>
      <View className="flex-row border-t border-border/40 pt-2">
        <TouchableOpacity onPress={() => setDetailInvoice(inv)} className="flex-1 py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Eye size={13} color={colors.mutedForeground} /><Text className="text-xs font-bold text-muted-foreground" style={{ fontFamily: Fonts.body }}>View</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(inv, '1')} className="flex-1 py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><FileText size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>PDF 1</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => openPDF(inv, '2')} className="flex-1 py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><FileText size={13} color={colors.accent} /><Text className="text-xs font-bold text-accent" style={{ fontFamily: Fonts.body }}>PDF 2</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(inv.id)} className="flex-1 py-2 flex-row items-center justify-center gap-1.5"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Del</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout 
      title="Bill History" 
      subtitle="All generated invoices" 
      onAddNew={() => navigation.navigate('CreateBill')}
      addNewLabel="Create Bill"
    >
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No invoices found"
        searchValue={search} onSearchChange={setSearch}
        filters={[{ key: 'payment', label: 'Payment', options: [{ label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'Card', value: 'card' }] }]}
        filterValues={{ payment: filterPayment }} onFilterChange={(k, v) => setFilterPayment(v)}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Invoices Report" exportFilename="invoices"
        exportColumns={[{ key: 'invoiceNumber', label: 'Invoice #' }, { key: 'paymentMethod', label: 'Payment' }, { key: 'totalAmount', label: 'Total' }, { key: 'createdAt', label: 'Date' }]}
        renderCard={renderCard}
      />

      {/* Invoice Detail */}
      <FormModal open={!!detailInvoice} onClose={() => setDetailInvoice(null)} title={`Invoice: ${detailInvoice?.invoiceNumber}`} subtitle={`Customer: ${detailInvoice?.customer?.name}`}>
        <View className="gap-4">
          <View className="flex-row gap-3 flex-wrap">
            <View className="flex-1 min-w-[120px] bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Payment</Text><StatusBadge status={detailInvoice?.paymentMethod ?? 'cash'} size="md" /></View>
            <View className="flex-1 min-w-[120px] bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Subtotal</Text><Text className="font-bold text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(detailInvoice?.subTotal ?? '0').toFixed(2)}</Text></View>
            <View className="flex-1 min-w-[120px] bg-muted p-3 rounded-xl"><Text className="text-[10px] font-black text-muted-foreground uppercase mb-1" style={{ fontFamily: Fonts.body }}>Discount</Text><Text className="font-bold text-destructive" style={{ fontFamily: Fonts.body }}>-₹{parseFloat(detailInvoice?.discountAmount ?? '0').toFixed(2)}</Text></View>
            <View className="flex-1 min-w-[120px] bg-success/10 p-3 rounded-xl border border-success/20"><Text className="text-[10px] font-black text-success uppercase mb-1" style={{ fontFamily: Fonts.body }}>Grand Total</Text><Text className="font-black text-xl text-success" style={{ fontFamily: Fonts.display }}>₹{parseFloat(detailInvoice?.totalAmount ?? '0').toFixed(2)}</Text></View>
          </View>
          {detailInvoice?.items && detailInvoice.items.length > 0 && (
            <View className="bg-muted/30 rounded-2xl overflow-hidden border border-border">
              <View className="flex-row bg-muted px-4 py-2.5 border-b border-border">
                <Text className="flex-1 text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Product</Text>
                <Text className="w-12 text-[10px] font-black text-muted-foreground uppercase text-center" style={{ fontFamily: Fonts.body }}>Qty</Text>
                <Text className="w-24 text-[10px] font-black text-muted-foreground uppercase text-right" style={{ fontFamily: Fonts.body }}>Amount</Text>
              </View>
              {detailInvoice.items.map(item => (
                <View key={item.id} className="flex-row px-4 py-3 border-b border-border/40">
                  <Text className="flex-1 text-sm font-medium text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{item.productName || '—'}</Text>
                  <Text className="w-12 text-sm text-center text-foreground" style={{ fontFamily: Fonts.body }}>{item.quantity}</Text>
                  <Text className="w-24 text-sm font-bold text-right text-foreground" style={{ fontFamily: Fonts.body }}>₹{parseFloat(item.totalPrice).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity onPress={() => detailInvoice && openPDF(detailInvoice, '1')} className="flex-1 h-12 rounded-xl bg-primary flex-row items-center justify-center gap-2 shadow-sm"><FileText size={18} color={colors.primaryForeground} /><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>Template 1</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => detailInvoice && openPDF(detailInvoice, '2')} className="flex-1 h-12 rounded-xl bg-accent flex-row items-center justify-center gap-2 shadow-sm"><FileText size={18} color={colors.accentForeground} /><Text className="text-sm font-bold text-accent-foreground" style={{ fontFamily: Fonts.body }}>Template 2</Text></TouchableOpacity>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="invoice" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="invoice" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}

