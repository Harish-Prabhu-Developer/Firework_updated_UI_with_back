/**
 * usePermissions.ts
 *
 * Single source of truth for role-based access control on the frontend.
 *
 * ── Server contract ──────────────────────────────────────────────────────────
 * GET /roles/my-permissions  →  { success: true, data: PermissionMap }
 *
 * PermissionMap shape (keyed by module name, then action slug):
 * {
 *   "Categories":    { "View": true,  "Create": true,  "Update": false, "Delete": false, ... },
 *   "Products":      { "View": true,  "Create": false, ... },
 *   "Roles":         { "View": true,  "Create": true,  "Update": true,  "Delete": true  },
 *   ...
 * }
 *
 * Action slugs (stored in permissionActions.action column):
 *   "View" | "Create" | "Update" | "Delete" | "Bulk Delete" | "Export" | "Import"
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 * const { hasPermission } = usePermissions();
 * hasPermission('Categories', 'View')    // → true / false
 * hasPermission('Products',   'Create')  // → true / false
 *
 * <PermissionGuard module="Roles" action="Delete">
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * // Screen-level guard (redirect to NoPermission):
 * <ScreenGuard module="Roles" action="View">
 *   <RolesScreen />
 * </ScreenGuard>
 *
 * ── Rules ────────────────────────────────────────────────────────────────────
 * 1. Super Admin → always granted (bypasses all checks).
 * 2. Not yet loaded → DENY (strict, not optimistic). A loading splash is shown.
 * 3. Module not in map → DENY.
 * 4. Action not in module → DENY.
 * 5. Explicit false in map → DENY.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

/* ─── Action slugs (mirror permissionActions.action in DB) ─────────────────── */
export type PermissionAction =
  | 'View'
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Bulk Delete'
  | 'Export'
  | 'Import';

/* ─── Permission map type ───────────────────────────────────────────────────── */
// { "Categories": { "View": true, "Create": false, ... }, ... }
export type PermissionMap = Record<string, Record<string, boolean>>;

/* ─── Context shape ─────────────────────────────────────────────────────────── */
interface PermissionContextType {
  /** Human-readable role name, e.g. "Super Admin", "Cashier" */
  currentRole: string;
  setCurrentRole: (role: string) => void;

  /** Raw permission map from server */
  permissions: PermissionMap;
  setPermissions: (map: PermissionMap) => void;

  /**
   * Returns true iff the current user is allowed to perform `action` on `module`.
   * Always true for Super Admin.
   * Always false if permissions not yet loaded.
   */
  hasPermission: (module: string, action: string) => boolean;

  /** Trigger a fresh fetch of /roles/my-permissions */
  loadPermissions: () => Promise<void>;

  /** True while the first permission load is in flight */
  loading: boolean;

  /** True after the first load has completed (success or failure) */
  initialized: boolean;
}

/* ─── Default context (used when no provider is present) ───────────────────── */
const PermissionContext = createContext<PermissionContextType>({
  currentRole: '',
  setCurrentRole: () => { },
  permissions: {},
  setPermissions: () => { },
  hasPermission: () => false,
  loadPermissions: async () => { },
  loading: false,
  initialized: false,
});

