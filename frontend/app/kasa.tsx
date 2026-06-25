import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY, parseTRY, formatDate } from '../src/format';
import Sheet from '../src/components/Sheet';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import FAB from '../src/components/FAB';
import {
  KasaEntry, KasaTransaction, calcKasa, DEFAULT_KASA_SETTINGS,
} from '../src/types';

export default function Kasa() {
  const {
    data,
    addKasaEntry, deleteKasaEntry,
    addKasaTransaction, deleteKasaTransaction,
    updateKasaSettings,
  } = useStore();
  const entries = data.kasaEntries || [];
  const txs = data.kasaTransactions || [];
  const settings = data.kasaSettings || DEFAULT_KASA_SETTINGS;

  const [addOpen, setAddOpen] = useState(false);
  const [actionFor, setActionFor] = useState<KasaEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const entryNetTotal = (entryId: string) => {
    return txs
      .filter((t) => t.entryId === entryId)
      .reduce((s, t) => s + calcKasa(t).net, 0);
  };

  const grandTotal = useMemo(
    () => txs.reduce((s, t) => s + calcKasa(t).net, 0),
    [txs]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="kasa-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>POS KASA HESABI</Text>
          <Text style={styles.title}>Kasa</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.totalLabel}>NET TOPLAM</Text>
          <Text
            style={[styles.total, { color: grandTotal >= 0 ? colors.asset : colors.debt }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatTRY(grandTotal)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setSettingsOpen(true)}
          testID="btn-kasa-settings"
        >
          <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.ratesBar}>
        <View style={styles.rateChip}>
          <Text style={styles.rateLabel}>Komisyon</Text>
          <Text style={styles.rateValue}>%{formatPct(settings.defaultCommissionPct)}</Text>
        </View>
        <View style={styles.rateChip}>
          <Text style={styles.rateLabel}>Vergi</Text>
          <Text style={styles.rateValue}>%{formatPct(settings.defaultTaxPct)}</Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsOpen(true)} hitSlop={6}>
          <Text style={styles.editRates}>Düzenle</Text>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <EmptyState
          icon="cash"
          title="Henüz kayıt yok"
          subtitle="Yeni bir kayıt eklemek için (örn. Osman) sağ alttaki + butonuna basın."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {entries.map((e) => {
            const net = entryNetTotal(e.id);
            const count = txs.filter((t) => t.entryId === e.id).length;
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.row}
                onPress={() => setActionFor(e)}
                onLongPress={() => {
                  Alert.alert(
                    'Sil',
                    `${e.name} ve tüm işlemleri silinsin mi?`,
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => deleteKasaEntry(e.id) },
                    ]
                  );
                }}
                testID={`kasa-row-${e.id}`}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{e.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{e.name}</Text>
                    <Text style={styles.sub}>
                      {count === 0 ? 'Henüz işlem yok' : `${count} işlem`}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', maxWidth: '45%' }}>
                  <Text
                    style={[styles.amount, { color: net > 0 ? colors.asset : net < 0 ? colors.debt : colors.textSecondary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatTRY(net)}
                  </Text>
                  <Text style={styles.subSmall}>Net Toplam</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <FAB onPress={() => setAddOpen(true)} testID="add-kasa-fab" />

      <AddEntrySheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (name) => {
          await addKasaEntry(name);
          setAddOpen(false);
        }}
      />

      <EntryActionSheet
        entry={actionFor}
        transactions={actionFor ? txs.filter((t) => t.entryId === actionFor.id) : []}
        defaultCommissionPct={settings.defaultCommissionPct}
        defaultTaxPct={settings.defaultTaxPct}
        onClose={() => setActionFor(null)}
        onAddTx={async (tx) => {
          if (!actionFor) return;
          await addKasaTransaction({ ...tx, entryId: actionFor.id });
        }}
        onDeleteTx={deleteKasaTransaction}
      />

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        defaultCommissionPct={settings.defaultCommissionPct}
        defaultTaxPct={settings.defaultTaxPct}
        onSave={async (c, t) => {
          await updateKasaSettings({ defaultCommissionPct: c, defaultTaxPct: t });
          setSettingsOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

// -------------------- Add Entry Sheet --------------------
function AddEntrySheet({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <Sheet
      visible={visible}
      onClose={() => { setName(''); onClose(); }}
      title="Yeni Kasa Kaydı"
      testID="add-kasa-sheet"
    >
      <Field
        label="Ad / Açıklama"
        value={name}
        onChangeText={setName}
        placeholder="Örn. Osman, Ahmet, Müşteri 1..."
        testID="input-kasa-name"
        autoFocus
      />
      <Text style={styles.hint}>
        Her kayıt için ayrı bir POS işlem geçmişi tutulur. Detay için kayda tıklayın.
      </Text>
      <Button
        title="Kaydet"
        testID="btn-save-kasa-entry"
        onPress={() => {
          const v = name.trim();
          if (!v) return;
          onSubmit(v);
          setName('');
        }}
      />
    </Sheet>
  );
}

// -------------------- Settings Sheet --------------------
function SettingsSheet({
  visible, onClose, defaultCommissionPct, defaultTaxPct, onSave,
}: {
  visible: boolean;
  onClose: () => void;
  defaultCommissionPct: number;
  defaultTaxPct: number;
  onSave: (commission: number, tax: number) => void;
}) {
  const [c, setC] = useState(formatPct(defaultCommissionPct));
  const [t, setT] = useState(formatPct(defaultTaxPct));

  React.useEffect(() => {
    if (visible) {
      setC(formatPct(defaultCommissionPct));
      setT(formatPct(defaultTaxPct));
    }
  }, [visible, defaultCommissionPct, defaultTaxPct]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Varsayılan Oranlar" testID="kasa-settings-sheet">
      <Text style={styles.hint}>
        Yeni işlem eklerken bu değerler otomatik gelir. İstediğinizde işlem ekleme ekranında değiştirebilirsiniz.
      </Text>
      <Field
        label="POS Komisyon Oranı (%)"
        value={c}
        onChangeText={setC}
        keyboardType="numeric"
        placeholder="1,99"
        testID="input-settings-commission"
      />
      <Field
        label="Vergi Oranı (%)"
        value={t}
        onChangeText={setT}
        keyboardType="numeric"
        placeholder="5"
        testID="input-settings-tax"
      />
      <Button
        title="Kaydet"
        testID="btn-save-kasa-settings"
        onPress={() => {
          const cn = parseTRY(c);
          const tn = parseTRY(t);
          onSave(cn, tn);
        }}
      />
    </Sheet>
  );
}

// -------------------- Entry Action Sheet --------------------
function EntryActionSheet({
  entry, transactions, defaultCommissionPct, defaultTaxPct,
  onClose, onAddTx, onDeleteTx,
}: {
  entry: KasaEntry | null;
  transactions: KasaTransaction[];
  defaultCommissionPct: number;
  defaultTaxPct: number;
  onClose: () => void;
  onAddTx: (tx: Omit<KasaTransaction, 'id' | 'date' | 'entryId'>) => Promise<void>;
  onDeleteTx: (id: string) => void;
}) {
  const [note, setNote] = useState('');
  const [tutar, setTutar] = useState('');
  const [pos, setPos] = useState('');
  const [posOpen, setPosOpen] = useState(false);
  const [commPct, setCommPct] = useState(formatPct(defaultCommissionPct));
  const [taxPct, setTaxPct] = useState(formatPct(defaultTaxPct));

  React.useEffect(() => {
    if (entry) {
      setNote('');
      setTutar('');
      setPos('');
      setPosOpen(false);
      setCommPct(formatPct(defaultCommissionPct));
      setTaxPct(formatPct(defaultTaxPct));
    }
  }, [entry, defaultCommissionPct, defaultTaxPct]);

  if (!entry) return null;

  const tutarN = parseTRY(tutar);
  const posN = parseTRY(pos);
  const commN = parseTRY(commPct);
  const taxN = parseTRY(taxPct);

  const calc = calcKasa({
    tutar: tutarN,
    pos: posOpen ? posN : 0,
    commissionRatePct: commN,
    taxRatePct: taxN,
  });

  const canSubmit = (tutarN > 0) || (posOpen && posN > 0);

  const totalNet = transactions.reduce((s, t) => s + calcKasa(t).net, 0);
  const totalGross = transactions.reduce((s, t) => s + (t.tutar + t.pos), 0);

  const submit = async () => {
    if (!canSubmit) return;
    await onAddTx({
      tutar: tutarN,
      pos: posOpen ? posN : 0,
      commissionRatePct: posOpen ? commN : 0,
      taxRatePct: posOpen ? taxN : 0,
      note: note.trim() || undefined,
    });
    setNote('');
    setTutar('');
    setPos('');
  };

  const confirmDeleteTx = (tx: KasaTransaction) => {
    const c = calcKasa(tx);
    Alert.alert(
      'İşlemi Geri Al',
      `Bu kayıt silinecek (net ${formatTRY(c.net)}). Onaylıyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Al', style: 'destructive', onPress: () => onDeleteTx(tx.id) },
      ]
    );
  };

  return (
    <Sheet visible={!!entry} onClose={onClose} title={entry.name} testID="kasa-action-sheet">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>NET TOPLAM</Text>
        <Text
          style={[styles.balanceValue, { color: totalNet >= 0 ? colors.asset : colors.debt }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {formatTRY(totalNet)}
        </Text>
        <Text style={styles.balanceHint}>
          {transactions.length === 0
            ? 'Henüz işlem yok'
            : `${transactions.length} işlem · Brüt ${formatTRY(totalGross)}`}
        </Text>
      </View>

      <Field
        label="Tutar — Nakit (₺)"
        value={tutar}
        onChangeText={setTutar}
        keyboardType="numeric"
        placeholder="0,00"
        testID="input-kasa-tutar"
      />

      {!posOpen ? (
        <TouchableOpacity
          onPress={() => setPosOpen(true)}
          style={styles.addItemBtn}
          testID="btn-open-pos"
          activeOpacity={0.7}
        >
          <Ionicons name="card-outline" size={16} color={colors.textPrimary} />
          <Text style={styles.addItemText}>+ POS ile öde / komisyon hesapla</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.posBox}>
          <View style={styles.posBoxHeader}>
            <Text style={styles.posBoxTitle}>POS BÖLÜMÜ</Text>
            <TouchableOpacity onPress={() => { setPosOpen(false); setPos(''); }} hitSlop={8} testID="btn-close-pos">
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Field
            label="Pos Tutarı (₺)"
            value={pos}
            onChangeText={setPos}
            keyboardType="numeric"
            placeholder="0,00"
            testID="input-kasa-pos"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field
                label="Komisyon (%)"
                value={commPct}
                onChangeText={setCommPct}
                keyboardType="numeric"
                placeholder="1,99"
                testID="input-kasa-commission"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Vergi (%)"
                value={taxPct}
                onChangeText={setTaxPct}
                keyboardType="numeric"
                placeholder="5"
                testID="input-kasa-tax"
              />
            </View>
          </View>

          {/* Canlı hesap */}
          {(posN > 0 || tutarN > 0) && (
            <View style={styles.calcBox}>
              <CalcRow label="Tutar (nakit)" value={formatTRY(tutarN)} />
              <CalcRow label="Pos" value={formatTRY(posN)} />
              <View style={styles.calcSeparator} />
              <CalcRow
                label={`Komisyon (Pos × %${formatPct(commN)})`}
                value={`−${formatTRY(calc.commission)}`}
                negative
              />
              <CalcRow
                label={`Vergi (Komisyon × %${formatPct(taxN)})`}
                value={`−${formatTRY(calc.tax)}`}
                negative
              />
              <View style={styles.calcSeparator} />
              <CalcRow label="Brüt" value={formatTRY(calc.gross)} muted />
              <CalcRow label="NET TOPLAM" value={formatTRY(calc.net)} bold positive />
            </View>
          )}
        </View>
      )}

      <Field
        label="Açıklama (Opsiyonel)"
        value={note}
        onChangeText={setNote}
        placeholder="Not..."
        testID="input-kasa-note"
      />

      <Button
        title="Kaydet"
        onPress={submit}
        testID="btn-submit-kasa"
        disabled={!canSubmit}
      />

      <TouchableOpacity onPress={onClose} style={styles.cancelBtn} testID="btn-cancel-kasa">
        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.cancelText}>Vazgeç</Text>
      </TouchableOpacity>

      {/* Hareket Geçmişi */}
      <View style={styles.historyWrap}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyHeaderText}>HAREKET GEÇMİŞİ</Text>
          {transactions.length > 0 && (
            <Text style={styles.historyHint}>Geri almak için basılı tutun</Text>
          )}
        </View>
        {transactions.length === 0 ? (
          <Text style={styles.historyEmpty}>Henüz işlem yok</Text>
        ) : (
          transactions
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((tx) => {
              const c = calcKasa(tx);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.historyRow}
                  onLongPress={() => confirmDeleteTx(tx)}
                  delayLongPress={400}
                  testID={`kasa-history-${tx.id}`}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyRowTop}>
                      <Text style={styles.historyLabel}>
                        {tx.note ? tx.note : 'İşlem'}
                      </Text>
                      {tx.pos > 0 && (
                        <View style={styles.posBadge}>
                          <Ionicons name="card" size={9} color={colors.purchase} />
                          <Text style={styles.posBadgeText}>POS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.historyDate}>
                      {formatDate(tx.date)}
                      {tx.pos > 0 ? ` · Brüt ${formatTRY(tx.tutar + tx.pos, false)} − Kesinti ${formatTRY(c.commission + c.tax, false)} ₺` : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      { color: c.net >= 0 ? colors.asset : colors.debt },
                    ]}
                  >
                    {formatTRY(c.net)}
                  </Text>
                </TouchableOpacity>
              );
            })
        )}
      </View>
    </Sheet>
  );
}

function CalcRow({
  label, value, bold, muted, negative, positive,
}: {
  label: string; value: string;
  bold?: boolean; muted?: boolean; negative?: boolean; positive?: boolean;
}) {
  return (
    <View style={styles.calcRow}>
      <Text
        style={[
          styles.calcLabel,
          muted && { color: colors.textSecondary },
          bold && { fontWeight: '800', color: colors.textPrimary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.calcValue,
          bold && { fontSize: 16, fontWeight: '800' },
          negative && { color: colors.debt },
          positive && { color: colors.asset },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return '0';
  // Show up to 4 decimals but trim trailing zeros, use comma
  const s = n
    .toFixed(4)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
  return s.replace('.', ',');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1.2 },
  totalLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  total: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, maxWidth: 160 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },

  ratesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rateLabel: {
    fontSize: 10, fontWeight: '700',
    color: colors.textSecondary, letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 12, fontWeight: '800', color: colors.textPrimary,
  },
  editRates: {
    fontSize: 11, fontWeight: '700',
    color: colors.textPrimary,
    textDecorationLine: 'underline',
    marginLeft: 'auto',
  },

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
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  balanceCard: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    borderRadius: radius.card,
    gap: 4,
  },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  balanceValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  balanceHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  row2: { flexDirection: 'row', gap: spacing.sm },

  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.base,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  addItemText: {
    fontSize: 13, fontWeight: '700', color: colors.textPrimary,
  },

  posBox: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  posBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posBoxTitle: {
    fontSize: 11, fontWeight: '700',
    color: colors.textSecondary, letterSpacing: 1.5,
  },

  calcBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.base,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    gap: spacing.sm,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'right',
  },
  calcSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: spacing.sm,
  },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  historyWrap: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyHeaderText: {
    fontSize: 11, fontWeight: '700',
    color: colors.textSecondary, letterSpacing: 1.5,
  },
  historyHint: {
    fontSize: 10, color: colors.textSecondary, fontStyle: 'italic',
  },
  historyEmpty: {
    fontSize: 13, color: colors.textSecondary, paddingVertical: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  historyRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyLabel: {
    fontSize: 14, fontWeight: '600', color: colors.textPrimary,
  },
  posBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  posBadgeText: {
    fontSize: 9, fontWeight: '800',
    color: colors.purchase, letterSpacing: 0.5,
  },
  historyDate: {
    fontSize: 11, color: colors.textSecondary, marginTop: 2,
  },
  historyAmount: {
    fontSize: 15, fontWeight: '800', letterSpacing: -0.3,
  },
});
