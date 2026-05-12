import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../lib/utils';
import { globalStyles, Radius } from '../../styles/globalStyles';

interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className, style, ...props }: CardProps) => (
  <View
    style={[globalStyles.card, { borderRadius: Radius.xl }, style as any]}
    className={cn('bg-card border border-border overflow-hidden', className)}
    {...props}
  >
    {children}
  </View>
);

export const CardContent = ({ children, className, ...props }: CardProps) => (
  <View className={cn('p-4', className)} {...props}>{children}</View>
);

export const CardHeader = ({ children, className, ...props }: CardProps) => (
  <View className={cn('px-4 py-3 border-b border-border', className)} {...props}>{children}</View>
);

export const CardFooter = ({ children, className, ...props }: CardProps) => (
  <View className={cn('px-4 py-3 border-t border-border bg-muted/20', className)} {...props}>{children}</View>
);

