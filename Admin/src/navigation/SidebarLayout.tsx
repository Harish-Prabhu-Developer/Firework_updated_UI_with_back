import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SidebarMenu } from '../components/SidebarMenu';
import { HeaderBar } from '../components/HeaderBar';
import * as Screens from '../screens';
import { BillStack } from './BillStack';
import { RoleStack } from './RoleStack';

const Drawer = createDrawerNavigator();

export const SidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarMenu {...props} isCollapsed={isCollapsed} />}
      screenOptions={{
        drawerType: 'permanent',
        drawerStyle: {
          width: isCollapsed ? 80 : 260,
          borderRightWidth: 1,
          borderRightColor: 'rgba(0,0,0,0.05)',
        },
        header: ({ navigation, route }) => (
          <HeaderBar
            title={route.name}
            isDesktop={true}
            onMenuPress={() => setIsCollapsed(!isCollapsed)}
          />
        ),
        overlayColor: 'transparent',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  main: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
});
