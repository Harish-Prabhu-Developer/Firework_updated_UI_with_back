import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Pencil, Trash2, Shield, Lock, Check } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
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
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { RootState, roleUISlice } from '../redux/store';
import { exportCSV } from '../utils/exportUtils';
import { useNavigation } from '@react-navigation/native';

interface Role { id: string; name: string; description?: string; isActive?: boolean; createdAt?: string }
interface Module { id: string; name: string; slug: string }
interface Action { id: string; action: string; name: string }
interface Permission { moduleId: string; moduleName?: string; moduleSlug?: string; actionId: string; actionSlug?: string; actionName?: string; isAllowed: boolean; allowAll: boolean }

const getList = <T,>(response: any): T[] => {
  const value = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

export const useRoleQueries = (permRoleId?: string) => {
  const qc = useQueryClient();
  const toast = useToast();

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return getList<Role>(data);
    },
  });

  const modulesQuery = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data } = await api.get('/roles/modules/all');
      return getList<Module>(data);
    },
  });

  const actionsQuery = useQuery<Action[]>({
    queryKey: ['actions'],
    queryFn: async () => {
      const { data } = await api.get('/roles/actions/all');
      return getList<Action>(data);
    },
  });

  const rolePermsQuery = useQuery<Permission[]>({
    queryKey: ['role-perms', permRoleId],
    queryFn: async () => {
      const { data } = await api.get(`/roles/${permRoleId}/permissions`);
      return getList<Permission>(data);
    },
    enabled: Boolean(permRoleId),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) =>
      id ? api.put(`/roles/${id}`, payload) : api.post('/roles', payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success(variables.id ? 'Role updated' : 'Role created');
    },
    onError: (e) => toast.apiError(e, 'Role save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Deleted');
    },
    onError: (e) => toast.apiError(e, 'Delete failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/roles/bulk-delete', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Deleted');
    },
    onError: (e) => toast.apiError(e, 'Bulk delete failed'),
  });

  const savePermsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: any[] }) => api.post(`/roles/${roleId}/permissions`, { permissions }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['role-perms', variables.roleId] });
      toast.success('Permissions saved');
    },
    onError: (e) => toast.apiError(e, 'Permission save failed'),
  });

  // Stable references — prevents infinite useEffect loops from new [] on every render
  const rolePermsStable = useMemo(() => rolePermsQuery.data ?? [], [rolePermsQuery.data]);
  const modulesStable = useMemo(() => modulesQuery.data ?? [], [modulesQuery.data]);
  const actionsStable = useMemo(() => actionsQuery.data ?? [], [actionsQuery.data]);

  return {
    query: rolesQuery,
    modules: modulesStable,
    actions: actionsStable,
    rolePerms: rolePermsStable,
    save: saveMutation,
    remove: deleteMutation,
    bulkRemove: bulkDeleteMutation,
    savePerms: savePermsMutation,
  };
};

