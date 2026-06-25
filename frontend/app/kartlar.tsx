import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY, nextStatementDate, daysUntil, parseTRY } from '../src/format';
import Sheet from '../src/components/Sheet';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
import Picker from '../src/components/Picker';
import EmptyState from '../src/components/EmptyState';
import FAB from '../src/components/FAB';
import TransactionList from '../src/components/TransactionList';
import { CreditCard } from '../src/types';

export default function Kartlar() {
  const { data, addCard, deleteCard, addCardSpend, addBankPayCard } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [actionFor, setActionFor] = useState<CreditCard | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="kartlar-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>KREDİ KARTLARI</Text>
          <Text style={styles.title}>Kartlarım</Text>
        </View>
        <Text style={styles.count}>{data.cards.length}</Text>
      </View>

      {data.cards.length === 0 ? (
        <EmptyState
          icon="card"
          title="Henüz kart yok"
          subtitle="Kredi kartı eklemek için sağ alttaki + butonuna basın."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {data.cards.map((c) => {
            const remaining = c.limit - c.used;
            const pct = c.limit > 0 ? Math.min(100, (c.used / c.limit) * 100) : 0;
            const stmt = nextStatementDate(c.statementDay);
            const days = daysUntil(stmt);
            const dueDate = new Date(stmt);
            dueDate.setDate(dueDate.getDate() + (c.dueDayOffset || 10));

            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setActionFor(c)}
                onLongPress={() => {
                  Alert.alert('Sil', `${c.name} silinsin mi?`, [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Sil', style: 'destructive', onPress: () => deleteCard(c.id) },
                  ]);
                }}
                activeOpacity={0.7}
                testID={`card-tile-${c.id}`}
              >
                <View style={styles.cardVisual}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardBank}>{c.bankName}</Text>
                      <Text style={styles.cardName}>{c.name}</Text>
                    </View>
                    <View style={styles.iconCircle}>
                      <Ionicons name="card" size={20} color={colors.textPrimary} />
                    </View>
                  </View>

                  <View style={styles.cardMid}>
                    <Text style={styles.cardLabel}>KALAN LİMİT</Text>
                    <Text style={[styles.cardAmount, { color: remaining >= 0 ? colors.asset : colors.debt }]}>
                      {formatTRY(remaining)}
                    </Text>
                  </View>

                  <View style={styles.cardBar}>
                    <View style={[styles.cardBarFill, { width: `${pct}%`, backgroundColor: pct > 80 ? colors.debt : colors.textPrimary }]} />
                  </View>

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.cardLabel}>HARCANAN</Text>
                      <Text style={[styles.cardSmall, { color: colors.debt }]}>{formatTRY(c.used)}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>LİMİT</Text>
                      <Text style={styles.cardSmall}>{formatTRY(c.limit)}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>HESAP KESİM</Text>
                      <Text style={[styles.cardSmall, days <= 5 && { color: colors.warning }]}>
                        {stmt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                        {' · '}
                        {days === 0 ? 'Bugün' : `${days}g`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>
                    Son ödeme: {dueDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <FAB onPress={() => setAddOpen(true)} testID="add-card-fab" />

      <AddCardSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (v) => { await addCard(v); setAddOpen(false); }}
      />

      <CardActionSheet
        card={actionFor}
        banks={data.banks}
        transactions={actionFor ? data.transactions.filter((t) => t.cardId === actionFor.id) : []}
        onClose={() => setActionFor(null)}
        onSpend={async (amt, note) => {
          if (actionFor) await addCardSpend(actionFor.id, amt, note);
          setActionFor(null);
        }}
        onPay={async (bankId, amt, note) => {
          if (actionFor) await addBankPayCard(bankId, actionFor.id, amt, note);
          setActionFor(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddCardSheet({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; bankName: string; limit: number; used: number; statementDay: number; dueDayOffset: number }) => void;
}) {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('');
  const [statementDay, setStatementDay] = useState('15');
  const [dueDayOffset, setDueDayOffset] = useState('10');

  const reset = () => { setName(''); setBankName(''); setLimit(''); setUsed(''); setStatementDay('15'); setDueDayOffset('10'); };

  return (
    <Sheet visible={visible} onClose={() => { reset(); onClose(); }} title="Yeni Kredi Kartı" testID="add-card-sheet">
      <Field label="Kart Adı" value={name} onChangeText={setName} placeholder="Örn. Bonus Premium" testID="input-card-name" />
      <Field label="Banka" value={bankName} onChangeText={setBankName} placeholder="Örn. Garanti BBVA" testID="input-card-bank" />
      <Field label="Toplam Limit (₺)" value={limit} onChangeText={setLimit} keyboardType="numeric" placeholder="0" testID="input-card-limit" />
      <Field label="Mevcut Borç (₺)" value={used} onChangeText={setUsed} keyboardType="numeric" placeholder="0" testID="input-card-used" />
      <Field label="Hesap Kesim Günü (1-31)" value={statementDay} onChangeText={setStatementDay} keyboardType="numeric" testID="input-card-statement" />
      <Field label="Son Ödeme: Kesimden Kaç Gün Sonra" value={dueDayOffset} onChangeText={setDueDayOffset} keyboardType="numeric" testID="input-card-due-offset" />
      <Button
        title="Kaydet"
        testID="btn-save-card"
        onPress={() => {
          if (!name.trim() || !bankName.trim()) return;
          const lim = parseTRY(limit);
          const u = parseTRY(used);
          const sd = Math.min(31, Math.max(1, parseInt(statementDay, 10) || 1));
          const od = Math.min(30, Math.max(1, parseInt(dueDayOffset, 10) || 10));
          onSubmit({ name: name.trim(), bankName: bankName.trim(), limit: lim, used: u, statementDay: sd, dueDayOffset: od });
          reset();
        }}
      />
    </Sheet>
  );
}

function CardActionSheet({
  card, banks, transactions, onClose, onSpend, onPay,
}: {
  card: CreditCard | null;
  banks: { id: string; name: string; balance: number }[];
  transactions: import('../src/types').Transaction[];
  onClose: () => void;
  onSpend: (amt: number, note?: string) => void;
  onPay: (bankId: string, amt: number, note?: string) => void;
}) {
  const [mode, setMode] = useState<'spend' | 'pay'>('spend');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [bankId, setBankId] = useState('');

  React.useEffect(() => {
    if (card) {
      setMode('spend'); setAmount(''); setNote('');
      setBankId(banks[0]?.id || '');
    }
  }, [card, banks]);

  if (!card) return null;

  const submit = () => {
    const n = parseTRY(amount);
    if (!n || n <= 0) return;
    if (mode === 'spend') {
      const remaining = card.limit - card.used;
      if (n > remaining) {
        Alert.alert(
          'Limit Aşımı',
          `Bu kartın kalan limiti ${formatTRY(remaining)}. ${formatTRY(n)} tutarında harcama yapılamaz.`,
          [{ text: 'Tamam', style: 'cancel' }]
        );
        return;
      }
      onSpend(n, note || undefined);
    } else if (mode === 'pay' && bankId) {
      if (n > card.used) {
        Alert.alert(
          'Fazladan Ödeme Yapılamaz',
          `Bu kartın borcu sadece ${formatTRY(card.used)}. ${formatTRY(n)} tutarında ödeme yapılamaz.`,
          [{ text: 'Tamam', style: 'cancel' }]
        );
        return;
      }
      onPay(bankId, n, note || undefined);
    }
  };

  return (
    <Sheet visible={!!card} onClose={onClose} title={card.name} testID="card-action-sheet">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>KART BORCU</Text>
        <Text
          style={[styles.balanceValue, { color: colors.debt }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatTRY(card.used)}
        </Text>
        <Text style={styles.balanceHint}>Kalan limit: {formatTRY(card.limit - card.used)}</Text>
      </View>

      <Picker
        label="İşlem"
        options={[
          { label: 'Bireysel Harcama', value: 'spend', hint: 'Borç +' },
          { label: 'Bankadan Öde', value: 'pay', hint: 'Borç –' },
        ]}
        value={mode}
        onChange={(v) => setMode(v as 'spend' | 'pay')}
        testID="picker-card-action"
      />
      {mode === 'pay' && (
        <Picker
          label="Banka"
          options={banks.map((b) => ({ label: b.name, value: b.id, hint: formatTRY(b.balance) }))}
          value={bankId}
          onChange={setBankId}
          testID="picker-card-bank"
          emptyText="Önce bir banka hesabı ekleyin"
        />
      )}
      <Field label="Tutar (₺)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0,00" testID="input-card-amount" />
      <Field label="Açıklama (Opsiyonel)" value={note} onChangeText={setNote} testID="input-card-note" />
      <Button
        title={mode === 'spend' ? 'Harcama Ekle' : 'Ödeme Yap'}
        onPress={submit}
        disabled={mode === 'pay' && !bankId}
        testID="btn-submit-card-action"
      />

      <TransactionList transactions={transactions} context="card" />
    </Sheet>
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
  list: { padding: spacing.xl, gap: spacing.lg, paddingTop: spacing.sm },
  cardVisual: {
    aspectRatio: 1.7,
    borderRadius: radius.card,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBank: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  cardName: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  cardMid: { gap: 2 },
  cardLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  cardAmount: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  cardBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgSecondary,
    overflow: 'hidden',
    marginTop: 8,
  },
  cardBarFill: { height: '100%', borderRadius: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardSmall: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  cardMeta: {
    paddingHorizontal: spacing.sm,
    paddingTop: 6,
  },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  balanceCard: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    borderRadius: radius.card,
    gap: 4,
  },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  balanceValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  balanceHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
