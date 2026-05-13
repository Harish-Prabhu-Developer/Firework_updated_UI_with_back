import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';

interface Props extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  rows?: number;
}

export const Textarea = ({ label, required, error, className, rows = 4, style, ...props }: Props) => (
  <View>
    {label && (
      <Text style={{ fontFamily: Fonts.body }} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label} {required && <Text className="text-destructive">*</Text>}
      </Text>
    )}
    <TextInput
      multiline
      textAlignVertical="top"
      numberOfLines={rows}
      style={[{ minHeight: rows * 22, outline: 'none', borderRadius: Radius.xl, fontFamily: Fonts.body }, style as any]}
      className={cn(
        'bg-card border px-3.5 py-3 text-sm text-foreground',
        error ? 'border-destructive' : 'border-border',
        className
      )}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
    {error && (
      <Text style={{ fontFamily: Fonts.body }} className="text-xs text-destructive font-medium mt-1">
        {error}
      </Text>
    )}
  </View>
);

