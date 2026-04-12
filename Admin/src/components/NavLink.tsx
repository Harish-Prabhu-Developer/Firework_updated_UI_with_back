import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cn } from '../lib/utils';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function NavLink({ to, children, className, activeClassName }: NavLinkProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isActive = route.name === to;

  return (
    <Pressable 
      onPress={() => navigation.navigate(to)}
      className={cn(className, isActive && activeClassName)}
    >
      <View>
        {typeof children === 'string' ? (
          <Text className={cn(isActive && "font-bold")}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}
