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
import Picker from '../src/components/Picker';
import EmptyState from '../src/components/EmptyState';
import FAB from '../src/components/FAB';
import {
  KasaEntry, KasaTransaction, Transaction, Bank,
  calcKasa, kasaEntryTotals, DEFAULT_KASA_SETTINGS,
} from '../src/types';

export default function Kasa() {
  const {
    data,
    addKasaEntry, deleteKasaEntry,
    addKasaTransaction, deleteKasaTransaction,
    updateKasaSettings,
    addKasaTransfer, deleteTransaction,
  } = useStore();
  const entries = data.kasaEntries || [];
  const kasaTxs = data.kasaTransactions || [];
  const transactions = data.transactions || [];
  const settings = data.kasaSettings || DEFAULT_KASA_SETTINGS;
  const banks = data.banks || [];

  const [addOpen, setAddOpen] = useState(false);
  const [actionFor, setActionFor] = useState<KasaEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Aggregate totals across all entries
  const grandTotals = useMemo(() => {
    let posdanGelen = 0;
    let nakit = 0;
    for (const e of entries) {
      const t = kasaEntryTotals(e.id, kasaTxs, transactions);
      posdanGelen += t.posdanGelen;
      nakit += t.nakit;
    }
    return { posdanGelen, nakit, netToplam: posdanGelen + nakit };
  }, [entries, kasaTxs, transactions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="kasa-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ÖZET</Text>
          <Text style={styles.title}>Kasa</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setSettingsOpen(true)}
          testID="btn-kasa-settings"
        >
          <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tüm kayıtların özet kartı */}
      <View style={styles.grandBalanceWrap}>
        <View style={styles.balanceCard} testID="kasa-grand-balance">
          <View style={styles.balanceSplitRow}>
            <View style={styles.balanceSplitCol}>
              <Text style={styles.splitLabel}>POSTAN GELEN</Text>
              <Text
                style={[styles.splitValue, { color: grandTotals.posdanGelen > 0 ? colors.asset : grandTotals.posdanGelen < 0 ? colors.debt : colors.textSecondary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatTRY(grandTotals.posdanGelen)}
              </Text>
            </View>
            <View style={styles.balanceSplitDivider} />
            <View style={styles.balanceSplitCol}>
              <Text style={styles.splitLabel}>NAKİT</Text>
              <Text
                style={[styles.splitValue, { color: grandTotals.nakit > 0 ? colors.textPrimary : colors.textSecondary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatTRY(grandTotals.nakit)}
              </Text>
            </View>
          </View>
          <View style={styles.netToplamRow}>
            <Text style={styles.netToplamLabel}>NET TOPLAM</Text>
            <Text
              style={[styles.netToplamValue, { color: grandTotals.netToplam >= 0 ? colors.asset : colors.debt }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatTRY(grandTotals.netToplam)}
            </Text>
          </View>
        </View>
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
            const totals = kasaEntryTotals(e.id, kasaTxs, transactions);
            const interactions = totals.saleCount + totals.transferCount;
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.entryCard}
                onPress={() => setActionFor(e)}
                onLongPress={() => {
                  Alert.alert(
                    'Sil',
                    `${e.name} ve tüm işlemleri silinsin mi? Yapılan banka aktarımları da geri alınır.`,
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => deleteKasaEntry(e.id) },
                    ]
                  );
                }}
                testID={`kasa-row-${e.id}`}
                activeOpacity={0.7}
              >
                {/* Üst: avatar + isim + işlem sayısı */}
                <View style={styles.entryHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{e.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{e.name}</Text>
                    <Text style={styles.sub}>
                      {interactions === 0 ? 'Henüz işlem yok' : `${interactions} işlem`}
                    </Text>
                  </View>
                </View>

                {/* Alt: 3'lü breakdown (Postan Gelen | Nakit + Net Toplam) */}
                <View style={styles.entryBalanceWrap}>
                  <View style={styles.balanceSplitRow}>
                    <View style={styles.balanceSplitCol}>
                      <Text style={styles.splitLabel}>POSTAN GELEN</Text>
                      <Text
                        style={[styles.entrySplitValue, { color: totals.posdanGelen > 0 ? colors.asset : totals.posdanGelen < 0 ? colors.debt : colors.textSecondary }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        {formatTRY(totals.posdanGelen)}
                      </Text>
                    </View>
                    <View style={styles.balanceSplitDivider} />
                    <View style={styles.balanceSplitCol}>
                      <Text style={styles.splitLabel}>NAKİT</Text>
                      <Text
                        style={[styles.entrySplitValue, { color: totals.nakit > 0 ? colors.textPrimary : colors.textSecondary }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        {formatTRY(totals.nakit)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryNetRow}>
                    <Text style={styles.entryNetLabel}>NET TOPLAM</Text>
                    <Text
                      style={[styles.entryNetValue, { color: totals.netToplam >= 0 ? colors.asset : colors.debt }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {formatTRY(totals.netToplam)}
                    </Text>
                  </View>
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
        kasaTxs={actionFor ? kasaTxs.filter((t) => t.entryId === actionFor.id) : []}
        transferTxs={actionFor ? transactions.filter((t) => t.type === 'kasa_transfer' && t.kasaEntryId === actionFor.id) : []}
        banks={banks}
        defaultCommissionPct={settings.defaultCommissionPct}
        defaultTaxPct={settings.defaultTaxPct}
        onClose={() => setActionFor(null)}
        onAddTx={async (tx) => {
          if (!actionFor) return;
          await addKasaTransaction({ ...tx, entryId: actionFor.id });
        }}
        onDeleteTx={deleteKasaTransaction}
        onDeleteTransfer={deleteTransaction}
        onTransfer={async (bankId, amt, note) => {
          if (!actionFor) return;
          await addKasaTransfer(actionFor.id, actionFor.name, bankId, amt, note);
        }}
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
        value={c} onChangeText={setC} keyboardType="numeric" placeholder="1,99"
        testID="input-settings-commission"
      />
      <Field
        label="Vergi Oranı (%)"
        value={t} onChangeText={setT} keyboardType="numeric" placeholder="5"
        testID="input-settings-tax"
      />
      <Button
        title="Kaydet"
        testID="btn-save-kasa-settings"
        onPress={() => onSave(parseTRY(c), parseTRY(t))}
      />
    </Sheet>
  );
}

// -------------------- Entry Action Sheet --------------------
function EntryActionSheet({
  entry, kasaTxs, transferTxs, banks,
  defaultCommissionPct, defaultTaxPct,
  onClose, onAddTx, onDeleteTx, onDeleteTransfer, onTransfer,
}: {
  entry: KasaEntry | null;
  kasaTxs: KasaTransaction[];
  transferTxs: Transaction[];
  banks: Bank[];
  defaultCommissionPct: number;
  defaultTaxPct: number;
  onClose: () => void;
  onAddTx: (tx: Omit<KasaTransaction, 'id' | 'date' | 'entryId'>) => Promise<void>;
  onDeleteTx: (id: string) => void;
  onDeleteTransfer: (id: string) => void;
  onTransfer: (bankId: string, amount: number, note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [tutar, setTutar] = useState('');
  const [pos, setPos] = useState('');
  const [posOpen, setPosOpen] = useState(false);
  const [commPct, setCommPct] = useState(formatPct(defaultCommissionPct));
  const [taxPct, setTaxPct] = useState(formatPct(defaultTaxPct));

  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAmt, setTransferAmt] = useState('');
  const [transferBankId, setTransferBankId] = useState('');
  const [transferNote, setTransferNote] = useState('');

  React.useEffect(() => {
    if (entry) {
      setNote(''); setTutar(''); setPos(''); setPosOpen(false);
      setCommPct(formatPct(defaultCommissionPct));
      setTaxPct(formatPct(defaultTaxPct));
      setTransferOpen(false); setTransferAmt('');
      setTransferBankId(banks[0]?.id || '');
      setTransferNote('');
    }
  }, [entry, defaultCommissionPct, defaultTaxPct, banks]);

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

  // Totals
  let posdanGelen = 0;
  let nakit = 0;
  for (const t of kasaTxs) {
    const c = calcKasa(t);
    posdanGelen += (t.pos - c.commission - c.tax);
    nakit += t.tutar;
  }
  for (const t of transferTxs) {
    posdanGelen -= t.amount;
  }
  const netToplam = posdanGelen + nakit;

  // Transfer validation
  const transferAmtN = parseTRY(transferAmt);
  const canTransfer = transferBankId && transferAmtN > 0 && transferAmtN <= posdanGelen + 0.001;

  const submitSale = async () => {
    if (!canSubmit) return;
    await onAddTx({
      tutar: tutarN,
      pos: posOpen ? posN : 0,
      commissionRatePct: posOpen ? commN : 0,
      taxRatePct: posOpen ? taxN : 0,
      note: note.trim() || undefined,
    });
    setNote(''); setTutar(''); setPos('');
  };

  const submitTransfer = async () => {
    if (!canTransfer) {
      if (posdanGelen <= 0) {
        Alert.alert('Aktarılacak Para Yok', 'Bu kayıtta posdan gelen bakiyesi 0. Önce bir POS satışı ekleyin.');
        return;
      }
      if (transferAmtN > posdanGelen) {
        Alert.alert(
          'Yetersiz Posdan Gelen Bakiyesi',
          `Aktarmak istediğiniz tutar (${formatTRY(transferAmtN)}) posdan gelen bakiyenizden (${formatTRY(posdanGelen)}) fazla.`
        );
        return;
      }
      if (!transferBankId) {
        Alert.alert('Banka Seçin', 'Lütfen aktarım yapılacak banka hesabını seçin.');
        return;
      }
      return;
    }
    await onTransfer(transferBankId, transferAmtN, transferNote.trim() || undefined);
    setTransferAmt(''); setTransferNote('');
  };

  const confirmDeleteSale = (tx: KasaTransaction) => {
    const c = calcKasa(tx);
    Alert.alert(
      'İşlemi Geri Al',
      `Bu POS işlemi silinecek (net ${formatTRY(c.net)}). Onaylıyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Al', style: 'destructive', onPress: () => onDeleteTx(tx.id) },
      ]
    );
  };
  const confirmDeleteTransfer = (tx: Transaction) => {
    Alert.alert(
      'Aktarımı Geri Al',
      `${formatTRY(tx.amount)} tutarındaki banka aktarımı geri alınacak. Banka bakiyesi de düşecek. Onaylıyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Al', style: 'destructive', onPress: () => onDeleteTransfer(tx.id) },
      ]
    );
  };

  // Merged history sorted by date desc
  type HistItem =
    | { kind: 'sale'; tx: KasaTransaction; date: string }
    | { kind: 'transfer'; tx: Transaction; date: string };
  const history: HistItem[] = [
    ...kasaTxs.map((t) => ({ kind: 'sale' as const, tx: t, date: t.date })),
    ...transferTxs.map((t) => ({ kind: 'transfer' as const, tx: t, date: t.date })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const bankName = (id?: string) => banks.find((b) => b.id === id)?.name || '—';

  return (
    <Sheet visible={!!entry} onClose={onClose} title={entry.name} testID="kasa-action-sheet">
      {/* Balance card with Postan Gelen + Nakit + Net Toplam */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceSplitRow}>
          <View style={styles.balanceSplitCol}>
            <Text style={styles.splitLabel}>POSTAN GELEN</Text>
            <Text
              style={[styles.splitValue, { color: posdanGelen >= 0 ? colors.asset : colors.debt }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatTRY(posdanGelen)}
            </Text>
          </View>
          <View style={styles.balanceSplitDivider} />
          <View style={styles.balanceSplitCol}>
            <Text style={styles.splitLabel}>NAKİT</Text>
            <Text
              style={[styles.splitValue, { color: nakit > 0 ? colors.textPrimary : colors.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatTRY(nakit)}
            </Text>
          </View>
        </View>
        <View style={styles.netToplamRow}>
          <Text style={styles.netToplamLabel}>NET TOPLAM</Text>
          <Text
            style={[styles.netToplamValue, { color: netToplam >= 0 ? colors.asset : colors.debt }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatTRY(netToplam)}
          </Text>
        </View>
      </View>

      {/* Parayı Aktar (collapsible) — placed UNDER posdan gelen for context */}
      {!transferOpen ? (
        <TouchableOpacity
          onPress={() => setTransferOpen(true)}
          style={[styles.addItemBtn, { borderStyle: 'solid', borderColor: colors.asset, backgroundColor: '#ECFDF5' }]}
          testID="btn-open-transfer"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward-circle" size={16} color={colors.asset} />
          <Text style={[styles.addItemText, { color: colors.asset }]}>Parayı Aktar (Bankaya)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.transferBox}>
          <View style={styles.posBoxHeader}>
            <Text style={[styles.posBoxTitle, { color: colors.asset }]}>PARAYI BANKAYA AKTAR</Text>
            <TouchableOpacity onPress={() => { setTransferOpen(false); setTransferAmt(''); }} hitSlop={8} testID="btn-close-transfer">
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {banks.length === 0 ? (
            <Text style={[styles.hint, { color: colors.debt }]}>
              Önce Bankalar sekmesinden bir banka hesabı eklemelisiniz.
            </Text>
          ) : (
            <>
              <Picker
                label="Banka Hesabı"
                options={banks.map((b) => ({ label: b.name + (b.accountName ? ` · ${b.accountName}` : ''), value: b.id }))}
                value={transferBankId}
                onChange={setTransferBankId}
                testID="picker-transfer-bank"
              />
              <Field
                label={`Aktarılacak Tutar (₺) — En fazla ${formatTRY(Math.max(0, posdanGelen))}`}
                value={transferAmt}
                onChangeText={setTransferAmt}
                keyboardType="numeric"
                placeholder="0,00"
                testID="input-transfer-amount"
              />
              <Field
                label="Açıklama (Opsiyonel)"
                value={transferNote}
                onChangeText={setTransferNote}
                placeholder="Not..."
                testID="input-transfer-note"
              />
              <Button
                title="Bankaya Aktar"
                onPress={submitTransfer}
                testID="btn-submit-transfer"
                disabled={!canTransfer}
              />
            </>
          )}
        </View>
      )}

      <View style={styles.divider} />

      {/* New POS sale form */}
      <Field
        label="Tutar — Nakit (₺)"
        value={tutar} onChangeText={setTutar} keyboardType="numeric" placeholder="0,00"
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
          <Field label="Pos Tutarı (₺)" value={pos} onChangeText={setPos} keyboardType="numeric" placeholder="0,00" testID="input-kasa-pos" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Komisyon (%)" value={commPct} onChangeText={setCommPct} keyboardType="numeric" placeholder="1,99" testID="input-kasa-commission" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Vergi (%)" value={taxPct} onChangeText={setTaxPct} keyboardType="numeric" placeholder="5" testID="input-kasa-tax" />
            </View>
          </View>
          {(posN > 0 || tutarN > 0) && (
            <View style={styles.calcBox}>
              <CalcRow label="Pos" value={formatTRY(posN)} />
              <CalcRow label={`Komisyon (Pos × %${formatPct(commN)})`} value={`−${formatTRY(calc.commission)}`} negative />
              <CalcRow label={`Vergi (Komisyon × %${formatPct(taxN)})`} value={`−${formatTRY(calc.tax)}`} negative />
              <CalcRow label="Toplam Kesinti" value={`−${formatTRY(calc.commission + calc.tax)}`} negative bold />
              <View style={styles.calcSeparator} />
              <CalcRow label="Pos Net (Pos − Kesinti)" value={formatTRY(posN - calc.commission - calc.tax)} bold />
              <CalcRow label="+ Nakit (Tutar)" value={formatTRY(tutarN)} />
              <View style={styles.calcSeparator} />
              <CalcRow label="NET TOPLAM" value={formatTRY(calc.net)} bold positive />
            </View>
          )}
        </View>
      )}
      <Field label="Açıklama (Opsiyonel)" value={note} onChangeText={setNote} placeholder="Not..." testID="input-kasa-note" />
      <Button title="Kaydet" onPress={submitSale} testID="btn-submit-kasa" disabled={!canSubmit} />

      <TouchableOpacity onPress={onClose} style={styles.cancelBtn} testID="btn-cancel-kasa">
        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.cancelText}>Vazgeç</Text>
      </TouchableOpacity>

      {/* Merged History */}
      <View style={styles.historyWrap}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyHeaderText}>HAREKET GEÇMİŞİ</Text>
          {history.length > 0 && (
            <Text style={styles.historyHint}>Geri almak için basılı tutun</Text>
          )}
        </View>
        {history.length === 0 ? (
          <Text style={styles.historyEmpty}>Henüz işlem yok</Text>
        ) : (
          history.map((h) => {
            if (h.kind === 'sale') {
              const tx = h.tx;
              const c = calcKasa(tx);
              return (
                <TouchableOpacity
                  key={`sale-${tx.id}`}
                  style={styles.historyRow}
                  onLongPress={() => confirmDeleteSale(tx)}
                  delayLongPress={400}
                  testID={`kasa-history-${tx.id}`}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyRowTop}>
                      <Text style={styles.historyLabel} numberOfLines={1}>
                        {tx.note ? tx.note : 'POS Satış'}
                      </Text>
                      {tx.pos > 0 && (
                        <View style={styles.posBadge}>
                          <Ionicons name="card" size={9} color={colors.purchase} />
                          <Text style={styles.posBadgeText}>POS</Text>
                        </View>
                      )}
                    </View>
                    {/* 1. satır: Tarih · Nakit */}
                    <Text style={styles.historyDate}>
                      {formatDate(tx.date)}
                      {tx.tutar > 0 ? ` · Nakit ${formatTRY(tx.tutar, false)} ₺` : ''}
                    </Text>
                    {/* 2. satır: Pos · Kesinti */}
                    {tx.pos > 0 && (
                      <Text style={styles.historyDate}>
                        Pos {formatTRY(tx.pos, false)} ₺ · Kesinti {formatTRY(c.commission + c.tax, false)} ₺
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.historyAmount, { color: c.net >= 0 ? colors.asset : colors.debt }]}>
                    +{formatTRY(c.net, false)} ₺
                  </Text>
                </TouchableOpacity>
              );
            } else {
              const tx = h.tx;
              return (
                <TouchableOpacity
                  key={`tr-${tx.id}`}
                  style={styles.historyRow}
                  onLongPress={() => confirmDeleteTransfer(tx)}
                  delayLongPress={400}
                  testID={`kasa-transfer-${tx.id}`}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyRowTop}>
                      <Text style={styles.historyLabel}>→ {bankName(tx.bankId)}</Text>
                      <View style={[styles.posBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="swap-horizontal" size={9} color={colors.warning} />
                        <Text style={[styles.posBadgeText, { color: colors.warning }]}>AKTARIM</Text>
                      </View>
                    </View>
                    <Text style={styles.historyDate}>
                      {formatDate(tx.date)}
                      {tx.note ? ` · ${tx.note}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: colors.debt }]}>
                    −{formatTRY(tx.amount, false)} ₺
                  </Text>
                </TouchableOpacity>
              );
            }
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
      <Text style={[styles.calcLabel, muted && { color: colors.textSecondary }, bold && { fontWeight: '800', color: colors.textPrimary }]}>
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
  const s = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1.2, marginTop: 14 },
  totalLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5 },
  total: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, maxWidth: 180 },
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
  rateLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  rateValue: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  editRates: {
    fontSize: 11, fontWeight: '700', color: colors.textPrimary,
    textDecorationLine: 'underline', marginLeft: 'auto',
  },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.sm },

  entryCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  entryBalanceWrap: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.base,
    padding: spacing.md,
    gap: spacing.sm,
  },
  entrySplitValue: {
    fontSize: 15, fontWeight: '800', letterSpacing: -0.4,
    marginTop: 2,
  },
  entryNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  entryNetLabel: {
    fontSize: 10, fontWeight: '800',
    color: colors.textPrimary, letterSpacing: 1.2,
  },
  entryNetValue: {
    fontSize: 16, fontWeight: '800', letterSpacing: -0.5,
    flex: 1, textAlign: 'right',
  },

  grandBalanceWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
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
    gap: spacing.md,
  },
  balanceSplitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  balanceSplitCol: { flex: 1, gap: 4 },
  balanceSplitDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  splitLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2 },
  splitValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  netToplamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  netToplamLabel: {
    fontSize: 11, fontWeight: '800',
    color: colors.textPrimary, letterSpacing: 1.2,
  },
  netToplamValue: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.8,
    flex: 1, textAlign: 'right',
  },

  row2: { flexDirection: 'row', gap: spacing.sm },

  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
    borderRadius: radius.base,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  addItemText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  transferBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.asset,
  },

  posBox: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  posBoxHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  posBoxTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5,
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 3, gap: spacing.sm,
  },
  calcLabel: { fontSize: 12, color: colors.textPrimary, flex: 1 },
  calcValue: {
    fontSize: 13, fontWeight: '700', color: colors.textPrimary,
    letterSpacing: -0.3, textAlign: 'right',
  },
  calcSeparator: { height: 1, backgroundColor: colors.border, marginVertical: 2 },

  divider: {
    height: 1, backgroundColor: colors.border,
    marginVertical: spacing.xs,
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  historyHeaderText: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5,
  },
  historyHint: { fontSize: 10, color: colors.textSecondary, fontStyle: 'italic' },
  historyEmpty: { fontSize: 13, color: colors.textSecondary, paddingVertical: spacing.sm },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm,
  },
  historyRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  posBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  posBadgeText: {
    fontSize: 9, fontWeight: '800',
    color: colors.purchase, letterSpacing: 0.5,
  },
  historyDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
});
