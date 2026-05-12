import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldAlert, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const NoPermission = () => {
  const navigation = useNavigation<any>();
  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 items-center justify-center mb-6">
        <ShieldAlert size={36} color="#ef4444" />
      </View>
      <Text className="text-xl font-black text-foreground text-center mb-2">Access Denied</Text>
      <Text className="text-sm text-muted-foreground text-center mb-8">You don't have permission to access any modules. Contact your administrator.</Text>
      <TouchableOpacity onPress={() => navigation.replace('Login')} className="bg-primary px-8 h-11 rounded-xl items-center justify-center">
        <Text className="text-sm font-bold text-white">Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export const Permissions = () => (
  <View className="flex-1 bg-background items-center justify-center px-8">
    <Lock size={48} color="#4f46e5" />
    <Text className="text-lg font-black text-foreground mt-4">Permissions</Text>
    <Text className="text-sm text-muted-foreground mt-2 text-center">Manage permissions via the Roles screen → Permissions button.</Text>
  </View>
);
