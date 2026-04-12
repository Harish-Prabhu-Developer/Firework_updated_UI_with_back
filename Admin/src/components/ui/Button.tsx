import React from 'react';
import { Pressable, Text, ActivityIndicator, View, PressableProps, Platform } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 active:opacity-80 px-4 py-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
        link: 'bg-transparent underline text-primary hover:text-primary/80',
        edit: 'bg-indigo-600 text-white hover:bg-indigo-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'edit' | 'danger' | null;
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant = 'default', size = 'default', label, children, loading, textClassName, ...props }, ref) => {
    const isDarkBackground = variant === 'default' || variant === 'destructive' || variant === 'secondary' || variant === 'edit' || variant === 'danger';
    const indicatorColor = isDarkBackground ? '#ffffff' : '#6366f1';

    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          Platform.OS !== 'web' && { opacity: pressed ? 0.7 : 1 }
        ]}
        className={cn(buttonVariants({ variant: variant as any, size: size as any, className }))}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={indicatorColor} size="small" />
        ) : (
          <View className="flex-row items-center justify-center gap-2">
            {children}
            {label && (
              <Text className={cn('font-medium', 
                variant === 'outline' || variant === 'ghost' || variant === 'link' ? 'text-foreground' : 
                isDarkBackground ? 'text-white' : 
                'text-primary-foreground', 
                textClassName)}>
                {label}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