/* ══════════════════════════════════════════════════════════════════════════════
   PROVIDER
══════════════════════════════════════════════════════════════════════════════ */
export const PermissionProvider = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => {
  const [currentRole, setCurrentRole] = useState('');
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true); // start true — we'll always load on mount
  const [initialized, setInitialized] = useState(false);
  const loadedRef = useRef(false);

  /* ── Restore role name from AsyncStorage on mount ── */
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then(raw => {
        if (!raw) return;
        try {
          const user = JSON.parse(raw);
          if (user?.roleName) setCurrentRole(user.roleName);
        } catch { }
      })
      .catch(() => { });
  }, []);

  /* ── Fetch permissions from API ─────────────────── */
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        // Not logged in — nothing to load
        setPermissions({});
        return;
      }

      const { data } = await api.get('/roles/my-permissions');
      /**
       * New server response shape:
       * {
       *   success: true,
       *   data: {
       *     roleName: "Cashier",
       *     isSuperAdmin: false,
       *     permissions: { "Categories": { "View": true, ... }, ... }
       *   }
       * }
       */
      const payload = data?.data ?? {};
      const roleName: string = payload.roleName ?? '';
      const map: PermissionMap = payload.permissions ?? {};

      if (roleName) setCurrentRole(roleName);
      setPermissions(map);
    } catch (error) {
      console.warn('[usePermissions] Failed to load permissions:', error);
      // On error keep empty map → all non-super-admin checks fail (secure default)
      setPermissions({});
    } finally {
      setLoading(false);
      setInitialized(true);
      loadedRef.current = true;
    }
  }, []);

  /* ── Auto-load on mount if a token exists ─────── */
  useEffect(() => {
    AsyncStorage.getItem('accessToken').then(token => {
      if (token) {
        loadPermissions();
      } else {
        // No token → not logged in, skip load and mark initialized
        setLoading(false);
        setInitialized(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Permission check ───────────────────────────── */
  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      // Super Admin bypasses all permission checks
      if (currentRole.toLowerCase() === 'super admin') return true;

      // Strict: if not yet initialized, DENY (show loading instead)
      if (!initialized) return false;

      // Case-insensitive module lookup
      const moduleKey = Object.keys(permissions).find(
        k => k.toLowerCase() === module.toLowerCase(),
      );
      if (!moduleKey) return false;

      // Case-insensitive action lookup
      const modulePerms = permissions[moduleKey];
      const actionKey = Object.keys(modulePerms).find(
        k => k.toLowerCase() === action.toLowerCase(),
      );
      if (!actionKey) return false;

      return Boolean(modulePerms[actionKey]);
    },
    [currentRole, permissions, initialized],
  );

  return React.createElement(PermissionContext.Provider, {
    value: {
      currentRole,
      setCurrentRole,
      permissions,
      setPermissions,
      hasPermission,
      loadPermissions,
      loading,
      initialized,
    },
    children,
  });
};

/* ══════════════════════════════════════════════════════════════════════════════
   HOOK
══════════════════════════════════════════════════════════════════════════════ */
export const usePermissions = (): PermissionContextType =>
  useContext(PermissionContext);

/* ══════════════════════════════════════════════════════════════════════════════
   PermissionGuard
   Conditionally renders children.
   Use for buttons, actions, table columns — NOT for full screens.
══════════════════════════════════════════════════════════════════════════════ */
interface PermissionGuardProps {
  module: string;
  action: string;
  children: ReactNode;
  /** Render this instead when permission is denied (default: null) */
  fallback?: ReactNode;
}

export const PermissionGuard = ({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps): React.JSX.Element | null => {
  const { hasPermission, loading, initialized } = usePermissions();

  // Still loading → render nothing (don't flash denied state)
  if (loading || !initialized) return null;

  if (!hasPermission(module, action)) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(React.Fragment, null, children);
};

/* ══════════════════════════════════════════════════════════════════════════════
   ScreenGuard
   Wraps a full screen component.
   • While loading → shows branded loading spinner.
   • If denied → navigates to NoPermission screen (no flash).
   • If granted → renders children normally.
══════════════════════════════════════════════════════════════════════════════ */
interface ScreenGuardProps {
  module: string;
  action?: string; // defaults to 'View'
  children: ReactNode;
}

export const ScreenGuard = ({
  module,
  action = 'View',
  children,
}: ScreenGuardProps): React.JSX.Element => {
  const { hasPermission, loading, initialized, currentRole } = usePermissions();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!initialized || loading) return;
    if (!hasPermission(module, action)) {
      // Replace with NoPermission so back-button doesn't loop
      navigation.replace('NoPermission', {
        type: 'permission',
        title: 'Access Denied',
        message: `You don't have permission to access the "${module}" module. Contact your administrator.`,
      });
    }
  }, [initialized, loading, module, action, hasPermission, navigation]);

  if (loading || !initialized) {
    return React.createElement(
      View,
      {
        style: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9f6',
        },
      },
      React.createElement(ActivityIndicator, { size: 'large', color: '#276741' }),
      React.createElement(
        Text,
        {
          style: {
            marginTop: 12,
            fontSize: 13,
            color: '#667a70',
            fontWeight: '600',
          },
        },
        'Checking permissions…',
      ),
    );
  }

  // Permission granted — render screen
  if (hasPermission(module, action)) {
    return React.createElement(React.Fragment, null, children);
  }

  // Denied — render nothing while navigation.replace takes effect
  return React.createElement(View, { style: { flex: 1 } });
};