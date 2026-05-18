import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Transaction } from '../types';
import { formatTRY, formatDate } from '../format';

type Context = 'company' | 'card' | 'bank';

interface Props {
  transactions: Transaction[];
  context: Context;
  title?: string;
}

function meta(type: Transaction['type'], ctx: Context): { label: string; color: string; sign: '+' | '-' } {
  // Mavi = Alış / Harcama / Para Girişi (değeri artıran taraf)
  // Kırmızı = Ödeme / Çıkış (değeri azaltan taraf)
  if (ctx === 'company') {
    if (type === 'company_purchase') return { label: 'Alış', color: colors.purchase, sign: '+' };
    if (type === 'cash_payment') return { label: 'Elden Ödeme', color: colors.debt, sign: '-' };
    if (type === 'card_payment') return { label: 'Kart ile Ödeme', color: colors.debt, sign: '-' };
  }
  if (ctx === 'card') {
    if (type === 'card_spend') return { label: 'Bireysel Harcama', color: colors.purchase, sign: '+' };
    if (type === 'card_payment') return { label: 'Şirkete Kart Ödemesi', color: colors.purchase, sign: '+' };
    if (type === 'bank_pay_card') return { label: 'Bankadan Ödeme', color: colors.debt, sign: '-' };
  }
  if (ctx === 'bank') {
    if (type === 'bank_deposit') return { label: 'Para Girişi', color: colors.purchase, sign: '+' };
    if (type === 'bank_withdraw') return { label: 'Para Çıkışı', color: colors.debt, sign: '-' };
    if (type === 'bank_pay_card') return { label: 'Kart Ödemesi', color: colors.debt, sign: '-' };
  }
  return { label: type, color: colors.textPrimary, sign: '+' };
}

export default function TransactionList({ transactions, context, title }: Props) {
  const list = transactions || [];
  return (
    <View style={styles.wrap} testID={`history-${context}`}>
      <Text style={styles.header}>{title || 'HAREKET GEÇMİŞİ'}</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>Henüz hareket yok</Text>
      ) : (
        list.map((t) => {
          const m = meta(t.type, context);
          return (
            <View key={t.id} style={styles.row} testID={`history-row-${t.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{m.label}</Text>
                <Text style={styles.date}>
                  {formatDate(t.date)}
                  {t.note ? ` · ${t.note}` : ''}
                </Text>
              </View>
              <Text style={[styles.amount, { color: m.color }]}>
                {m.sign}
                {formatTRY(t.amount, false)} ₺
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
