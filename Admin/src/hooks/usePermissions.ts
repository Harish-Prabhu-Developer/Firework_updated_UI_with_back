import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

// Server returns: { moduleName: { actionSlug: boolean } }
// e.g. { "categories": { "read": true, "create": false }, "roles": { "read": true } }
type PermissionMap = Record<string, Record<string, boolean>>;

interface PermissionContextType {
  currentRole: string;
  setCurrentRole: (r: string) => void;
  permissions: PermissionMap;
  setPermissions: (p: PermissionMap) => void;
  hasPermission: (module: string, action: string) => boolean;
  loadPermissions: () => Promise<void>;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  currentRole: '',
  setCurrentRole: () => {},
  permissions: {},
  setPermissions: () => {},
  hasPermission: () => true,
  loadPermissions: async () => {},
  loading: false,
});

export const PermissionProvider = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => {
  const [currentRole, setCurrentRole] = useState('');
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Restore role name from saved user on mount ──────────────────
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then(raw => {
        if (!raw) return;
        const user = JSON.parse(raw);
        if (user?.roleName) setCurrentRole(user.roleName);
      })
      .catch(() => {});
  }, []);

  // ── Permission check ────────────────────────────────────────────
  // Super Admin bypasses everything. 
  // If not yet initialized (first load), we are optimistic to avoid UI flickering.
  const hasPermission = (module: string, action: string): boolean => {
    const isSuperAdmin = currentRole.toLowerCase() === 'super admin';
    if (isSuperAdmin) return true;

    // If we haven't even tried to load permissions yet, assume true (optimistic)
    // so the sidebar doesn't start empty and then pop in.
    if (!initialized) return true;

    // Case-insensitive module lookup
    const moduleKey = Object.keys(permissions).find(
      k => k.toLowerCase() === module.toLowerCase()
    );
    if (!moduleKey) return false;

    // Case-insensitive action lookup
    const modulePerms = permissions[moduleKey];
    const actionKey = Object.keys(modulePerms).find(
      k => k.toLowerCase() === action.toLowerCase()
    );
    if (!actionKey) return false;

    return Boolean(modulePerms[actionKey]);
  };

  // ── Fetch from API ───────────────────────────────────────────────
  const loadPermissions = async () => {
    // Only set loading if it's the first time or explicitly forced
    if (!initialized) setLoading(true);
    
    try {
      const { data } = await api.get('/roles/my-permissions');
      // Server returns { success: true, data: { moduleName: { actionSlug: boolean } } }
      const map: PermissionMap = data?.data ?? data ?? {};
      setPermissions(map);
    } catch (error) {
      console.warn('⚠️ usePermissions: Failed to load permissions', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  return React.createElement(PermissionContext.Provider, {
    value: {
      currentRole, setCurrentRole,
      permissions, setPermissions,
      hasPermission, loadPermissions, loading,
    },
    children,
  });
};

export const usePermissions = (): PermissionContextType => useContext(PermissionContext);

export const PermissionGuard = ({
  module,
  action,
  children,
}: {
  module: string;
  action: string;
  children: ReactNode;
}): React.JSX.Element | null => {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action)) return null;
  return React.createElement(React.Fragment, null, children);
};