export default function Roles() {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const roleUI = useSelector((state: RootState) => state.roleUI);
  const { query, save, remove, bulkRemove } = useRoleQueries();

  const all = useMemo(() => query.data ?? [], [query.data]);
  const search = roleUI.search;
  const selectedIds = useMemo(() => new Set(roleUI.selectedIds), [roleUI.selectedIds]);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const setSearch = (value: string) => dispatch(roleUISlice.actions.setSearch(value));
  const setSelectedIds = (ids: Set<string>) => dispatch(roleUISlice.actions.setSelectedIds([...ids]));


  const data = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(r => [r.name, r.description].join(' ').toLowerCase().includes(q));
  }, [all, search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', description: '', isActive: true });
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditItem(role);
    setForm({ name: role.name, description: role.description ?? '', isActive: role.isActive ?? true });
    setFormOpen(true);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const columns: Column<Role>[] = [
    { key: 'name', label: 'Role', width: 180, render: (r) => <View className="flex-row items-center gap-2"><View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Shield size={16} color={colors.primary} /></View><Text style={{ fontFamily: Fonts.body }} className="font-bold text-sm text-foreground">{r.name}</Text></View> },
    { key: 'description', label: 'Description', width: 240, render: (r) => <Text style={{ fontFamily: Fonts.body }} className="text-sm text-muted-foreground" numberOfLines={2}>{r.description || '-'}</Text> },
    { key: 'createdAt', label: 'Created', width: 120, render: (r) => <Text style={{ fontFamily: Fonts.body }} className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '-'}</Text> },
    { key: 'isActive', label: 'Status', width: 100, render: (r) => <StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', width: 140, align: 'center', render: (r) => <View className="flex-row gap-2"><PermissionGuard module="Permissions" action="Update"><TouchableOpacity onPress={() => navigation.navigate('Permissions', { roleId: r.id, roleName: r.name })} className="w-8 h-8 rounded-lg bg-secondary/10 items-center justify-center"><Lock size={14} color={colors.secondary} /></TouchableOpacity></PermissionGuard><PermissionGuard module="Roles" action="Update"><TouchableOpacity onPress={() => openEdit(r)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity></PermissionGuard><PermissionGuard module="Roles" action="Delete"><TouchableOpacity onPress={() => setDeleteId(r.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></PermissionGuard></View> },

  ];

  const renderCard = (r: Role) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center"><Shield size={22} color={colors.primary} /></View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between"><Text style={{ fontFamily: Fonts.body }} className="font-black text-foreground">{r.name}</Text><StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /></View>
          {r.description ? <Text style={{ fontFamily: Fonts.body }} className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>{r.description}</Text> : null}
        </View>
      </View>
      <View className="flex-row border-t border-border/40 pt-2">
        <PermissionGuard module="Permissions" action="Update">
          <TouchableOpacity onPress={() => navigation.navigate('Permissions', { roleId: r.id, roleName: r.name })} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Lock size={13} color={colors.secondary} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-secondary">Permissions</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Roles" action="Update">
          <TouchableOpacity onPress={() => openEdit(r)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-primary">Edit</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Roles" action="Delete">
          <TouchableOpacity onPress={() => setDeleteId(r.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-destructive">Delete</Text></TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout
      title="Role Management"
      subtitle="Define system roles and access permissions"
      module="Roles"
      onAddNew={openAdd}
      addNewLabel="Add Role"
      onExport={() => exportCSV(data, columns.filter(c => c.key !== 'actions').map(c => ({ key: c.key, label: c.label })), 'roles')}
    >
      <AdaptiveTable
        data={data}
        columns={columns}
        loading={query.isLoading}
        emptyText="No roles found"
        searchValue={search}
        onSearchChange={setSearch}
        selectedIds={selectedIds}
        onSelectAll={(checked) => setSelectedIds(checked ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect}
        onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Roles Report"
        exportFilename="roles"
        renderCard={renderCard}
        module="Roles"
      />

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editItem ? 'Edit Role' : 'Add Role'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: form }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">{save.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Input label="Role Name *" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. Super Admin" />
          <Input label="Description" value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Role description" multiline />
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Status
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              style={{
                height: 48,
                borderRadius: Radius.lg,
                backgroundColor: form.isActive ? '#e8f7ee' : '#fef3e2',
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: form.isActive ? '#bde8cc' : '#f4d49e',
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
                    borderRadius: Radius.full,
                    backgroundColor: form.isActive ? '#22c55e' : '#f59e0b',
                  }}
                />
                <Text
                  style={{
                    color: form.isActive ? '#22c55e' : '#f59e0b',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={value => setForm(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: '#f4d49e', true: '#9bddb3' }}
                thumbColor={form.isActive ? '#22c55e' : '#f59e0b'}
                ios_backgroundColor="#f4d49e"
              />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>



      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="role" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="role" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}
