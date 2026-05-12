import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import * as Screens from '../screens';
import { LightColors as colors } from '../styles/colors';

const Stack = createStackNavigator();

export function BillStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="BillHistory" component={Screens.BillHistory} />
      <Stack.Screen name="CreateBill" component={Screens.CreateBill} />
    </Stack.Navigator>
  );
}
