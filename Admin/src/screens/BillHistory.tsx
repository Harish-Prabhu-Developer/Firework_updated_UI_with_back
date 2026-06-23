// Admin/src/screens/BillHistory.tsx
import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { PdfViewer } from '../components/common/PdfViewer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Trash2, Eye, Download } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import { PermissionGuard } from '../hooks/usePermissions';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { formatIdentityDisplay, formatCurrency } from '../utils/Formatter';
import { downloadFile } from '../utils/exportUtils';

interface InvoiceItem { id: string; productName?: string; quantity: number; unitPrice: string; totalPrice: string; }
interface Invoice {
  id: string; invoiceNumber: string;
  customer?: { id: string; name: string; phone: string; email?: string };
  items?: InvoiceItem[];
  subTotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: 'cash' | 'upi' | 'card';
  notes?: string; createdAt: string;
}

// Shared truncation style for single-line table cells.
// minWidth:0 forces the flex child to actually shrink so numberOfLines/ellipsis kicks in.
const truncStyle = {
  flexShrink: 1,
  minWidth: 0,
  overflow: 'hidden',
} as any;

// Slice-like hook for Bill operations
export const useBillQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.get('/invoices?limit=999999');
      const list = [data, data?.data, data?.data?.data].find(Array.isArray);
      return (list ?? []) as Invoice[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/invoices/bulk-delete', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Deleted');
    },
  });

  return { query, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function BillHistory() {
  const toast = useToast();
  const navigation = useNavigation<any>();

  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const { query, remove, bulkRemove } = useBillQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as Invoice[];
    if (search) {
      d = d.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.customer?.phone?.includes(search)
      );
    }
    if (filterPayment) {
      d = d.filter(i => i.paymentMethod === filterPayment);
    }
    return d;
  }, [all, search, filterPayment]);

  const handleViewPDF = async (invoice: Invoice) => {
    try {
      const { data } = await api.get(`/invoices/${invoice.id}/token`);
      const token = data.data?.token;
      if (token) {
        const url = `${API_URL}/invoices/pdf/${token}?template=3`;
        navigation.navigate('PdfViewer', { uri: url, title: `Invoice ${invoice.invoiceNumber}` });
      }
    } catch (e) { toast.apiError(e, 'Failed to generate PDF link'); }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const { data } = await api.get(`/invoices/${invoice.id}/token`);
      const token = data.data?.token;
      if (token) {
        const url = `${API_URL}/invoices/pdf/${token}?template=1`;
        await downloadFile(url, `invoice_${invoice.invoiceNumber}.pdf`);
      }
    } catch (e) { toast.apiError(e, 'Failed to generate download link'); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      width: 160, // bumped from 140 — bold mono "INV-260619-0001" needs the room
      render: (i) => (
        // FIX: no numberOfLines meant a slightly-too-narrow column made the
        // number wrap mid-string ("INV-260619-" / "0001"), inflating that row's
        // height versus every other row. Truncate on one line instead.
        <Text
          className="font-black text-sm font-mono text-primary"
          style={{ fontFamily: Fonts.body, ...truncStyle }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {i.invoiceNumber}
        </Text>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      width: 220,
      render: (i) => (
        <View style={{ minWidth: 0, overflow: 'hidden' }}>
          <Text
            className="font-bold text-sm text-foreground"
            style={{ fontFamily: Fonts.body, ...truncStyle }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {i.customer?.name || '—'}
          </Text>
          <Text className="text-[10px] font-mono text-muted-foreground" numberOfLines={1} ellipsizeMode="tail" style={truncStyle}>
            {formatIdentityDisplay(i.customer?.phone)}
          </Text>
          {i.customer?.email && (
            <Text className="text-[9px] text-muted-foreground/80 italic" numberOfLines={1} ellipsizeMode="tail" style={truncStyle}>
              {i.customer.email}
            </Text>
          )}
        </View>
      )
    },
    {
      key: 'items', label: 'Items', width: 80, align: 'center', render: (i) => (
        <View className="bg-muted px-2 py-0.5 rounded-full" style={{ alignSelf: 'center' }}>
          <Text className="font-black text-[10px] text-muted-foreground">{i.items?.length || 0}</Text>
        </View>
      )
    },
    {
      key: 'financials', label: 'Financials', width: 170, align: 'right', render: (i) => {
        const sub = parseFloat(i.subTotal) || 0;
        const disc = parseFloat(i.discountAmount || '0');
        const tax = parseFloat(i.taxAmount || '0');
        const discPct = sub > 0 ? ((disc / sub) * 100).toFixed(0) : '0';
        const taxPct = sub > 0 ? ((tax / sub) * 100).toFixed(0) : '0';

        return (
          <View className="items-end" style={{ minWidth: 0 }}>
            <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>Sub: {formatCurrency(i.subTotal)}</Text>
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>Tot: {formatCurrency(i.totalAmount)}</Text>
            {/* FIX: was one concatenated string ("Disc: ... Tax: ...") that wrapped
                mid-phrase, orphaning "Tax: +" on its own line. Discount and tax now
                render as two separate, independently-truncated lines. */}
            {disc > 0 && (
              <Text className="text-[9px] text-success font-bold" numberOfLines={1} ellipsizeMode="tail">
                {`Disc: -${formatCurrency(i.discountAmount)} (${discPct}%)`}
              </Text>
            )}
            {tax > 0 && (
              <Text className="text-[9px] text-success font-bold" numberOfLines={1} ellipsizeMode="tail">
                {`Tax: +${formatCurrency(i.taxAmount)} (${taxPct}%)`}
              </Text>
            )}
          </View>
        );
      }
    },
    { key: 'paymentMethod', label: 'Payment', width: 90, render: (i) => <StatusBadge status={i.paymentMethod} /> },
    { key: 'createdAt', label: 'Date', width: 110, render: (i) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(i.createdAt).toLocaleDateString('en-IN')}</Text> },
    {
      key: 'actions', label: 'Actions', width: 140, render: (inv) => (
        <View className="flex-row gap-1">
          <PermissionGuard module="Invoices" action="View">
            <TouchableOpacity onPress={() => handleViewPDF(inv)} className="w-8 h-8 rounded-lg bg-muted items-center justify-center"><Eye size={14} color={colors.mutedForeground} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Invoices" action="Export">
            <TouchableOpacity onPress={() => handleDownloadPDF(inv)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Download size={14} color={colors.primary} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Invoices" action="Delete">
            <TouchableOpacity onPress={() => setDeleteId(inv.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
          </PermissionGuard>
        </View>
      )
    },
  ];

  const renderCard = (inv: Invoice, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <Text className="font-black text-primary font-mono text-sm" style={{ fontFamily: Fonts.body }}>{inv.invoiceNumber}</Text>
          <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</Text>
        </View>
        <View className="items-end">
          <StatusBadge status={inv.paymentMethod} size="md" />
          <Text className="text-[10px] font-bold text-muted-foreground mt-1">{inv.items?.length || 0} Items</Text>
        </View>
      </View>

      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Customer</Text>
          <Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{inv.customer?.name || '—'}</Text>
          <Text className="text-[10px] font-mono text-muted-foreground">{formatIdentityDisplay(inv.customer?.phone)}</Text>
          {inv.customer?.email && <Text className="text-[10px] text-muted-foreground/70 italic">{inv.customer.email}</Text>}
        </View>
        <View className="items-end">
          <Text className="text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Total Amount</Text>
          <Text className="font-black text-lg text-foreground" style={{ fontFamily: Fonts.display }}>{formatCurrency(inv.totalAmount)}</Text>
        </View>
      </View>

      <View className="bg-muted/50 p-3 rounded-xl mb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-[9px] text-muted-foreground uppercase">Sub Total</Text>
          <Text className="font-bold text-xs">{formatCurrency(inv.subTotal)}</Text>
        </View>
        <View className="items-center">
          <Text className="text-[9px] text-muted-foreground uppercase">Discount ({((parseFloat(inv.discountAmount || '0') / (parseFloat(inv.subTotal) || 1)) * 100).toFixed(0)}%)</Text>
          <Text className="font-bold text-xs text-success">{formatCurrency(inv.discountAmount || '0')}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[9px] text-muted-foreground uppercase">Tax ({((parseFloat(inv.taxAmount || '0') / (parseFloat(inv.subTotal) || 1)) * 100).toFixed(0)}%)</Text>
          <Text className="font-bold text-xs">{formatCurrency(inv.taxAmount || '0')}</Text>
        </View>
      </View>

      <View className="flex-row border-t border-border/40 pt-2">
        <PermissionGuard module="Invoices" action="View">
          <TouchableOpacity onPress={() => handleViewPDF(inv)} className="flex-1 py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Eye size={13} color={colors.mutedForeground} /><Text className="text-xs font-bold text-muted-foreground" style={{ fontFamily: Fonts.body }}>View</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Invoices" action="Export">
          <TouchableOpacity onPress={() => handleDownloadPDF(inv)} className="flex-1 py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Download size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Bill</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Invoices" action="Delete">
          <TouchableOpacity onPress={() => setDeleteId(inv.id)} className="flex-1 py-2 flex-row items-center justify-center gap-1.5"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Del</Text></TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout
      title="Bill History"
      subtitle="All generated invoices"
      module="Invoices"
      onAddNew={() => navigation.navigate('CreateBill')}
      addNewLabel="Create Bill"
      bottomContentInset={96}
    >
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No invoices found"
        searchValue={search} onSearchChange={setSearch}
        filters={[{ key: 'payment', label: 'Payment', options: [{ label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'Card', value: 'card' }] }]}
        filterValues={{ payment: filterPayment }} onFilterChange={(_, v) => setFilterPayment(v)}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Invoices Report" exportFilename="invoices"
        exportColumns={[{ key: 'invoiceNumber', label: 'Invoice #' }, { key: 'paymentMethod', label: 'Payment' }, { key: 'totalAmount', label: 'Total' }, { key: 'createdAt', label: 'Date' }]}
        renderCard={renderCard}
        module="Invoices"
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
            <TouchableOpacity onPress={() => detailInvoice && handleViewPDF(detailInvoice)} className="flex-1 h-12 rounded-xl bg-muted flex-row items-center justify-center gap-2 shadow-sm"><Eye size={18} color={colors.foreground} /><Text className="text-sm font-bold text-foreground" style={{ fontFamily: Fonts.body }}>View Bill</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => detailInvoice && handleDownloadPDF(detailInvoice)} className="flex-1 h-12 rounded-xl bg-primary flex-row items-center justify-center gap-2 shadow-sm"><Download size={18} color={colors.primaryForeground} /><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>Download Bill</Text></TouchableOpacity>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="invoice" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="invoice" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />

    </MasterScreenLayout>
  );
}