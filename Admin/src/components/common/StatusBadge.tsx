import React from 'react';
import { View, Text } from 'react-native';

type Status =
  | 'Active' | 'Inactive'
  | 'pending' | 'confirmed' | 'converted' | 'cancelled'
  | 'cash' | 'upi' | 'card'
  | string;

const CONFIG: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
  Active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Inactive:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400' },
  pending:   { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400',  label: 'Pending' },
  confirmed: { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400',     label: 'Confirmed' },
  converted: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Converted' },
  cancelled: { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Cancelled' },
  cash:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Cash' },
  upi:       { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  label: 'UPI' },
  card:      { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  label: 'Card' },
};

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, size = 'sm' }: Props) => {
  const cfg = CONFIG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  const label = cfg.label ?? status;
  const pad = size === 'md' ? 'px-3 py-1' : 'px-2.5 py-0.5';
  const fs = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full self-start ${cfg.bg} ${pad} border border-white/80`}>
      <View className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <Text className={`${fs} font-bold ${cfg.text} uppercase tracking-wide`}>{label}</Text>
    </View>
  );
};
