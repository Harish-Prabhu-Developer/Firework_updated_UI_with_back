import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import * as Screens from '../screens';
import { LightColors as colors } from '../styles/colors';

const Stack = createStackNavigator();

export function RoleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="RolesList" component={Screens.Roles} />
      <Stack.Screen name="Permissions" component={Screens.Permissions} />
    </Stack.Navigator>
  );
}
