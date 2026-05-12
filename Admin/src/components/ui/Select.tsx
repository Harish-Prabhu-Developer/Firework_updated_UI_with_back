import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { ChevronDown, Check, AlertCircle } from 'lucide-react-native';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';

interface Option { label: string; value: string }

interface Props {
  label?: string;
  required?: boolean;
  value?: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  error?: string;
}

export const Select = ({ label, required = false, value, onValueChange, options, placeholder = 'Select…', error }: Props) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      {label && (
        <Text style={{ fontFamily: Fonts.body }} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
          {label} {required && <Text className="text-destructive">*</Text>}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ borderRadius: Radius.xl }}
        className={`bg-card border px-3.5 h-11 flex-row items-center justify-between ${error ? 'border-destructive' : 'border-border'}`}
      >
        <Text style={{ fontFamily: Fonts.body }} className={`text-sm flex-1 ${selected ? 'text-foreground font-medium' : 'text-muted-foreground'}`} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      {error && <Text style={{ fontFamily: Fonts.body }} className="text-xs text-destructive font-medium mt-1">{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={e => e.stopPropagation?.()} style={{ width: '100%', maxWidth: 400, maxHeight: '90%' }}>
            <View style={{ borderRadius: Radius.xxl, flexShrink: 1 }} className="bg-card overflow-hidden shadow-2xl border border-border">
              <View className="px-5 py-4 border-b border-border bg-muted/30">
                <Text style={{ fontFamily: Fonts.display, fontSize: 18 }} className="font-black text-foreground">
                  {label ?? 'Select option'}
                </Text>
                {placeholder && !selected && (
                  <Text style={{ fontFamily: Fonts.body }} className="text-xs text-muted-foreground mt-0.5">
                    {placeholder}
                  </Text>
                )}
              </View>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                persistentScrollbar={true}
                className="py-2"
                style={{ flexShrink: 1 }}
              >
                {options.length > 0 ? (
                  options.map((opt, idx) => (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => { onValueChange(opt.value); setOpen(false); }}
                      className={`flex-row items-center justify-between px-5 py-4 ${opt.value === value ? 'bg-primary/5' : ''}`}
                      style={{ borderBottomWidth: idx === options.length - 1 ? 0 : 0.5, borderBottomColor: colors.border + '40' }}
                    >
                      <View className="flex-1">
                        <Text style={{ fontFamily: Fonts.body }} className={`text-[15px] ${opt.value === value ? 'font-bold text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </Text>
                      </View>
                      {opt.value === value && (
                        <View className="bg-primary/10 w-6 h-6 rounded-full items-center justify-center">
                          <Check size={14} color={colors.primary} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="py-12 items-center justify-center px-6">
                    <View className="bg-muted w-16 h-16 rounded-full items-center justify-center mb-4">
                      <AlertCircle size={32} color={colors.mutedForeground} />
                    </View>
                    <Text style={{ fontFamily: Fonts.display }} className="text-lg font-bold text-foreground mb-1">No Options</Text>
                    <Text style={{ fontFamily: Fonts.body }} className="text-sm text-muted-foreground text-center">There are no items available to select at the moment.</Text>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                className="mx-4 my-4 bg-muted h-12 rounded-xl items-center justify-center"
              >
                <Text style={{ fontFamily: Fonts.body, fontWeight: '700' }} className="text-foreground">Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

