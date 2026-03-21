import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { useAppStore, type Transaction } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

const txTypeIcon: Record<string, string> = {
  COMMISSION: '💸', REWARD: '🎁', WITHDRAW: '🏦', PURCHASE: '🛍️',
};

const TransactionRow = React.memo(({ item }: { item: Transaction }) => {
  const isPositive = item.amount > 0;
  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');
  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}><Text style={{ fontSize: 20 }}>{txTypeIcon[item.type]}</Text></View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txDate}>{dateStr}</Text>
      </View>
      <CurrencyText amount={item.amount} size="sm" showSign color={isPositive ? Colors.success : Colors.danger} />
    </View>
  );
});

const WalletScreen = () => {
  const { wallets, transactions, loading, fetchWallets, fetchTransactions } = useAppStore();
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMMISSION' | 'REWARD'>('ALL');

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, [fetchWallets, fetchTransactions]);

  const rewardWallet = wallets.find(w => w.type === 'REWARD')?.balance ?? 0;
  const commissionWallet = wallets.find(w => w.type === 'COMMISSION')?.balance ?? 0;

  const filtered = transactions.filter(t => activeTab === 'ALL' || t.wallet_type === activeTab);

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt < 100000) { Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 100.000đ'); return; }
    if (amt > commissionWallet) { Alert.alert('Lỗi', 'Số dư Ví Hoa Hồng không đủ'); return; }
    setWithdrawLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('withdraw_requests').insert({
        user_id: user.id,
        amount: amt,
        status: 'PENDING',
      });

      if (error) {
        Alert.alert('Lỗi', error.message);
      } else {
        setWithdrawAmt('');
        Alert.alert('Đã gửi yêu cầu', 'Lệnh rút tiền đang chờ Admin duyệt.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ví tiền</Text>
          <Text style={styles.subtitle}>Quản lý số dư và giao dịch</Text>
        </View>

        {/* Wallet Cards */}
        <View style={styles.walletCards}>
          <Card style={styles.walletCard} elevated>
            <Text style={styles.walletLabel}>💰 Ví Điểm Thưởng</Text>
            <CurrencyText amount={rewardWallet} size="xl" color={Colors.primary} />
            <Text style={styles.walletNote}>Dùng để mua hàng trên App</Text>
          </Card>
          <Card style={[styles.walletCard, styles.commissionCard]} elevated>
            <Text style={[styles.walletLabel, styles.walletLabelInverse]}>💸 Ví Hoa Hồng</Text>
            <CurrencyText amount={commissionWallet} size="xl" color={Colors.accent} />
            <Text style={[styles.walletNote, styles.walletNoteInverse]}>Rút về ngân hàng</Text>
          </Card>
        </View>

        {/* Withdraw */}
        <Card style={styles.withdrawCard}>
          <Text style={styles.cardTitle}>Rút tiền</Text>
          <Text style={styles.withdrawNote}>Tối thiểu 100.000đ · Chờ Admin duyệt</Text>
          <View style={styles.withdrawRow}>
            <TextInput
              style={styles.withdrawInput}
              value={withdrawAmt}
              onChangeText={setWithdrawAmt}
              placeholder="Số tiền muốn rút"
              keyboardType="numeric"
              placeholderTextColor={Colors.text.tertiary}
            />
            <Button
              title={withdrawLoading ? '...' : 'Rút'}
              onPress={handleWithdraw}
              loading={withdrawLoading}
              variant="accent"
              size="sm"
              style={styles.withdrawBtn}
            />
          </View>
        </Card>

        {/* Transactions */}
        <View style={styles.txSection}>
          <Text style={styles.cardTitle}>Lịch sử giao dịch</Text>
          <View style={styles.tabs}>
            {(['ALL', 'COMMISSION', 'REWARD'] as const).map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'ALL' ? 'Tất cả' : tab === 'COMMISSION' ? 'Hoa hồng' : 'Điểm thưởng'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Card noPadding>
            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              filtered.map((tx, idx) => (
                <React.Fragment key={tx.id}>
                  <TransactionRow item={tx} />
                  {idx < filtered.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs },
  walletCards: { gap: Spacing.sm, marginBottom: Spacing.xl },
  walletCard: { padding: Spacing.lg },
  commissionCard: { backgroundColor: Colors.primaryDark },
  walletLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.secondary, marginBottom: Spacing.sm },
  walletLabelInverse: { color: 'rgba(255,255,255,0.7)' },
  walletNote: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginTop: Spacing.xs },
  walletNoteInverse: { color: 'rgba(255,255,255,0.5)' },
  withdrawCard: { marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  withdrawNote: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginBottom: Spacing.md },
  withdrawRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  withdrawInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  withdrawBtn: { minWidth: 72 },
  txSection: { marginBottom: Spacing.xl },
  tabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.secondary },
  tabTextActive: { color: '#fff' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  txDate: { fontSize: FontSize.xs, color: Colors.text.tertiary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  emptyBox: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.text.tertiary },
});

export default WalletScreen;
