import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY } from '../src/format';
import { CashCounts, DEFAULT_CASH_COUNTS, cashTotal } from '../src/types';

interface Denom {
  key: keyof CashCounts;
  value: number;
  label: string;
}

const DENOMS: Denom[] = [
  { key: 'd200', value: 200, label: '200 ₺' },
  { key: 'd100', value: 100, label: '100 ₺' },
  { key: 'd50',  value: 50,  label: '50 ₺'  },
  { key: 'd20',  value: 20,  label: '20 ₺'  },
  { key: 'd10',  value: 10,  label: '10 ₺'  },
  { key: 'd5',   value: 5,   label: '5 ₺'   },
];

export default function GenelDurum() {
  const { data, updateCashCount, setCashCounts } = useStore();
  const counts = data.cashCounts || DEFAULT_CASH_COUNTS;
  const total = useMemo(() => cashTotal(counts), [counts]);
  const totalAdet = useMemo(
    () => DENOMS.reduce((s, d) => s + (counts[d.key] || 0), 0),
    [counts]
  );

  const handleReset = () => {
    Alert.alert(
      'Adetleri Sıfırla',
      'Tüm kupür adetleri sıfırlansın mı? "Evde" tutarı 0 olur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => setCashCounts({ ...DEFAULT_CASH_COUNTS }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="genel-durum-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>GENEL DURUM</Text>
          <Text style={styles.title}>Kupür Dökümü</Text>
        </View>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          testID="btn-reset-cash"
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sabit Toplam Kartı (Evde) */}
        <View style={styles.totalCard} testID="cash-total-card">
          <View style={styles.totalHeader}>
            <Ionicons name="home" size={16} color={colors.debt} />
            <Text style={styles.totalLabel}>EVDE TOPLAM</Text>
          </View>
          <Text
            style={styles.totalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatTRY(total)}
          </Text>
          <Text style={styles.totalSub}>
            Toplam {totalAdet} adet kâğıt para
          </Text>
        </View>

        {/* Kupür Tablosu */}
        <View style={styles.tableCard}>
          {/* Başlık satırı */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cellLabel, styles.cellHeaderTxt]}>KUPÜR</Text>
            <Text style={[styles.cellCount, styles.cellHeaderTxt]}>ADET</Text>
            <Text style={[styles.cellSubtotal, styles.cellHeaderTxt]}>TUTAR</Text>
          </View>

          {DENOMS.map((d, idx) => {
            const count = counts[d.key] || 0;
            const subtotal = count * d.value;
            return (
              <View
                key={d.key}
                style={[
                  styles.tableRow,
                  idx === DENOMS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.cellLabel}>
                  <View style={styles.denomChip}>
                    <Text style={styles.denomChipText}>{d.value}</Text>
                  </View>
                </View>
                <View style={styles.cellCount}>
                  <TextInput
                    style={styles.countInput}
                    keyboardType="numeric"
                    value={count === 0 ? '' : String(count)}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9]/g, '');
                      const n = cleaned === '' ? 0 : parseInt(cleaned, 10);
                      updateCashCount(d.key, n);
                    }}
                    selectTextOnFocus
                    testID={`input-cash-${d.key}`}
                  />
                </View>
                <Text
                  style={[
                    styles.cellSubtotal,
                    styles.subtotalText,
                    { color: subtotal > 0 ? colors.textPrimary : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatTRY(subtotal)}
                </Text>
              </View>
            );
          })}

          {/* Alt toplam satırı */}
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>TOPLAM</Text>
            <Text style={styles.footerCount}>{totalAdet} adet</Text>
            <Text
              style={styles.footerValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatTRY(total)}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Buraya günlük olarak elinizdeki kâğıt paraların adetlerini girin.
            Toplam tutar otomatik hesaplanır ve Bankalar sekmesindeki
            <Text style={{ fontWeight: '800', color: colors.debt }}> Evde </Text>
            kartında görünür.
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1.2 },
  resetBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: spacing.xl, gap: spacing.lg },

  totalCard: {
    backgroundColor: colors.cardDark,
    padding: spacing.xl,
    borderRadius: radius.card,
    gap: 6,
  },
  totalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  totalLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5,
  },
  totalValue: {
    fontSize: 40, fontWeight: '800',
    color: colors.white, letterSpacing: -1.5,
  },
  totalSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)',
  },

  tableCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  tableHeader: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.sm + 2,
    minHeight: 36,
  },
  cellHeaderTxt: {
    fontSize: 10, fontWeight: '700',
    color: colors.textSecondary, letterSpacing: 1.2,
    textAlign: 'left',
  },
  cellLabel: { width: 80 },
  cellCount: { flex: 1, paddingHorizontal: spacing.sm },
  cellSubtotal: {
    width: 110,
    textAlign: 'right',
  },
  subtotalText: {
    fontSize: 15, fontWeight: '700', letterSpacing: -0.3,
  },
  denomChip: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  denomChipText: {
    fontSize: 16, fontWeight: '800',
    color: colors.textPrimary, letterSpacing: -0.3,
  },
  countInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    textAlign: 'center',
    minHeight: 40,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardDark,
  },
  footerLabel: {
    width: 80,
    fontSize: 11, fontWeight: '800',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2,
  },
  footerCount: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '600',
  },
  footerValue: {
    width: 130,
    textAlign: 'right',
    fontSize: 18, fontWeight: '800',
    color: colors.white, letterSpacing: -0.5,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
