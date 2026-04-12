import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { View } from "react-native";

const modules = [
  "Dashboard", "Categories", "Products", "Tags", "UOM", "Videos",
  "Customers", "Orders", "Bills", "Users", "Roles", "Permissions",
  "Settings", "Media Library",
];

const actions = ["Create", "View", "Update", "Delete", "Bulk Delete", "Export", "Import"];

type PermMap = Record<string, Record<string, boolean>>;

const buildDefaultPerms = (role: string): PermMap => {
  const perms: PermMap = {};
  modules.forEach((m) => {
    perms[m] = {};
    actions.forEach((a) => {
      if (role === "Admin") {
        perms[m][a] = true;
      } else if (role === "Manager") {
        perms[m][a] = a !== "Delete" && a !== "Bulk Delete";
      } else if (role === "Sales") {
        perms[m][a] = ["View", "Create", "Export"].includes(a) &&
          ["Dashboard", "Products", "Categories", "Customers", "Orders", "Bills"].includes(m);
      } else {
        // Viewer
        perms[m][a] = a === "View";
      }
    });
  });
  return perms;
};

// Map screen names to module names (for React Navigation)
const screenModuleMap: Record<string, string> = {
  "Dashboard": "Dashboard",
  "Categories": "Categories",
  "Products": "Products",
  "Tags": "Tags",
  "UOM": "UOM",
  "Videos": "Videos",
  "Customers": "Customers",
  "Orders": "Orders",
  "CreateBill": "Bills",
  "BillHistory": "Bills",
  "Users": "Users",
  "Roles": "Roles",
  "Permissions": "Permissions",
  "Media": "Media Library",
  "Settings": "Settings",
};

interface PermissionContextType {
  currentRole: string;
  setCurrentRole: (role: string) => void;
  permissions: PermMap;
  setPermissions: (perms: PermMap) => void;
  hasPermission: (module: string, action: string) => boolean;
  getModuleForScreen: (screenName: string) => string;
  modules: string[];
  actions: string[];
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState("Admin");
  const [permissions, setPermissions] = useState<PermMap>(buildDefaultPerms("Admin"));

  const setCurrentRole = useCallback((role: string) => {
    setCurrentRoleState(role);
    setPermissions(buildDefaultPerms(role));
  }, []);

  const hasPermission = useCallback((module: string, action: string) => {
    return permissions[module]?.[action] ?? false;
  }, [permissions]);

  const getModuleForScreen = useCallback((screenName: string) => {
    return screenModuleMap[screenName] || "Dashboard";
  }, []);

  return (
    <PermissionContext.Provider value={{
      currentRole, setCurrentRole, permissions, setPermissions,
      hasPermission, getModuleForScreen, modules, actions,
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionProvider");
  return ctx;
}

export function PermissionGuard({
  module, action, children, fallback = null, className
}: {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action)) return <>{fallback}</>;

  if (className) {
    return <View className={className}>{children}</View>;
  }

  return <>{children}</>;
}
