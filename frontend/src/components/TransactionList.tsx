import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Transaction } from '../types';
import { formatTRY, formatDate } from '../format';
import { useStore } from '../store';

type Context = 'company' | 'card' | 'bank';

interface Props {
  transactions: Transaction[];
  context: Context;
  title?: string;
}

function meta(type: Transaction['type'], ctx: Context): { label: string; color: string; sign: '+' | '-' } {
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
    if (type === 'kasa_transfer') return { label: 'Kasa Aktarımı', color: colors.asset, sign: '+' };
  }
  return { label: type, color: colors.textPrimary, sign: '+' };
}

export default function TransactionList({ transactions, context, title }: Props) {
  const { deleteTransaction } = useStore();
  const list = React.useMemo(
    () => (transactions || []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const confirmDelete = (tx: Transaction) => {
    const m = meta(tx.type, context);
    Alert.alert(
      'İşlemi Geri Al',
      `${m.label} (${formatTRY(tx.amount)}) işlemi silinecek ve bakiyeler eski haline dönecek. Onaylıyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Al', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
      ]
    );
  };

  return (
    <View style={styles.wrap} testID={`history-${context}`}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{title || 'HAREKET GEÇMİŞİ'}</Text>
        {list.length > 0 && <Text style={styles.hint}>Geri almak için basılı tutun</Text>}
      </View>
      {list.length === 0 ? (
        <Text style={styles.empty}>Henüz hareket yok</Text>
      ) : (
        list.map((t) => {
          const m = meta(t.type, context);
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.row}
              onLongPress={() => confirmDelete(t)}
              delayLongPress={400}
              testID={`history-row-${t.id}`}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  hint: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
