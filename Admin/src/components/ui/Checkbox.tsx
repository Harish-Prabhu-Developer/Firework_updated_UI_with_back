import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  style?: any;
  disabled?: boolean;
}

const Checkbox = ({ checked, onCheckedChange, style, disabled }: CheckboxProps) => {
  return (
    <Pressable
      style={[
        styles.checkbox,
        checked ? styles.checkboxChecked : styles.checkboxUnchecked,
        disabled && styles.checkboxDisabled,
        style
      ]}
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      hitSlop={10}
    >
      {checked && <Check size={14} color="#ffffff" strokeWidth={3.5} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
});

export { Checkbox };
