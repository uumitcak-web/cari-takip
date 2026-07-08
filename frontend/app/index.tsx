import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { formatTRY, nextStatementDate, daysUntil } from '../src/format';
import { cashTotal, DEFAULT_CASH_COUNTS } from '../src/types';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const { data, ready } = useStore();
  const router = useRouter();

  const totals = useMemo(() => {
    const totalDebt = data.companies.reduce(
      (sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0
    );
    const totalCredit = data.companies.reduce(
      (sum, c) => sum + (c.balance < 0 ? -c.balance : 0), 0
    );
    const totalBankOnly = data.banks.reduce((sum, b) => sum + b.balance, 0);
    const evde = cashTotal(data.cashCounts || DEFAULT_CASH_COUNTS);
    const totalBank = totalBankOnly + evde;
    const totalCardDebt = data.cards.reduce((sum, c) => sum + c.used, 0);
    const totalLimit = data.cards.reduce((sum, c) => sum + c.limit, 0);
    const net = totalBank - totalDebt - totalCardDebt + totalCredit;
    return { totalDebt, totalCredit, totalBank, totalCardDebt, totalLimit, net, evde };
  }, [data]);

  const unpaidCompanies = useMemo(
    () => data.companies.filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance),
    [data.companies]
  );

  const upcomingStatements = useMemo(() => {
    return data.cards
      .map((c) => {
        const next = nextStatementDate(c.statementDay);
        return { card: c, days: daysUntil(next), date: next };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [data.cards]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.loading}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="dashboard-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GENEL ÖZET</Text>
          <Text style={styles.title}>Finansal Durum</Text>
        </View>

        {/* Hızlı Erişim — En çok kullanılan bölümler */}
        <View style={styles.quickTabs} testID="quick-tabs">
          <TouchableOpacity
            style={styles.quickTab}
            onPress={() => router.push('/cariler')}
            testID="quick-tab-cariler"
            activeOpacity={0.75}
          >
            <View style={[styles.quickTabIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="people" size={20} color={colors.debt} />
            </View>
            <Text style={styles.quickTabLabel}>Cariler</Text>
            <Text style={styles.quickTabValue}>{data.companies.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTab}
            onPress={() => router.push('/kasa')}
            testID="quick-tab-kasa"
            activeOpacity={0.75}
          >
            <View style={[styles.quickTabIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="wallet" size={20} color={colors.asset} />
            </View>
            <Text style={styles.quickTabLabel}>Kasa</Text>
            <Text style={styles.quickTabValue}>{(data.kasaEntries || []).length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTab}
            onPress={() => router.push('/genel-durum')}
            testID="quick-tab-kupur"
            activeOpacity={0.75}
          >
            <View style={[styles.quickTabIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash" size={20} color={colors.warning} />
            </View>
            <Text style={styles.quickTabLabel}>Kupür</Text>
            <Text style={styles.quickTabValue}>{formatTRY(totals.evde, false)} ₺</Text>
          </TouchableOpacity>
        </View>

        {/* Net Pozisyon */}
        <View style={styles.netCard} testID="net-position-card">
          <Text style={styles.netLabel}>NET POZİSYON</Text>
          <Text style={[styles.netAmount, { color: totals.net >= 0 ? colors.asset : colors.debt }]}>
            {formatTRY(totals.net)}
          </Text>
          <Text style={styles.netHint}>
            Banka varlıkları – Şirket borçları – Kart borçları
          </Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          <MetricCard
            label="ŞİRKET BORÇ"
            value={formatTRY(totals.totalDebt)}
            color={colors.debt}
            icon="trending-down"
            testID="metric-company-debt"
          />
          <MetricCard
            label="BANKA VARLIK"
            value={formatTRY(totals.totalBank)}
            color={colors.asset}
            icon="business"
            testID="metric-bank-asset"
          />
          <MetricCard
            label="KART BORCU"
            value={formatTRY(totals.totalCardDebt)}
            color={colors.debt}
            icon="card"
            testID="metric-card-debt"
          />
          <MetricCard
            label="TOPLAM LİMİT"
            value={formatTRY(totals.totalLimit)}
            color={colors.textPrimary}
            icon="speedometer"
            testID="metric-total-limit"
          />
        </View>

        {/* Yaklaşan Hesap Kesimleri */}
        {upcomingStatements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YAKLAŞAN HESAP KESİMLERİ</Text>
            {upcomingStatements.map(({ card, days, date }) => (
              <TouchableOpacity
                key={card.id}
                style={styles.row}
                onPress={() => router.push('/kartlar')}
                testID={`upcoming-statement-${card.id}`}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.dot, { backgroundColor: days <= 5 ? colors.warning : colors.textPrimary }]} />
                  <View>
                    <Text style={styles.rowTitle}>{card.name}</Text>
                    <Text style={styles.rowSub}>
                      {date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}
                      {' · '}
                      {days === 0 ? 'Bugün' : days === 1 ? 'Yarın' : `${days} gün sonra`}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowAmount, { color: colors.debt }]}>
                  {formatTRY(card.used)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Ödenmemiş Şirketler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ÖDENMEMİŞ ŞİRKETLER</Text>
            {unpaidCompanies.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/cariler')}>
                <Text style={styles.linkText}>Tümü</Text>
              </TouchableOpacity>
            )}
          </View>
          {unpaidCompanies.length === 0 ? (
            <Text style={styles.emptyMini}>Tüm şirket ödemeleri yapılmış. ✓</Text>
          ) : (
            unpaidCompanies.slice(0, 5).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.row}
                onPress={() => router.push('/cariler')}
                testID={`unpaid-${c.id}`}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.avatar]}>
                    <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>{c.name}</Text>
                    <Text style={styles.rowSub}>{c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</Text>
                  </View>
                </View>
                <Text style={[styles.rowAmount, { color: colors.debt }]}>
                  {formatTRY(c.balance)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Kart Borçları Detayı */}
        {data.cards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KART BAZLI BORÇLAR</Text>
            {data.cards.map((c) => {
              const pct = c.limit > 0 ? Math.min(100, (c.used / c.limit) * 100) : 0;
              return (
                <View key={c.id} style={styles.cardRow} testID={`card-debt-${c.id}`}>
                  <View style={styles.cardRowHeader}>
                    <Text style={styles.rowTitle}>{c.name}</Text>
                    <Text style={[styles.rowAmount, { color: colors.debt }]}>{formatTRY(c.used)}</Text>
                  </View>
                  <Text style={styles.rowSub}>
                    {c.bankName} · Kalan limit {formatTRY(c.limit - c.used)}
                  </Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pct > 80 ? colors.debt : colors.textPrimary }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {data.companies.length === 0 && data.banks.length === 0 && data.cards.length === 0 && (
          <View style={styles.welcome} testID="welcome-card">
            <Ionicons name="rocket" size={32} color={colors.textPrimary} />
            <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
            <Text style={styles.welcomeText}>
              Cari hesaplarınızı, banka hesaplarınızı ve kredi kartlarınızı bu uygulamada
              tamamen çevrimdışı yönetin. Başlamak için alt menüden bir bölüm seçin.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  label, value, color, icon, testID,
}: {
  label: string; value: string; color: string;
  icon: keyof typeof Ionicons.glyphMap; testID: string;
}) {
  return (
    <View style={styles.metric} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  loading: { padding: spacing.xl, color: colors.textSecondary },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  header: { gap: 4, marginBottom: spacing.xs },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  quickTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickTab: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  quickTabIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  quickTabLabel: {
    fontSize: 12, fontWeight: '700',
    color: colors.textPrimary, letterSpacing: -0.2,
  },
  quickTabValue: {
    fontSize: 11, fontWeight: '600',
    color: colors.textSecondary,
  },
  netCard: {
    backgroundColor: colors.cardDark,
    padding: spacing.xl,
    borderRadius: radius.card,
    gap: 4,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  netAmount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  netHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: 8,
    minHeight: 100,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  section: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptyMini: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  cardRow: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  cardRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgSecondary,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: '100%', borderRadius: 3 },
  welcome: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
