import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { Button } from './ui/Button';
import { useNavigation } from '@react-navigation/native';

export function PermissionDenied() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="h-20 w-20 rounded-full bg-destructive/10 items-center justify-center mb-6">
        <ShieldAlert size={40} color="#ef4444" />
      </View>
      <Text className="text-2xl font-bold text-foreground text-center">Access Denied</Text>
      <Text className="text-muted-foreground text-center mt-2 mb-8">
        You do not have the necessary permissions to view this module. 
        Please contact your administrator if you believe this is an error.
      </Text>
      <Button 
        label="Go Back to Dashboard" 
        onPress={() => navigation.navigate('Dashboard')}
        className="w-full max-w-xs"
      />
    </View>
  );
}
