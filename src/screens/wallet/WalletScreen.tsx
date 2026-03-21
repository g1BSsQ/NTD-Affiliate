import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import type { WalletTransaction } from '../../types';
import { WithdrawStatus } from '../../constants/enums';

const mockTransactions: WalletTransaction[] = [
  { id: '1', type: 'COMMISSION', amount: 1500000, description: 'Hoa hồng F1 - Trần Thị Bình', walletType: 'COMMISSION', status: 'COMPLETED', createdAt: '2026-03-20T09:00:00Z' },
  { id: '2', type: 'COMMISSION', amount: 900000, description: 'Hoa hồng Nhị phân tháng 3', walletType: 'COMMISSION', status: 'COMPLETED', createdAt: '2026-03-18T14:00:00Z' },
  { id: '3', type: 'WITHDRAW', amount: -2000000, description: 'Rút tiền về VCB ***1234', walletType: 'COMMISSION', status: WithdrawStatus.APPROVED, createdAt: '2026-03-15T11:00:00Z' },
  { id: '4', type: 'REWARD', amount: 500000, description: 'Thưởng điểm đơn hàng tháng 3', walletType: 'REWARD', status: 'COMPLETED', createdAt: '2026-03-12T08:00:00Z' },
];

const txTypeIcon: Record<string, string> = {
  COMMISSION: '💸', REWARD: '🎁', WITHDRAW: '🏦', PURCHASE: '🛍️',
};

const TransactionRow = React.memo(({ item }: { item: WalletTransaction }) => {
  const isPositive = item.amount > 0;
  const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
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
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMMISSION' | 'REWARD'>('ALL');

  const rewardWallet = 1500000;
  const commissionWallet = 4750000;

  const filtered = mockTransactions.filter(t => activeTab === 'ALL' || t.walletType === activeTab);

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmt.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt < 100000) { Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 100.000đ'); return; }
    if (amt > commissionWallet) { Alert.alert('Lỗi', 'Số dư Ví Hoa Hồng không đủ'); return; }
    setWithdrawLoading(true);
    setTimeout(() => {
      setWithdrawLoading(false);
      setWithdrawAmt('');
      Alert.alert('Đã gửi yêu cầu', 'Lệnh rút tiền đang chờ Admin duyệt.');
    }, 1200);
  };

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
            {filtered.map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <TransactionRow item={tx} />
                {idx < filtered.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
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
});

export default WalletScreen;
