import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SidebarMenu } from '../components/SidebarMenu';
import { HeaderBar } from '../components/HeaderBar';
import * as Screens from '../screens';
import { BillStack } from './BillStack';
import { RoleStack } from './RoleStack';
import { LightColors as colors } from '../styles/colors';

const Drawer = createDrawerNavigator();

export const DrawerNavigation = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarMenu {...props} />}
      screenOptions={{
        header: ({ navigation, route }) => (
          <HeaderBar
            title={route.name}
            onMenuPress={() => (navigation as any).openDrawer()}
          />
        ),
        drawerStyle: {
          width: 280,
        }
      }}
    >
      <Drawer.Screen name="Dashboard" component={Screens.Dashboard} />
      <Drawer.Screen name="Orders" component={Screens.Orders} />
      <Drawer.Screen name="Billing" component={BillStack} />
      <Drawer.Screen name="Categories" component={Screens.Categories} />
      <Drawer.Screen name="UOM" component={Screens.UOM} />
      <Drawer.Screen name="Products" component={Screens.Products} />
      <Drawer.Screen name="Tags" component={Screens.Tags} />
      <Drawer.Screen name="Roles" component={RoleStack} />
      <Drawer.Screen name="Users" component={Screens.Users} />
      <Drawer.Screen name="Media" component={Screens.Media} />
      <Drawer.Screen name='Videos' component={Screens.Video} />
      <Drawer.Screen name="Settings" component={Screens.Settings} />
    </Drawer.Navigator>
  );
};
