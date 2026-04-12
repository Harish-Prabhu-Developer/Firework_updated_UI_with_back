import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { usePermissions } from "../hooks/usePermissions";
import { cn } from "../lib/utils";

const modules = [
  "Dashboard", "Categories", "Products", "Tags", "UOM", "Videos",
  "Customers", "Orders", "Bills", "Users", "Roles", "Permissions", "Settings", "Media Library",
];

const permissionActions = ["Create", "View", "Update", "Delete", "Bulk Delete", "Export", "Import"];
const roles = ["Admin", "Sales", "Manager", "Viewer"];

type PermMap = Record<string, Record<string, boolean>>;

const defaultPerms: PermMap = {};
modules.forEach((m) => {
  defaultPerms[m] = {};
  permissionActions.forEach((p) => { defaultPerms[m][p] = m === "Dashboard"; });
});

export default function Permissions() {
  const { hasPermission } = usePermissions();
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [perms, setPerms] = useState<PermMap>(defaultPerms);

  const toggle = (mod: string, perm: string) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [perm]: !prev[mod][perm] },
    }));
  };

  const toggleModule = (mod: string) => {
    const allChecked = permissionActions.every((p) => perms[mod][p]);
    setPerms((prev) => ({
      ...prev,
      [mod]: Object.fromEntries(permissionActions.map((p) => [p, !allChecked])),
    }));
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 md:p-6 border-b border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Permissions</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Role-based access management</Text>
          </View>
          <Button label="Save" size="sm" onPress={() => {}} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {roles.map((r) => (
            <Pressable 
              key={r} 
              onPress={() => setSelectedRole(r)}
              className={cn(
                "px-4 py-2 rounded-full border",
                selectedRole === r ? "bg-primary border-primary" : "bg-card border-border"
              )}
            >
              <Text className={cn("text-xs font-bold", selectedRole === r ? "text-primary-foreground" : "text-foreground")}>
                {r}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="min-w-full">
            {/* Header */}
            <View className="flex-row bg-muted/50 border-b border-border p-3">
              <View className="w-32">
                <Text className="text-xs font-bold text-muted-foreground uppercase">Module</Text>
              </View>
              {permissionActions.map((p) => (
                <View key={p} className="w-24 items-center">
                  <Text className="text-xs font-bold text-muted-foreground uppercase">{p}</Text>
                </View>
              ))}
              <View className="w-16 items-center">
                <Text className="text-xs font-bold text-muted-foreground uppercase">All</Text>
              </View>
            </View>

            {/* Rows */}
            {modules.map((mod) => (
              <View key={mod} className="flex-row border-b border-border p-3 items-center">
                <View className="w-32">
                  <Text className="font-medium text-sm text-foreground">{mod}</Text>
                </View>
                {permissionActions.map((p) => (
                  <View key={p} className="w-24 items-center">
                    <Checkbox 
                      checked={perms[mod]?.[p] || false} 
                      onCheckedChange={() => toggle(mod, p)} 
                    />
                  </View>
                ))}
                <View className="w-16 items-center">
                   <Checkbox 
                    checked={permissionActions.every((p) => perms[mod]?.[p])} 
                    onCheckedChange={() => toggleModule(mod)} 
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
