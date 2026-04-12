import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

export interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, containerClassName, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <View className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <Text className="text-sm font-medium text-foreground ml-1">
            {label}
          </Text>
        )}
        <View className="relative flex-row items-center">
          {leftIcon && (
            <View className="absolute left-3 z-10">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:border-ring disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive',
              className
            )}
            placeholderTextColor="#94a3b8" // slate-400
            {...props}
          />
          {rightIcon && (
            <View className="absolute right-3 z-10">
              {rightIcon}
            </View>
          )}
        </View>
        {error && (
          <Text className="text-xs font-medium text-destructive ml-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);
Input.displayName = 'Input';

export { Input };
