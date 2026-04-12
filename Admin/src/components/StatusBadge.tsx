import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StatusBadge({ status, style }: { status: string; style?: any }) {
  const s = status?.toLowerCase() || '';

  let bgStyles = styles.bgGray;
  let textStyles = styles.textGray;

  if (s === "active" || s === "confirmed" || s === "converted") {
    bgStyles = styles.bgSuccess;
    textStyles = styles.textSuccess;
  } else if (s === "inactive" || s === "cancelled") {
    bgStyles = styles.bgDanger;
    textStyles = styles.textDanger;
  } else if (s === "pending") {
    bgStyles = styles.bgWarning;
    textStyles = styles.textWarning;
  }

  return (
    <View style={[styles.container, bgStyles, style]}>
      <Text style={[styles.text, textStyles]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bgGray: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  textGray: {
    color: '#64748b',
  },
  bgSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  textSuccess: {
    color: '#059669',
  },
  bgDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  textDanger: {
    color: '#dc2626',
  },
  bgWarning: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  textWarning: {
    color: '#ea580c',
  },
});
