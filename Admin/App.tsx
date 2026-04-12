import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { PermissionProvider } from './src/hooks/usePermissions';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DrawerNavigation } from './src/navigation/DrawerNavigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from './src/hooks/useToast';
import Login from './src/screens/Login';

const queryClient = new QueryClient();
const Stack = createStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <PermissionProvider>
                <NavigationContainer>
                  <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
                    {/* Auth Gate */}
                    <Stack.Screen name="Login" component={Login} />
                    {/* Main App (Drawer) */}
                    <Stack.Screen name="Main" component={DrawerNavigation} />
                  </Stack.Navigator>
                </NavigationContainer>
              </PermissionProvider>
            </QueryClientProvider>
          </Provider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
