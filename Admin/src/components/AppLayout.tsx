import React from 'react';
import { View } from 'react-native';
import { AppSidebar } from './AppSidebar';
import { useResponsive } from '../hooks/use-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 flex-row">
        <View className="flex-1 min-w-0">
          {children}
        </View>
      </View>
    </View>
  );
}
