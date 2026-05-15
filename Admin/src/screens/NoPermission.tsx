import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { ShieldAlert, ServerCrash, RefreshCw, LogOut, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LightColors as colors } from '../styles/colors';
import { Fonts } from '../styles/globalStyles';

interface Props {
  type?: 'permission' | 'server' | 'notfound';
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const NoPermission = ({ type = 'permission', title, message, onRetry }: Props) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // If params are passed via navigation
  const params = route.params as Props | undefined;
  const errorType = params?.type || type;
  const displayTitle = params?.title || title || (errorType === 'server' ? 'Server Unreachable' : 'Access Denied');
  const displayMessage = params?.message || message || (errorType === 'server' 
    ? "We're having trouble connecting to the Crackers Kingdom secure servers. Please check your connection." 
    : "You don't have permission to access this module. Please contact your administrator.");

  const renderIcon = () => {
    switch (errorType) {
      case 'server':
        return <ServerCrash size={36} color={colors.destructive} strokeWidth={1.5} />;
      default:
        return <ShieldAlert size={36} color={colors.destructive} strokeWidth={1.5} />;
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-10">
      {/* Premium Glow Background Effect */}
      <View className="absolute top-1/2 left-1/2 -ml-32 -mt-32 w-64 h-64 bg-destructive/5 rounded-full blur-3xl" />
      
      <View className="items-center w-full max-w-sm">
        <View className="w-24 h-24 rounded-full bg-destructive/10 border-4 border-destructive/5 items-center justify-center mb-8 relative">
          <View className="absolute inset-0 rounded-full border border-destructive/20 scale-125 opacity-20" />
          {renderIcon()}
        </View>

        <Text className="text-2xl font-black text-foreground text-center mb-3 uppercase tracking-tight" style={{ fontFamily: Fonts.display }}>
          {displayTitle}
        </Text>
        
        <Text className="text-sm text-muted-foreground text-center mb-10 leading-6" style={{ fontFamily: Fonts.body }}>
          {displayMessage}
        </Text>

        <View className="flex-row gap-3 w-full">
          {errorType === 'server' ? (
            <TouchableOpacity 
              onPress={onRetry || (() => navigation.goBack())}
              className="flex-1 flex-row bg-foreground h-14 rounded-2xl items-center justify-center gap-3 shadow-lg shadow-black/20"
            >
              <RefreshCw size={18} color={colors.background} />
              <Text className="text-xs font-black text-background uppercase tracking-widest">Retry Connection</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Dashboard')}
                className="flex-1 border border-border h-14 rounded-2xl items-center justify-center"
              >
                <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">Go Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.replace('Login')}
                className="flex-1 flex-row bg-destructive h-14 rounded-2xl items-center justify-center gap-2 shadow-lg shadow-destructive/20"
              >
                <LogOut size={16} color="white" />
                <Text className="text-xs font-black text-white uppercase tracking-widest">Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};
