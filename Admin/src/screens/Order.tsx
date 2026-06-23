// src/screens/Order.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { PdfViewer } from '../components/common/PdfViewer';
import { Trash2, FileText, Eye, Receipt, ShoppingCart, Scan, Download, Edit2 } from 'lucide-react-native';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
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
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { API_URL } from '../utils/constants';
import { formatIdentityDisplay, formatCurrency } from '../utils/Formatter';
import { downloadFile } from '../utils/exportUtils';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

interface OrderItem { id: string; productName?: string; quantity: number; unitPrice: string; totalPrice: string; }
interface Order {
  id: string; orderNumber: string;
  customer?: { id: string; name: string; phone: string; email?: string; address?: string };
  items?: OrderItem[];
  subTotal: string;
  totalAmount: string;
  discountAmount?: string;
  taxAmount?: string;
  status: 'ESTIMATE_SUBMITTED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'CONFIRMED' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'converted';
  paymentMethod: 'cash' | 'upi' | 'card';
  notes?: string; 
  rejectionReason?: string;
  transportName?: string;
  lrNumber?: string;
  vehicleNumber?: string;
  createdAt: string;
}

// Shared truncation style for single-line table cells.
// minWidth:0 forces the flex child to actually shrink so numberOfLines/ellipsis kicks in.
const truncStyle = {
  flexShrink: 1,
  minWidth: 0,
  overflow: 'hidden',
} as any;

