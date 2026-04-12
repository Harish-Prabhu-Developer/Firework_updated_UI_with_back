import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, label, error, containerClassName, ...props }, ref) => {
    return (
      <View className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <Text className="text-sm font-medium text-foreground ml-1">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:border-ring disabled:opacity-50',
            error && 'border-destructive',
            className
          )}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {error && (
          <Text className="text-xs font-medium text-destructive ml-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
