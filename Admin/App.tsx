// App.tsx
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
import { PermissionProvider, usePermissions } from './src/hooks/usePermissions';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ResponsiveNavigation } from './src/navigation/ResponsiveNavigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from './src/hooks/useToast';
import { navigationRef } from './src/navigation/NavigationService';
import { PaginationPortalProvider } from './src/components/common/PaginationPortal';
import { NotificationProvider, useNotification } from './src/contexts/NotificationContext';
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
   Branded Splash Screen
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

    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
  </View>
);

/* ─────────────────────────────────────────────────
   Linking Configuration
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
          Products: 'products',
          Roles: 'roles',
          Users: 'users',
          Videos: 'videos',
          Settings: 'settings',
          PdfViewer: 'pdf-viewer',
        },
      },
    },
  },
};

/* ─────────────────────────────────────────────────
   RootNavigator
   Reads AsyncStorage on mount:
     • If token exists → loads permissions → navigates to Main
     • Otherwise → navigates to Login
───────────────────────────────────────────────── */
const RootNavigator = () => {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  // Access the permission loader so we can trigger a fresh load on app open
  const { loadPermissions } = usePermissions();

  useEffect(() => {
    AsyncStorage.getItem('accessToken')
      .then(async token => {
        const isLoggedIn = !!token;
        setLoggedIn(isLoggedIn);

        if (isLoggedIn) {
          // Pre-load permissions before navigating to Main so screens
          // can immediately enforce access without a loading flash.
          try {
            await loadPermissions();
          } catch {
            // Non-fatal — PermissionProvider will handle the error state
          }
        }
      })
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request notification permissions after mounting and knowing user is logged in
  const { requestPermissionAndRegister } = useNotification();
  useEffect(() => {
      if (loggedIn) {
          requestPermissionAndRegister();
      }
  }, [loggedIn]);

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
      <Stack.Screen
        name="NoPermission"
        component={require('./src/screens/NoPermission').NoPermission}
      />
      <Stack.Screen
        name="QrScan"
        component={require('./src/screens/QrScan').default}
      />
      <Stack.Screen
        name="PdfViewer"
        component={require('./src/screens/PdfViewerScreen').default}
      />
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
              {/*
                PermissionProvider MUST wrap RootNavigator so that
                usePermissions() is available inside RootNavigator.
              */}
              <PermissionProvider>
                <NotificationProvider>
                  <NavigationContainer ref={navigationRef} linking={linking}>
                    <RootNavigator />
                  </NavigationContainer>
                </NotificationProvider>
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