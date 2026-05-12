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
  textClassName?: string;
}

export const Input = ({ label, required, error, className, textClassName, style, ...props }: Props) => (
  <View>
    {label && (
      <Text 
        style={{ fontFamily: Fonts.body }}
        className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5"
      >
        {label} {required && <Text className="text-destructive">*</Text>}
      </Text>
    )}
    <TextInput
      style={[{ outline: 'none', borderRadius: Radius.xl, fontFamily: Fonts.body }, style as any]}
      className={cn(
        'bg-card border px-3.5 py-2.5 text-sm text-foreground',
        error ? 'border-destructive' : 'border-border',
        props.multiline ? 'min-h-[80px] py-3' : 'h-11',
        className,
        textClassName
      )}
      placeholderTextColor={colors.mutedForeground}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
    />
    {error && (
      <Text style={{ fontFamily: Fonts.body }} className="text-xs text-destructive font-medium mt-1">
        {error}
      </Text>
    )}
  </View>
);

