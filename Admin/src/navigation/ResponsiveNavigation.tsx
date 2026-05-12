import React from 'react';
import { useWindowDimensions } from 'react-native';
import { SidebarLayout } from './SidebarLayout';
import { DrawerNavigation } from './DrawerNavigation';

export const ResponsiveNavigation = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (isDesktop) {
    return <SidebarLayout />;
  }

  return <DrawerNavigation />;
};
