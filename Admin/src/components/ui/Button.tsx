import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/utils';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';

interface Props extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary border border-primary',
  outline: 'bg-card border border-border',
  ghost: 'bg-transparent border border-transparent',
  destructive: 'bg-destructive border border-destructive',
  secondary: 'bg-secondary border border-secondary',
};

const textVariantClasses: Record<string, string> = {
  default: 'text-primary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
  secondary: 'text-secondary-foreground',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-6',
  icon: 'h-10 w-10',
};

const textSizeClasses: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  icon: 'text-sm',
};

const sizeRadius: Record<string, number> = {
  sm: Radius.md,
  md: Radius.xl,
  lg: Radius.xl,
  icon: Radius.xl,
};

export const Button = ({
  variant = 'default',
  size = 'md',
  label,
  loading,
  className,
  textClassName,
  children,
  disabled,
  style,
  ...props
}: Props) => (
  <TouchableOpacity
    disabled={disabled || loading}
    activeOpacity={0.8}
    style={[{ borderRadius: sizeRadius[size] }, style as any]}
    className={cn(
      'flex-row items-center justify-center gap-2',
      variantClasses[variant],
      sizeClasses[size],
      (disabled || loading) && 'opacity-50',
      className
    )}
    {...props}
  >
    {loading ? (
      <ActivityIndicator size="small" color={variant === 'default' || variant === 'destructive' || variant === 'secondary' ? colors.primaryForeground : colors.primary} />
    ) : null}
    {children}
    {label && (
      <Text style={{ fontFamily: Fonts.body }} className={cn('font-bold', textVariantClasses[variant], textSizeClasses[size], textClassName)}>
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

