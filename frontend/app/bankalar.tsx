import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY, parseTRY } from '../src/format';
import Sheet from '../src/components/Sheet';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
import Picker from '../src/components/Picker';
import EmptyState from '../src/components/EmptyState';
import FAB from '../src/components/FAB';
import TransactionList from '../src/components/TransactionList';
import { Bank, cashTotal, DEFAULT_CASH_COUNTS } from '../src/types';

export default function Bankalar() {
  const { data, addBank, deleteBank, addBankDeposit, addBankWithdraw } = useStore();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [actionFor, setActionFor] = useState<Bank | null>(null);

  const evdeTotal = cashTotal(data.cashCounts || DEFAULT_CASH_COUNTS);
  const totalBalance = data.banks.reduce((s, b) => s + b.balance, 0) + evdeTotal;

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="bankalar-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>BANKA HESAPLARI</Text>
          <Text style={styles.title}>Varlıklarım</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.totalLabel}>TOPLAM</Text>
          <Text style={[styles.total, { color: colors.asset }]}>{formatTRY(totalBalance)}</Text>
        </View>
      </View>

      {data.banks.length === 0 && evdeTotal === 0 ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <EvdeRow total={evdeTotal} onPress={() => router.push('/genel-durum')} />
          <EmptyState
            icon="business"
            title="Henüz banka hesabı yok"
            subtitle="Banka hesabı eklemek için sağ alttaki + butonuna basın."
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <EvdeRow total={evdeTotal} onPress={() => router.push('/genel-durum')} />
          {data.banks.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.row}
              onPress={() => setActionFor(b)}
              onLongPress={() => {
                Alert.alert('Sil', `${b.name} silinsin mi?`, [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: () => deleteBank(b.id) },
                ]);
              }}
              testID={`bank-row-${b.id}`}
            >
              <View style={styles.rowLeft}>
                <View style={styles.icon}>
                  <Ionicons name="business" size={22} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{b.name}</Text>
                  {b.accountName ? <Text style={styles.sub}>{b.accountName}</Text> : null}
                </View>
              </View>
              <Text style={[styles.amount, { color: b.balance >= 0 ? colors.asset : colors.debt }]}>
                {formatTRY(b.balance)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <FAB onPress={() => setAddOpen(true)} testID="add-bank-fab" />

      <AddBankSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (v) => { await addBank(v); setAddOpen(false); }}
      />

      <BankActionSheet
        bank={actionFor}
        transactions={actionFor ? data.transactions.filter((t) => t.bankId === actionFor.id) : []}
        onClose={() => setActionFor(null)}
        onDeposit={async (amt, note) => { if (actionFor) await addBankDeposit(actionFor.id, amt, note); setActionFor(null); }}
        onWithdraw={async (amt, note) => { if (actionFor) await addBankWithdraw(actionFor.id, amt, note); setActionFor(null); }}
      />
    </SafeAreaView>
  );
}

function EvdeRow({ total, onPress }: { total: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.evdeRow}
      onPress={onPress}
      activeOpacity={0.7}
      testID="evde-card"
    >
      <View style={styles.rowLeft}>
        <View style={styles.evdeIcon}>
          <Ionicons name="home" size={22} color={colors.debt} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.evdeTitleRow}>
            <Text style={styles.evdeName}>Evde</Text>
            <View style={styles.evdeBadge}>
              <Text style={styles.evdeBadgeText}>NAKİT</Text>
            </View>
          </View>
          <Text style={styles.sub}>Kupür dökümünden hesaplanır</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={[styles.amount, { color: total > 0 ? colors.asset : colors.textSecondary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatTRY(total)}
        </Text>
        <View style={styles.editHint}>
          <Ionicons name="create-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.editHintText}>Düzenle</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AddBankSheet({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; accountName?: string; balance: number }) => void;
}) {
  const [name, setName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('');
  const reset = () => { setName(''); setAccountName(''); setBalance(''); };

  return (
    <Sheet visible={visible} onClose={() => { reset(); onClose(); }} title="Yeni Banka Hesabı" testID="add-bank-sheet">
      <Field label="Banka Adı" value={name} onChangeText={setName} placeholder="Örn. Ziraat Bankası" testID="input-bank-name" />
      <Field label="Hesap Adı (Opsiyonel)" value={accountName} onChangeText={setAccountName} placeholder="Örn. Vadesiz TL" testID="input-bank-account" />
      <Field label="Mevcut Bakiye (₺)" value={balance} onChangeText={setBalance} keyboardType="numeric" placeholder="0" testID="input-bank-balance" />
      <Button
        title="Kaydet"
        testID="btn-save-bank"
        onPress={() => {
          if (!name.trim()) return;
          onSubmit({
            name: name.trim(),
            accountName: accountName.trim() || undefined,
            balance: parseTRY(balance),
          });
          reset();
        }}
      />
    </Sheet>
  );
}

function BankActionSheet({
  bank, transactions, onClose, onDeposit, onWithdraw,
}: {
  bank: Bank | null;
  transactions: import('../src/types').Transaction[];
  onClose: () => void;
  onDeposit: (amt: number, note?: string) => void;
  onWithdraw: (amt: number, note?: string) => void;
}) {
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (bank) { setMode('in'); setAmount(''); setNote(''); }
  }, [bank]);

  if (!bank) return null;

  const submit = () => {
    const n = parseTRY(amount);
    if (!n || n <= 0) return;
    if (mode === 'in') onDeposit(n, note || undefined);
    else onWithdraw(n, note || undefined);
  };

  return (
    <Sheet visible={!!bank} onClose={onClose} title={bank.name} testID="bank-action-sheet">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>BAKİYE</Text>
        <Text
          style={[styles.balanceValue, { color: bank.balance >= 0 ? colors.asset : colors.debt }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatTRY(bank.balance)}
        </Text>
      </View>

      <Picker
        label="İşlem"
        options={[
          { label: 'Para Ekle', value: 'in' },
          { label: 'Para Çek', value: 'out' },
        ]}
        value={mode}
        onChange={(v) => setMode(v as 'in' | 'out')}
        testID="picker-bank-action"
      />
      <Field label="Tutar (₺)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0,00" testID="input-bank-amount" />
      <Field label="Açıklama (Opsiyonel)" value={note} onChangeText={setNote} testID="input-bank-note" />
      <Button title={mode === 'in' ? 'Para Ekle' : 'Para Çek'} onPress={submit} testID="btn-submit-bank-action" />

      <TransactionList transactions={transactions} context="bank" />
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
  eyebrow: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.8 },
  totalLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  total: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  icon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  evdeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.debt,
    borderRadius: radius.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  evdeIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  evdeTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  evdeName: {
    fontSize: 16, fontWeight: '800',
    color: colors.debt, letterSpacing: -0.3,
  },
  evdeBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  evdeBadgeText: {
    fontSize: 9, fontWeight: '800',
    color: colors.debt, letterSpacing: 0.8,
  },
  editHint: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 2,
  },
  editHintText: {
    fontSize: 10, fontWeight: '600',
    color: colors.textSecondary, letterSpacing: 0.3,
  },
  balanceCard: {
    backgroundColor: colors.bgSecondary, padding: spacing.lg, borderRadius: radius.card, gap: 4,
  },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  balanceValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
});
