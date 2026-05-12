import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatIdentityDisplay, cleanIdentityInput } from '../utils/Formatter';
import { Pencil, Trash2, Shield } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
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
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Fonts } from '../styles/globalStyles';
import { RootState, userUISlice } from '../redux/store';

interface Role { id: string; name: string }
interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  roleId?: string;
  role?: Role | null;
  createdAt?: string;
}

const getList = <T,>(response: any): T[] => {
  const value = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

const buildUserPayload = (
  form: { name: string; email: string; phone: string; password: string; roleId: string; status: string },
  isEdit: boolean,
) => {
  const payload: any = {
    name: form.name.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    roleId: form.roleId || null,
    isActive: form.status === 'active',
  };
  if (!isEdit || form.password.trim()) payload.password = form.password;
  return payload;
};

export const useUserQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users?limit=999999');
      return getList<User>(data);
    },
  });

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const { data } = await api.get('/roles?limit=999999');
      return getList<Role>(data);
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) =>
      id ? api.put(`/users/${id}`, payload) : api.post('/users', payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.id ? 'User updated' : 'User created');
    },
    onError: (e) => toast.apiError(e, 'User save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Deleted');
    },
    onError: (e) => toast.apiError(e, 'Delete failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/users/bulk-delete', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Deleted');
    },
    onError: (e) => toast.apiError(e, 'Bulk delete failed'),
  });

  // Stable reference — prevents new [] on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rolesStable = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  return {
    query: usersQuery,
    roles: rolesStable,
    rolesLoading: rolesQuery.isLoading,
    save: saveMutation,
    remove: deleteMutation,
    bulkRemove: bulkDeleteMutation,
  };
};

