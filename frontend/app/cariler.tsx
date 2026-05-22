import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { Company } from '../src/types';

export default function Cariler() {
  const { data, addCompany, deleteCompany, addCompanyPurchase, addCashPayment, addCardPayment } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [actionFor, setActionFor] = useState<Company | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="cariler-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CARİ HESAPLAR</Text>
          <Text style={styles.title}>Şirketler</Text>
        </View>
        <Text style={styles.count}>{data.companies.length}</Text>
      </View>

      {data.companies.length === 0 ? (
        <EmptyState
          icon="people"
          title="Henüz şirket yok"
          subtitle="Tedarikçi veya müşteri eklemek için sağ alttaki + butonuna basın."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {data.companies.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.row}
              onPress={() => setActionFor(c)}
              onLongPress={() => {
                Alert.alert('Sil', `${c.name} silinsin mi?`, [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: () => deleteCompany(c.id) },
                ]);
              }}
              testID={`company-row-${c.id}`}
            >
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.sub}>{c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.amount,
                    { color: c.balance > 0 ? colors.debt : c.balance < 0 ? colors.asset : colors.textSecondary },
                  ]}
                >
                  {formatTRY(c.balance)}
                </Text>
                <Text style={styles.subSmall}>
                  {c.balance > 0 ? 'Borçlu' : c.balance < 0 ? 'Alacaklı' : 'Bakiye yok'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <FAB onPress={() => setAddOpen(true)} testID="add-company-fab" />

      <AddCompanySheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (vals) => {
          await addCompany(vals);
          setAddOpen(false);
        }}
      />

      <CompanyActionSheet
        company={actionFor}
        onClose={() => setActionFor(null)}
        cards={data.cards}
        transactions={actionFor ? data.transactions.filter((t) => t.companyId === actionFor.id) : []}
        onPurchase={async (amt, note) => {
          if (actionFor) await addCompanyPurchase(actionFor.id, amt, note);
          setActionFor(null);
        }}
        onCash={async (amt, note) => {
          if (actionFor) await addCashPayment(actionFor.id, amt, note);
          setActionFor(null);
        }}
        onCard={async (cardId, amt, note) => {
          if (actionFor) await addCardPayment(actionFor.id, cardId, amt, note);
          setActionFor(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddCompanySheet({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; type: 'supplier' | 'customer'; balance: number; phone?: string; note?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'supplier' | 'customer'>('supplier');
  const [balance, setBalance] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const reset = () => { setName(''); setType('supplier'); setBalance(''); setPhone(''); setNote(''); };

  return (
    <Sheet visible={visible} onClose={() => { reset(); onClose(); }} title="Yeni Şirket" testID="add-company-sheet">
      <Field label="Şirket Adı" value={name} onChangeText={setName} placeholder="Örn. Acme Tedarik" testID="input-company-name" />
      <Picker
        label="Tür"
        options={[
          { label: 'Tedarikçi', value: 'supplier' },
          { label: 'Müşteri', value: 'customer' },
        ]}
        value={type}
        onChange={(v) => setType(v as 'supplier' | 'customer')}
        testID="picker-company-type"
      />
      <Field
        label="Açılış Bakiyesi (₺)"
        value={balance}
        onChangeText={setBalance}
        keyboardType="numeric"
        placeholder="0"
        testID="input-company-balance"
      />
      <Text style={styles.hint}>Pozitif değer = Onlara borcumuz, Negatif = Onların bize borcu</Text>
      <Field label="Telefon (Opsiyonel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="input-company-phone" />
      <Field label="Not (Opsiyonel)" value={note} onChangeText={setNote} testID="input-company-note" />
      <Button
        title="Kaydet"
        testID="btn-save-company"
        onPress={() => {
          if (!name.trim()) return;
          onSubmit({
            name: name.trim(),
            type,
            balance: parseTRY(balance),
            phone: phone.trim() || undefined,
            note: note.trim() || undefined,
          });
          reset();
        }}
      />
    </Sheet>
  );
}

function CompanyActionSheet({
  company, onClose, cards, transactions, onPurchase, onCash, onCard,
}: {
  company: Company | null;
  onClose: () => void;
  cards: { id: string; name: string }[];
  transactions: import('../src/types').Transaction[];
  onPurchase: (amt: number, note?: string) => void;
  onCash: (amt: number, note?: string) => void;
  onCard: (cardId: string, amt: number, note?: string) => void;
}) {
  const [mode, setMode] = useState<'purchase' | 'cash' | 'card'>('purchase');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [cardId, setCardId] = useState('');

  React.useEffect(() => {
    if (company) {
      setMode('purchase');
      setAmount('');
      setNote('');
      setCardId(cards[0]?.id || '');
    }
  }, [company, cards]);

  if (!company) return null;

  const submit = () => {
    const n = parseTRY(amount);
    if (!n || n <= 0) return;
    if (mode === 'purchase') onPurchase(n, note || undefined);
    else if (mode === 'cash') onCash(n, note || undefined);
    else if (mode === 'card' && cardId) onCard(cardId, n, note || undefined);
  };

  return (
    <Sheet visible={!!company} onClose={onClose} title={company.name} testID="company-action-sheet">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>GÜNCEL BAKİYE</Text>
        <Text style={[styles.balanceValue, {
          color: company.balance > 0 ? colors.debt : company.balance < 0 ? colors.asset : colors.textPrimary
        }]}>
          {formatTRY(company.balance)}
        </Text>
        <Text style={styles.balanceHint}>
          {company.balance > 0 ? 'Bu şirkete borçlusunuz' :
            company.balance < 0 ? 'Bu şirket size borçlu' : 'Hesap denk'}
        </Text>
      </View>

      <TransactionList transactions={transactions} context="company" />

      <Picker
        label="İşlem"
        options={[
          { label: 'Yeni Alış', value: 'purchase', hint: 'Borç +' },
          { label: 'Elden Ödeme', value: 'cash', hint: 'Borç –' },
          { label: 'Kart ile Ödeme', value: 'card', hint: 'Borç – / Kart +' },
        ]}
        value={mode}
        onChange={(v) => setMode(v as 'purchase' | 'cash' | 'card')}
        testID="picker-action-mode"
      />

      {mode === 'card' && (
        <Picker
          label="Kart"
          options={cards.map((c) => ({ label: c.name, value: c.id }))}
          value={cardId}
          onChange={setCardId}
          testID="picker-action-card"
          emptyText="Önce bir kredi kartı ekleyin"
        />
      )}

      <Field
        label="Tutar (₺)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0,00"
        testID="input-action-amount"
      />
      <Field
        label="Açıklama (Opsiyonel)"
        value={note}
        onChangeText={setNote}
        testID="input-action-note"
      />
      <Button
        title={mode === 'purchase' ? 'Alış Ekle' : 'Ödeme Yap'}
        onPress={submit}
        testID="btn-submit-action"
        disabled={mode === 'card' && !cardId}
      />
      <TouchableOpacity onPress={onClose} style={styles.cancelBtn} testID="btn-cancel-action">
        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.cancelText}>Vazgeç</Text>
      </TouchableOpacity>
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
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  subSmall: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: -4 },
  balanceCard: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    borderRadius: radius.card,
    gap: 4,
  },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  balanceValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  balanceHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.md,
  },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
});
