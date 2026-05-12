import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform, View, ActivityIndicator, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { PermissionProvider } from './src/hooks/usePermissions';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ResponsiveNavigation } from './src/navigation/ResponsiveNavigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from './src/hooks/useToast';
import Login from './src/screens/Login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShieldCheck } from 'lucide-react-native';
import { LightColors as colors } from './src/styles/colors';
import { Fonts, Radius } from './src/styles/globalStyles';

import Toast from 'react-native-toast-message';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const Stack = createStackNavigator();

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

/* ─────────────────────────────────────────────────
   Branded Splash Screen (shown while token check runs)
───────────────────────────────────────────────── */
const SplashScreen = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}
  >
    <View
      style={{
        height: 72,
        width: 72,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
      }}
    >
      <ShieldCheck size={36} color={colors.primaryForeground} />
    </View>

    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '900',
          color: colors.foreground,
          letterSpacing: -0.3,
          fontFamily: Fonts.display,
        }}
      >
        Crackers Kingdom
      </Text>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 3,
          backgroundColor: colors.muted,
          borderRadius: Radius.full,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: colors.primary,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontFamily: Fonts.body,
          }}
        >
          Admin Portal
        </Text>
      </View>
    </View>

    <ActivityIndicator
      size="small"
      color={colors.primary}
      style={{ marginTop: 8 }}
    />
  </View>
);

/* ─────────────────────────────────────────────────
   Root Navigator — reads AsyncStorage on mount,
   routes to Main if already logged in, else Login
───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   Linking Configuration (URL Bar Routing)
───────────────────────────────────────────────── */
const linking: LinkingOptions<any> = {
  prefixes: ['http://localhost:3000', 'https://crackerskingdom.com'],
  config: {
    screens: {
      Login: 'login',
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Orders: 'orders',
          Billing: 'billing',
          Categories: 'categories',
          UOM: 'uom',
          Products: 'products',
          Tags: 'tags',
          Roles: 'roles',
          Users: 'users',
          Media: 'media',
          Videos: 'videos',
          Settings: 'settings',
        },
      },
    },
  },
};

const RootNavigator = () => {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('accessToken')
      .then(token => setLoggedIn(!!token))
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <SplashScreen />;

  return (
    <Stack.Navigator
      initialRouteName={loggedIn ? 'Main' : 'Login'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        cardStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Main" component={ResponsiveNavigation} />
    </Stack.Navigator>
  );
};

/* ─────────────────────────────────────────────────
   App — provider tree
───────────────────────────────────────────────── */
const App = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <PermissionProvider>
                <NavigationContainer linking={linking}>
                  <RootNavigator />
                </NavigationContainer>
              </PermissionProvider>
            </QueryClientProvider>
          </ToastProvider>
        </Provider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
