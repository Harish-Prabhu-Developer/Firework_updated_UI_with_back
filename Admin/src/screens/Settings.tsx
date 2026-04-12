import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, Bell, Shield, User, Globe, Database } from 'lucide-react-native';

export default function Settings() {
  const sections = [
    { title: "General", icon: SettingsIcon, description: "App settings and preferences" },
    { title: "Account", icon: User, description: "Manage your profile and security" },
    { title: "Notifications", icon: Bell, description: "Manage how you receive updates" },
    { title: "Security", icon: Shield, description: "Permissions and system security" },
    { title: "Language", icon: Globe, description: "Choose your preferred language" },
    { title: "Data Management", icon: Database, description: "Export or backup your data" },
  ];

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">Settings</Text>
        <Text className="text-muted-foreground text-sm mt-1">Configure your workspace preferences</Text>
      </View>

      <View className="flex-row flex-wrap -mx-2">
        {sections.map((section) => (
          <View key={section.title} className="w-full md:w-1/2 px-2 mb-4">
            <Card className="p-4 flex-row items-center gap-4 active:bg-muted/50">
              <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                <section.icon size={20} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground">{section.title}</Text>
                <Text className="text-xs text-muted-foreground">{section.description}</Text>
              </View>
              <Button variant="ghost" size="sm" label="Manage" />
            </Card>
          </View>
        ))}
      </View>
      
      <View className="mt-6 p-6 border-t border-border items-center">
          <Text className="text-muted-foreground text-xs italic">Version 1.0.0-cli (Android & Web)</Text>
      </View>
    </ScrollView>
  );
}
