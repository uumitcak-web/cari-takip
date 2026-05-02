import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY, formatDate } from '../src/format';
import EmptyState from '../src/components/EmptyState';
import { TransactionType } from '../src/types';

const TYPE_META: Record<TransactionType, { label: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; sign: 1 | -1 | 0 }> = {
  company_purchase: { label: 'Şirket Alışı', icon: 'cart', sign: 1 },
  cash_payment: { label: 'Elden Ödeme', icon: 'cash', sign: -1 },
  card_payment: { label: 'Kart ile Ödeme', icon: 'card', sign: -1 },
  card_spend: { label: 'Kart Harcaması', icon: 'pricetag', sign: 1 },
  bank_pay_card: { label: 'Bankadan Kart Ödemesi', icon: 'arrow-up-circle', sign: -1 },
  bank_deposit: { label: 'Banka: Para Ekle', icon: 'add-circle', sign: 1 },
  bank_withdraw: { label: 'Banka: Para Çek', icon: 'remove-circle', sign: -1 },
};

export default function Odemeler() {
  const { data, deleteTransaction } = useStore();

  const enriched = useMemo(() => {
    const cm = new Map(data.companies.map((c) => [c.id, c.name]));
    const km = new Map(data.cards.map((c) => [c.id, c.name]));
    const bm = new Map(data.banks.map((b) => [b.id, b.name]));
    return data.transactions.map((t) => ({
      ...t,
      companyName: t.companyId ? cm.get(t.companyId) : undefined,
      cardName: t.cardId ? km.get(t.cardId) : undefined,
      bankName: t.bankId ? bm.get(t.bankId) : undefined,
    }));
  }, [data]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="odemeler-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HAREKET GEÇMİŞİ</Text>
          <Text style={styles.title}>Ödemeler</Text>
        </View>
        <Text style={styles.count}>{enriched.length}</Text>
      </View>

      {enriched.length === 0 ? (
        <EmptyState
          icon="swap-horizontal"
          title="Henüz hareket yok"
          subtitle="Cariler, Kartlar veya Bankalar sekmelerinden işlem yaptığınızda burada listelenecek."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {enriched.map((t) => {
            const meta = TYPE_META[t.type];
            const subtitleParts = [
              t.companyName && `Şirket: ${t.companyName}`,
              t.cardName && `Kart: ${t.cardName}`,
              t.bankName && `Banka: ${t.bankName}`,
              t.note,
            ].filter(Boolean);
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.row}
                onLongPress={() => {
                  Alert.alert(
                    'İşlemi Geri Al',
                    'Bu hareket silinecek ve bakiyeler eski haline dönecek. Onaylıyor musunuz?',
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Geri Al', style: 'destructive', onPress: () => deleteTransaction(t.id) },
                    ]
                  );
                }}
                testID={`tx-row-${t.id}`}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.icon, { backgroundColor: meta.sign === -1 ? '#ECFDF5' : meta.sign === 1 ? '#FEF2F2' : colors.bgSecondary }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.sign === -1 ? colors.asset : meta.sign === 1 ? colors.debt : colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{meta.label}</Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {subtitleParts.join(' · ') || formatDate(t.date)}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(t.date)}</Text>
                  </View>
                </View>
                <Text style={[styles.amount, { color: meta.sign === -1 ? colors.asset : meta.sign === 1 ? colors.debt : colors.textPrimary }]}>
                  {meta.sign === -1 ? '-' : meta.sign === 1 ? '+' : ''}{formatTRY(t.amount, false)}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {enriched.length > 0 && (
        <View style={styles.tip} pointerEvents="none">
          <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
          <Text style={styles.tipText}>Geri almak için satıra uzun basın</Text>
        </View>
      )}
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
  count: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, paddingBottom: 6 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  tip: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
});
