import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { LightColors as colors } from '../../styles/colors';
import { globalStyles, Radius, Fonts } from '../../styles/globalStyles';

interface Props<T> {
  data: T[];
  selectedIds?: Set<string>;
  onSelectRow?: (id: string) => void;
  idKey?: string;
  renderCard: (item: T, isSelected: boolean) => React.ReactNode;
  emptyText?: string;
  loading?: boolean;
  numColumns?: number;
}

export const CardView = <T extends Record<string, any>>({
  data,
  selectedIds,
  onSelectRow,
  idKey = 'id',
  renderCard,
  emptyText = 'No records found.',
  loading,
  numColumns = 1,
}: Props<T>) => {
  if (loading) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ fontFamily: Fonts.body, marginTop: 12 }} className="text-muted-foreground text-sm font-medium">Loading data...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="py-20 items-center justify-center bg-card rounded-2xl border border-dashed border-border mx-4">
        <Text style={{ fontFamily: Fonts.body }} className="text-muted-foreground text-sm font-medium">{emptyText}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ paddingBottom: 16 }}>
      {data.map((item, i) => {
        const id = item[idKey];
        const isSelected = selectedIds?.has(id) ?? false;
        return (
          <View key={String(id ?? i)} className={numColumns > 1 ? 'w-1/2 p-2' : 'w-full mb-4 px-2'}>
            <TouchableOpacity
              onPress={() => onSelectRow?.(id)}
              activeOpacity={0.9}
              style={[
                globalStyles.card,
                {
                  padding: 0,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary + '05' : colors.card,
                  elevation: isSelected ? 4 : 2,
                }
              ]}
            >
              {renderCard(item, isSelected)}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