// Slice-like hook for Order operations
export const useOrderQueries = () => {
  const qc = useQueryClient();

  const toast = useToast();

  const query = useQuery({ queryKey: ['orders'], queryFn: async () => { const { data } = await api.get('/orders?limit=999999'); return data.data ?? []; } });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/orders/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.delete('/orders/bulk', { data: { ids } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Deleted'); } });

  const convertMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.post(`/orders/${id}/convert`, { ...payload, discountAmount: Number(payload.discountAmount), taxAmount: Number(payload.taxAmount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Order converted to invoice!'); },
    onError: (e) => toast.apiError(e, 'Conversion failed'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.patch(`/orders/${id}/status`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Status updated'); },
    onError: (e) => toast.apiError(e, 'Failed to update status'),
  });

  return { query, remove: deleteMutation, bulkRemove: bulkDeleteMutation, convert: convertMutation, updateStatus: updateStatusMutation };
};

export default function Orders() {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const { query, remove, bulkRemove, convert, updateStatus } = useOrderQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState(''); const [filterPayment, setFilterPayment] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [convertOrder, setConvertOrder] = useState<Order | null>(null);
  const [convertForm, setConvertForm] = useState({ discountAmount: '0', taxAmount: '0', paymentMethod: 'cash', notes: '' });
  const [updateStatusOrder, setUpdateStatusOrder] = useState<Order | null>(null);
  const [updateStatusForm, setUpdateStatusForm] = useState({ status: '', rejectionReason: '', transportName: '', lrNumber: '', vehicleNumber: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Handle incoming notification referenceId
  const routeParams = (navigation.getState().routes.find((r: any) => r.name === 'Orders')?.params || {}) as any;
  useEffect(() => {
    if (routeParams?.referenceId && all.length > 0) {
      const order = all.find((o: Order) => o.id === routeParams.referenceId);
      if (order) {
        setDetailOrder(order);
        // Clear param to prevent reopening on subsequent renders
        navigation.setParams({ referenceId: undefined });
      }
    }
  }, [routeParams?.referenceId, all, navigation]);

  const data = useMemo(() => {
    let d = all as Order[];
    if (search) d = d.filter(o => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customer?.name?.toLowerCase().includes(search.toLowerCase()) || o.customer?.phone?.includes(search));
    if (filterStatus) d = d.filter(o => o.status === filterStatus);
    if (filterPayment) d = d.filter(o => o.paymentMethod === filterPayment);
    return d;
  }, [all, search, filterStatus, filterPayment]);

  const downloadPDF = async (order: Order) => {
    try {
      const { data: tokenData } = await api.get(`/orders/${order.id}/token`);
      const token = tokenData.data?.token;
      if (!token) return;
      const url = `${API_URL}/orders/pdf/${token}`;

      await downloadFile(url, `order_${order.orderNumber}.pdf`);
    } catch (e) {
      toast.apiError(e, 'Failed to download PDF');
    }
  };

  const openPDF = async (order: Order) => {
    try {
      const { data } = await api.get(`/orders/${order.id}/token`);
      const token = data.data?.token;
      if (token) {
        const url = `${API_URL}/orders/pdf/${token}`;
        navigation.navigate('PdfViewer', { uri: url, title: `Order ${order.orderNumber}` });
      }
    } catch (e) { toast.apiError(e, 'Failed to generate PDF link'); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleQrScan = (code: string) => {
    // Find order by orderNumber or ID
    const order = all.find((o: Order) => o.orderNumber === code || o.id === code);
    if (order) {
      if (order.status === 'converted' || order.status === 'REJECTED') {
        toast.error(`Order is already ${order.status}`);
        return;
      }
      navigation.navigate('Billing', {
        screen: 'CreateBill',
        params: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer,
          items: order.items,
          notes: `Converted from Order: #${order.orderNumber}`
        }
      });
    } else {
      toast.error('Order not found or invalid QR');
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      width: 160, // bumped from 140 — bold mono "ORD-260618-001" needs the room
      render: (o) => (
        // FIX: no numberOfLines meant a slightly-too-narrow column made the
        // number wrap mid-string ("ORD-260618-" / "001"), inflating that row's
        // height versus every other row. Truncate on one line instead.
        <Text
          className="font-black text-sm font-mono text-primary"
          style={{ fontFamily: Fonts.body, ...truncStyle }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {o.orderNumber}
        </Text>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      width: 220, // FIX: this column had NO width at all — inconsistent with
      // every other table's customer column and left it at the
      // mercy of TableView's default sizing.
      render: (o) => (
        <View style={{ minWidth: 0, overflow: 'hidden' }}>
          <Text
            className="font-bold text-sm text-foreground"
            style={{ fontFamily: Fonts.body, ...truncStyle }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {o.customer?.name || '—'}
          </Text>
          <Text className="text-[10px] font-mono text-muted-foreground" numberOfLines={1} ellipsizeMode="tail" style={truncStyle}>
            {formatIdentityDisplay(o.customer?.phone)}
          </Text>
          {o.customer?.email && (
            <Text className="text-[9px] text-muted-foreground/80 italic" numberOfLines={1} ellipsizeMode="tail" style={truncStyle}>
              {o.customer.email}
            </Text>
          )}
        </View>
      )
    },
    {
      key: 'items', label: 'Items', width: 80, align: 'center', render: (o) => (
        <View className="bg-muted px-2 py-0.5 rounded-full" style={{ alignSelf: 'center' }}>
          <Text className="font-black text-[10px] text-muted-foreground">{o.items?.length || 0}</Text>
        </View>
      )
    },
    {
      key: 'financials', label: 'Financials', width: 170, align: 'right', render: (o) => {
        const sub = parseFloat(o.subTotal) || 0;
        const disc = parseFloat(o.discountAmount || '0');
        const tax = parseFloat(o.taxAmount || '0');
        const discPct = sub > 0 ? ((disc / sub) * 100).toFixed(0) : '0';
        const taxPct = sub > 0 ? ((tax / sub) * 100).toFixed(0) : '0';

        return (
          <View className="items-end" style={{ minWidth: 0 }}>
            <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>Sub: {formatCurrency(o.subTotal)}</Text>
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>Tot: {formatCurrency(o.totalAmount)}</Text>
            {/* FIX: was one concatenated string ("Disc: ... Tax: ...") that wrapped
                mid-phrase, orphaning "Tax: +" on its own line. Discount and tax now
                render as two separate, independently-truncated lines. */}
            {disc > 0 && (
              <Text className="text-[9px] text-success font-bold" numberOfLines={1} ellipsizeMode="tail">
                {`Disc: -${formatCurrency(o.discountAmount!)} (${discPct}%)`}
              </Text>
            )}
            {tax > 0 && (
              <Text className="text-[9px] text-success font-bold" numberOfLines={1} ellipsizeMode="tail">
                {`Tax: +${formatCurrency(o.taxAmount!)} (${taxPct}%)`}
              </Text>
            )}
          </View>
        );
      }
    },
    { key: 'status', label: 'Status', width: 110, render: (o) => <StatusBadge status={o.status} size="md" /> },
    { key: 'paymentMethod', label: 'Payment', width: 90, render: (o) => <StatusBadge status={o.paymentMethod} /> },
    { key: 'createdAt', label: 'Date', width: 110, render: (o) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text> },
    {
      key: 'actions', label: 'Actions', width: 210, render: (o) => (
        <View className="flex-row gap-1">
          <PermissionGuard module="Orders" action="View">
            <TouchableOpacity onPress={() => setDetailOrder(o)} className="w-8 h-8 rounded-lg bg-muted items-center justify-center"><Eye size={14} color={colors.mutedForeground} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Orders" action="View">
            <TouchableOpacity onPress={() => openPDF(o)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Eye size={14} color={colors.primary} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Orders" action="Export">
            <TouchableOpacity onPress={() => downloadPDF(o)} className="w-8 h-8 rounded-lg bg-success/10 items-center justify-center"><Download size={14} color={colors.success} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Orders" action="Update">
            <TouchableOpacity onPress={() => { setUpdateStatusOrder(o); setUpdateStatusForm({ status: o.status, rejectionReason: o.rejectionReason || '', transportName: o.transportName || '', lrNumber: o.lrNumber || '', vehicleNumber: o.vehicleNumber || '' }); }} className="w-8 h-8 rounded-lg bg-orange-500/10 items-center justify-center"><Edit2 size={14} color="#f97316" /></TouchableOpacity>
          </PermissionGuard>
          {o.status !== 'converted' && (
            <PermissionGuard module="Invoices" action="Create">
              <TouchableOpacity
                onPress={() => navigation.navigate('Billing', {
                  screen: 'CreateBill',
                  params: {
                    orderId: o.id,
                    orderNumber: o.orderNumber,
                    customer: o.customer,
                    items: o.items,
                    notes: `Converted from Order: #${o.orderNumber}`
                  }
                })}
                className="w-8 h-8 rounded-lg bg-success/10 items-center justify-center"
              >
                <Receipt size={14} color={colors.success} />
              </TouchableOpacity>
            </PermissionGuard>
          )}
          <PermissionGuard module="Orders" action="Delete">
            <TouchableOpacity onPress={() => setDeleteId(o.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
          </PermissionGuard>

        </View>
      )
    },
  ];

  const renderCard = (o: Order, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <Text className="font-black text-primary font-mono text-sm" style={{ fontFamily: Fonts.body }}>{o.orderNumber}</Text>
          <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text>
        </View>
        <View className="items-end">
          <StatusBadge status={o.status} size="md" />
          <Text className="text-[10px] font-bold text-muted-foreground mt-1">{o.items?.length || 0} Items</Text>
        </View>
      </View>

      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Customer</Text>
          <Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{o.customer?.name || '—'}</Text>
          <Text className="text-[10px] font-mono text-muted-foreground">{formatIdentityDisplay(o.customer?.phone)}</Text>
          {o.customer?.email && <Text className="text-[10px] text-muted-foreground/70 italic">{o.customer.email}</Text>}
        </View>
        <View className="items-end">
          <Text className="text-[10px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Total Amount</Text>
          <Text className="font-black text-lg text-foreground" style={{ fontFamily: Fonts.display }}>{formatCurrency(o.totalAmount)}</Text>
          <StatusBadge status={o.paymentMethod} />
        </View>
      </View>

      <View className="bg-muted/50 p-3 rounded-xl mb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-[9px] text-muted-foreground uppercase">Sub Total</Text>
          <Text className="font-bold text-xs">{formatCurrency(o.subTotal)}</Text>
        </View>
        <View className="items-center">
          <Text className="text-[9px] text-muted-foreground uppercase">Discount ({((parseFloat(o.discountAmount || '0') / (parseFloat(o.subTotal) || 1)) * 100).toFixed(0)}%)</Text>
          <Text className="font-bold text-xs text-success">{formatCurrency(o.discountAmount || '0')}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[9px] text-muted-foreground uppercase">Tax ({((parseFloat(o.taxAmount || '0') / (parseFloat(o.subTotal) || 1)) * 100).toFixed(0)}%)</Text>
          <Text className="font-bold text-xs">{formatCurrency(o.taxAmount || '0')}</Text>
        </View>
      </View>

      <View className="flex-row border-t border-border/40 pt-2 flex-wrap">
        <PermissionGuard module="Orders" action="View">
          <TouchableOpacity onPress={() => setDetailOrder(o)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Eye size={13} color={colors.mutedForeground} /><Text className="text-xs font-bold text-muted-foreground" style={{ fontFamily: Fonts.body }}>View</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Orders" action="View">
          <TouchableOpacity onPress={() => openPDF(o)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Eye size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>PDF</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Orders" action="Export">
          <TouchableOpacity onPress={() => downloadPDF(o)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Download size={13} color={colors.success} /><Text className="text-xs font-bold text-success" style={{ fontFamily: Fonts.body }}>Download</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Orders" action="Update">
          <TouchableOpacity onPress={() => { setUpdateStatusOrder(o); setUpdateStatusForm({ status: o.status, rejectionReason: o.rejectionReason || '', transportName: o.transportName || '', lrNumber: o.lrNumber || '', vehicleNumber: o.vehicleNumber || '' }); }} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"><Edit2 size={13} color="#f97316" /><Text className="text-xs font-bold text-orange-500" style={{ fontFamily: Fonts.body }}>Status</Text></TouchableOpacity>
        </PermissionGuard>
        {o.status !== 'converted' && (
          <PermissionGuard module="Invoices" action="Create">
            <TouchableOpacity
              onPress={() => navigation.navigate('Billing', {
                screen: 'CreateBill',
                params: {
                  orderId: o.id,
                  orderNumber: o.orderNumber,
                  customer: o.customer,
                  items: o.items,
                  notes: `Converted from Order: #${o.orderNumber}`
                }
              })}
              className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5 border-r border-border/40"
            >
              <Receipt size={13} color={colors.success} />
              <Text className="text-xs font-bold text-success" style={{ fontFamily: Fonts.body }}>Invoice</Text>
            </TouchableOpacity>
          </PermissionGuard>
        )}
        <PermissionGuard module="Orders" action="Delete">
          <TouchableOpacity onPress={() => setDeleteId(o.id)} className="flex-1 min-w-[70px] py-2 flex-row items-center justify-center gap-1.5"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Orders" subtitle="Manage customer orders" module="Orders" >
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No orders found"
        searchValue={search} onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Status', options: [{ label: 'Estimate', value: 'ESTIMATE_SUBMITTED' }, { label: 'Verifying', value: 'PENDING_VERIFICATION' }, { label: 'Rejected', value: 'REJECTED' }, { label: 'Confirmed', value: 'CONFIRMED' }, { label: 'Ready', value: 'READY_FOR_DISPATCH' }, { label: 'Dispatched', value: 'DISPATCHED' }, { label: 'Delivered', value: 'DELIVERED' }, { label: 'Converted', value: 'converted' }] },
          { key: 'payment', label: 'Payment', options: [{ label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'Card', value: 'card' }] },
        ]}
        filterValues={{ status: filterStatus, payment: filterPayment }}
        onFilterChange={(k, v) => { if (k === 'status') setFilterStatus(v); else setFilterPayment(v); }}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        renderCard={renderCard}
        exportTitle="Orders Report"
        exportFilename="orders_report"
        exportColumns={[
          { key: 'orderNumber', label: 'Order #' },
          { key: 'createdAt', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'subTotal', label: 'Subtotal' },
          { key: 'totalAmount', label: 'Grand Total' },
          { key: 'status', label: 'Status' },
          { key: 'paymentMethod', label: 'Payment' },
        ]}
        exportData={data.map(o => ({
          ...o,
          customer: o.customer?.name || 'Guest',
          createdAt: new Date(o.createdAt).toLocaleDateString('en-IN'),
        }))}
        extraToolbarActions={
          <TouchableOpacity
            onPress={() => navigation.navigate('QrScan', { onScan: handleQrScan })}
            className="flex-row items-center px-5 h-11"
            style={{
              backgroundColor: colors.primary,
              borderRadius: Radius.xl,
              gap: 10,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Scan size={18} color={colors.primaryForeground} strokeWidth={2.5} />
            <Text
              className="font-bold text-sm"
              style={{ color: colors.primaryForeground, fontFamily: Fonts.body }}
            >
              Scan Order
            </Text>
          </TouchableOpacity>
        }
        module="Orders"
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
          {detailOrder?.rejectionReason && (
            <View className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
              <Text className="text-[10px] font-black text-destructive uppercase mb-1" style={{ fontFamily: Fonts.body }}>Rejection Reason</Text>
              <Text className="text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{detailOrder.rejectionReason}</Text>
            </View>
          )}
          {(detailOrder?.transportName || detailOrder?.lrNumber || detailOrder?.vehicleNumber) && (
            <View className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <Text className="text-[10px] font-black text-primary uppercase mb-2" style={{ fontFamily: Fonts.body }}>Dispatch Details</Text>
              {detailOrder.transportName && <Text className="text-sm text-foreground mb-1" style={{ fontFamily: Fonts.body }}><Text className="font-bold">Transport:</Text> {detailOrder.transportName}</Text>}
              {detailOrder.lrNumber && <Text className="text-sm text-foreground mb-1" style={{ fontFamily: Fonts.body }}><Text className="font-bold">LR No:</Text> {detailOrder.lrNumber}</Text>}
              {detailOrder.vehicleNumber && <Text className="text-sm text-foreground" style={{ fontFamily: Fonts.body }}><Text className="font-bold">Vehicle No:</Text> {detailOrder.vehicleNumber}</Text>}
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

      {/* Update Status Modal */}
      <FormModal open={!!updateStatusOrder} onClose={() => setUpdateStatusOrder(null)} title="Update Order Status" subtitle={`Order: ${updateStatusOrder?.orderNumber}`}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setUpdateStatusOrder(null)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => updateStatusOrder && updateStatus.mutate({ id: updateStatusOrder.id, payload: updateStatusForm }, { onSuccess: () => setUpdateStatusOrder(null) })} disabled={updateStatus.isPending || !updateStatusForm.status} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>{updateStatus.isPending ? 'Updating…' : 'Update Status'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Select label="Status" value={updateStatusForm.status} onValueChange={v => setUpdateStatusForm({ ...updateStatusForm, status: v })} options={[
            { label: 'Estimate Submitted', value: 'ESTIMATE_SUBMITTED' },
            { label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Ready For Dispatch', value: 'READY_FOR_DISPATCH' },
            { label: 'Dispatched', value: 'DISPATCHED' },
            { label: 'Delivered', value: 'DELIVERED' },
          ]} />
          {updateStatusForm.status === 'REJECTED' && (
            <Input label="Remarks (Rejection Reason)" value={updateStatusForm.rejectionReason} onChangeText={v => setUpdateStatusForm({ ...updateStatusForm, rejectionReason: v })} placeholder="Why is this order rejected?" multiline />
          )}
          {updateStatusForm.status === 'DISPATCHED' && (
            <>
              <Input label="Transport Name" value={updateStatusForm.transportName} onChangeText={v => setUpdateStatusForm({ ...updateStatusForm, transportName: v })} placeholder="e.g. VRL Logistics" />
              <Input label="LR Number" value={updateStatusForm.lrNumber} onChangeText={v => setUpdateStatusForm({ ...updateStatusForm, lrNumber: v })} placeholder="e.g. LR123456" />
              <Input label="Vehicle Number" value={updateStatusForm.vehicleNumber} onChangeText={v => setUpdateStatusForm({ ...updateStatusForm, vehicleNumber: v })} placeholder="e.g. TN 00 AA 0000" />
            </>
          )}
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="order" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="order" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />

    </MasterScreenLayout>
  );
}