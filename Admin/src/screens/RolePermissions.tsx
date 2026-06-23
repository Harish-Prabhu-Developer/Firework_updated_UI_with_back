import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Check, ArrowLeft, Save } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRoleQueries } from './Roles';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { ScreenGuard } from '../hooks/usePermissions';

const PermissionsInner = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const roleId = route.params?.roleId;
  const roleName = route.params?.roleName;

  const { modules, actions, rolePerms, savePerms } = useRoleQueries(roleId);
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (!roleId) return;
    const matrix: Record<string, Record<string, boolean>> = {};
    rolePerms.forEach(p => {
      if (!matrix[p.moduleId]) matrix[p.moduleId] = {};
      matrix[p.moduleId][p.actionId] = Boolean(p.isAllowed || p.allowAll);
    });
    setPermMatrix(matrix);
  }, [rolePerms, roleId]);

  const togglePerm = (moduleId: string, actionId: string) => {
    setPermMatrix(prev => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [actionId]: !(prev[moduleId]?.[actionId] ?? false) }
    }));
  };

  const toggleModuleAll = (moduleId: string, grant: boolean) => {
    setPermMatrix(prev => ({
      ...prev,
      [moduleId]: Object.fromEntries(actions.map(a => [a.id, grant]))
    }));
  };

  const handleSave = () => {
    if (!roleId) return;
    const permissions = modules.flatMap(m =>
      actions.map(a => ({
        moduleId: m.id,
        actionId: a.id,
        isAllowed: permMatrix[m.id]?.[a.id] ?? false,
        allowAll: false
      }))
    );
    savePerms.mutate({ roleId, permissions }, {
      onSuccess: () => navigation.goBack()
    });
  };

  return (
    <MasterScreenLayout
      title={`Permissions: ${roleName || 'Role'}`}
      subtitle="Define access levels across all modules"
    >
      <View className="flex-row items-center gap-4 mb-4 px-1">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={savePerms.isPending}
          className="h-10 px-4 rounded-xl bg-primary flex-row items-center justify-center gap-2 shadow-sm ml-auto"
        >
          {savePerms.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Save size={16} color={colors.primaryForeground} />
          )}
          <Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">
            {savePerms.isPending ? 'Saving...' : 'Save Permissions'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-card rounded-2xl border border-border overflow-hidden p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 480 }}>
            <View className="flex-row bg-muted rounded-xl mb-2 border border-border overflow-hidden">
              <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-black text-muted-foreground uppercase w-44 px-3 py-3">Module</Text>
              {actions.map(a => (
                <Text key={a.id} style={{ fontFamily: Fonts.body }} className="text-[10px] font-black text-muted-foreground uppercase w-24 text-center py-3">
                  {a.name}
                </Text>
              ))}
              <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-black text-muted-foreground uppercase w-20 text-center py-3">All</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {modules.map((m, i) => {
                const allGranted = actions.length > 0 && actions.every(a => permMatrix[m.id]?.[a.id]);
                return (
                  <View key={m.id} className={`flex-row items-center border-b border-border/40 py-2 ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                    <Text style={{ fontFamily: Fonts.body }} className="text-sm font-semibold text-foreground w-44 px-3" numberOfLines={1}>{m.name}</Text>
                    {actions.map(a => {
                      const allowed = permMatrix[m.id]?.[a.id] ?? false;
                      return (
                        <TouchableOpacity key={a.id} onPress={() => togglePerm(m.id, a.id)} className="w-24 items-center py-1">
                          <View style={{ borderRadius: Radius.sm }} className={`w-6 h-6 border-2 items-center justify-center ${allowed ? 'bg-primary border-primary' : 'bg-card border-border'}`}>
                            {allowed && <Check size={13} color={colors.primaryForeground} strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity onPress={() => toggleModuleAll(m.id, !allGranted)} className="w-20 items-center">
                      <View className={`px-2.5 py-1 rounded-full ${allGranted ? 'bg-success/10' : 'bg-muted'}`}>
                        <Text style={{ fontFamily: Fonts.body }} className={`text-[9px] font-black uppercase ${allGranted ? 'text-success' : 'text-muted-foreground'}`}>{allGranted ? 'All' : 'None'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </MasterScreenLayout>
  );
};

const Permissions = () => (
  <ScreenGuard module="Permissions" action="Update">
    <PermissionsInner />
  </ScreenGuard>
);

export default Permissions;