export default function Users() {
  const dispatch = useDispatch();
  const userUI = useSelector((state: RootState) => state.userUI);
  const { query, roles, save, remove, bulkRemove } = useUserQueries();

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(raw => {
      if (raw) setCurrentUser(JSON.parse(raw));
    });
  }, []);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const search = userUI.search;
  const selectedIds = useMemo(() => new Set(userUI.selectedIds), [userUI.selectedIds]);

  const [filterActive, setFilterActive] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', roleId: '', status: 'active' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const setSearch = (value: string) => dispatch(userUISlice.actions.setSearch(value));
  const setSelectedIds = (ids: Set<string>) => dispatch(userUISlice.actions.setSelectedIds([...ids]));

  const data = useMemo(() => {
    let rows = all;
    if (currentUser?.id) {
      rows = rows.filter(u => u.id !== currentUser.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(u => [u.name, u.email, u.phone, u.role?.name].join(' ').toLowerCase().includes(q));
    }
    if (filterActive) rows = rows.filter(u => String(Boolean(u.isActive)) === filterActive);
    return rows;
  }, [all, search, filterActive, currentUser]);

  const getRoleName = (user: User) => user.role?.name ?? roles.find(r => r.id === user.roleId)?.name ?? '-';

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', email: '', phone: '', password: '', roleId: '', status: 'active' });
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setEditItem(u);
    setForm({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '', password: '', roleId: u.roleId ?? u.role?.id ?? '', status: (u.isActive ?? true) ? 'active' : 'inactive' });
    setFormOpen(true);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const columns: Column<User>[] = [
    { key: 'name', label: 'User', width: 220, render: (u) => <View className="flex-row items-center gap-2"><View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center"><Text className="text-xs font-black text-primary" style={{ fontFamily: Fonts.body }}>{(u.name || u.email || '?')[0].toUpperCase()}</Text></View><View><Text className="font-bold text-sm text-foreground" style={{ fontFamily: Fonts.body }}>{u.name || '-'}</Text><Text className="text-[10px] text-muted-foreground">{u.email || u.phone || '-'}</Text></View></View> },
    { key: 'phone', label: 'Phone', width: 140, render: (u) => <Text className="text-sm font-mono text-foreground" style={{ fontFamily: Fonts.body }}>{u.phone || '-'}</Text> },
    { key: 'role', label: 'Role', width: 150, render: (u) => <View className="flex-row items-center gap-1.5 bg-secondary/10 px-2.5 py-1 rounded-full self-start"><Shield size={11} color={colors.secondary} /><Text className="text-[10px] font-bold text-secondary" style={{ fontFamily: Fonts.body }}>{getRoleName(u)}</Text></View> },
    { key: 'createdAt', label: 'Joined', width: 120, render: (u) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}</Text> },
    { key: 'isActive', label: 'Status', width: 100, render: (u) => <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', width: 120, align: 'center', render: (u) => <View className="flex-row gap-2"><TouchableOpacity onPress={() => openEdit(u)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(u.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];

  const renderCard = (u: User) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
          <Text className="text-lg font-black text-primary" style={{ fontFamily: Fonts.display }}>{(u.name || u.email || '?')[0].toUpperCase()}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-black text-foreground" style={{ fontFamily: Fonts.body }}>{u.name || '-'}</Text>
            <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} />
          </View>
          <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{u.email || u.phone || '-'}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2 mb-4 bg-secondary/10 px-3 py-2 rounded-xl border border-secondary/20">
        <Shield size={14} color={colors.secondary} />
        <Text className="text-xs font-bold text-secondary" style={{ fontFamily: Fonts.body }}>{getRoleName(u)}</Text>
      </View>
      <View className="flex-row border-t border-border/40 pt-2">
        <TouchableOpacity onPress={() => openEdit(u)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(u.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Users" subtitle="Manage system users & access" onAddNew={openAdd} addNewLabel="Add User">
      <AdaptiveTable
        data={data}
        columns={columns}
        loading={query.isLoading}
        emptyText="No users found"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[{ key: 'isActive', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }]}
        filterValues={{ isActive: filterActive }}
        onFilterChange={(_, v) => setFilterActive(v)}
        selectedIds={selectedIds}
        onSelectAll={(checked) => setSelectedIds(checked ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect}
        onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Users Report"
        exportFilename="users"
        renderCard={renderCard}
      />

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editItem ? 'Edit User' : 'Add User'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: buildUserPayload(form, Boolean(editItem)) }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>{save.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Input label="Full Name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="User's full name" />
          <Input
            label="Email"
            value={form.email}
            onChangeText={v => setForm({ ...form, email: v.toLowerCase().trim() })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="user@example.com"
          />
          <Input
            label="Phone"
            value={formatIdentityDisplay(form.phone)}
            onChangeText={v => setForm({ ...form, phone: cleanIdentityInput(v) })}
            keyboardType="phone-pad"
            placeholder="+91 XXXXX XXXXX"
          />
          <Input label={editItem ? 'New Password (leave blank to keep)' : 'Password *'} value={form.password} onChangeText={v => setForm({ ...form, password: v })} secureTextEntry placeholder="Min 6 characters" />
          <Select label="Role" value={form.roleId} onValueChange={v => setForm({ ...form, roleId: v })} options={roles.map(r => ({ label: r.name, value: r.id }))} placeholder="Select role" />
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Status
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setForm({ ...form, status: form.status === 'active' ? 'inactive' : 'active' })}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: form.status === 'active' ? '#e8f7ee' : '#fef3e2',
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: form.status === 'active' ? '#bde8cc' : '#f4d49e',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: form.status === 'active' ? '#22c55e' : '#f59e0b',
                  }}
                />
                <Text
                  style={{
                    color: form.status === 'active' ? '#22c55e' : '#f59e0b',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  {form.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Switch
                value={form.status === 'active'}
                onValueChange={value => setForm({ ...form, status: value ? 'active' : 'inactive' })}
                trackColor={{ false: '#f4d49e', true: '#9bddb3' }}
                thumbColor={form.status === 'active' ? '#22c55e' : '#f59e0b'}
                ios_backgroundColor="#f4d49e"
              />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="user" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="user" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}
