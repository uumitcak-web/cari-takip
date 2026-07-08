import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface Option {
  label: string;
  value: string;
  hint?: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  testID?: string;
  emptyText?: string;
}

export default function Picker({ label, options, value, onChange, testID, emptyText }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {options.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyText || 'Seçenek yok'}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
          testID={testID}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => onChange(o.value)}
                style={[
                  styles.chip,
                  selected && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                ]}
                testID={`${testID}-${o.value}`}
              >
                <Text style={[styles.chipText, selected && { color: colors.white }]}>
                  {o.label}
                </Text>
                {o.hint && (
                  <Text style={[styles.chipHint, selected && { color: 'rgba(255,255,255,0.7)' }]}>
                    {o.hint}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    minWidth: 70,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipHint: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.base,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
