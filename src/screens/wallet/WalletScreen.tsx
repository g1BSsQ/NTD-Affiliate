import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { useAppStore, type Transaction } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { FlashList } from '@shopify/flash-list';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMMISSION' | 'REWARD'>('ALL');

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, [fetchWallets, fetchTransactions]);

  const rewardWallet = wallets.find(w => w.type === 'REWARD')?.balance ?? 0;
  const commissionWallet = wallets.find(w => w.type === 'COMMISSION')?.balance ?? 0;

  const filtered = transactions.filter(t => activeTab === 'ALL' || t.wallet_type === activeTab);

  // --- Tính dữ liệu 6 tháng gần nhất cho BarChart ---
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const total = transactions
        .filter(t => {
          const td = new Date(t.created_at);
          return (
            t.type === 'COMMISSION' &&
            t.amount > 0 &&
            td.getMonth() === month &&
            td.getFullYear() === year
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        value: total / 1_000_000, // Đổi sang triệu để label gọn
        label: `T${d.getMonth() + 1}`,
        frontColor: total > 0 ? Colors.primary : Colors.border,
        topLabelComponent: total > 0
          ? () => (
              <Text style={chartStyles.barLabel}>
                {(total / 1_000_000).toFixed(1)}M
              </Text>
            )
          : undefined,
      };
    });
  }, [transactions]);

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt < 100000) { Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 100.000đ'); return; }
    if (amt > commissionWallet) {
      Alert.alert('Lỗi', 'Số dư ví Hoa hồng không đủ để thực hiện giao dịch.');
      return;
    }
    
    if (!bankName.trim() || !bankAccount.trim() || !bankOwner.trim()) {
      Alert.alert('Lỗi', 'Vui lòng cung cấp đầy đủ thông tin ngân hàng thụ hưởng.');
      return;
    }

    setWithdrawLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('withdraw_requests').insert({
        user_id: user.id,
        amount: amt,
        status: 'PENDING',
        bank_name: bankName.trim(),
        bank_account: bankAccount.trim(),
        bank_owner: bankOwner.trim().toUpperCase()
      });

      if (error) {
        Alert.alert('Lỗi', error.message);
      } else {
        setWithdrawAmt('');
        setBankName('');
        setBankAccount('');
        setBankOwner('');
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

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Ví tiền</Text>
        <Text style={styles.subtitle}>Quản lý số dư và giao dịch</Text>
      </View>

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

      {/* Biểu đồ thu nhập 6 tháng */}
      <Card style={chartStyles.card}>
        <Text style={styles.cardTitle}>📈 Hoa hồng theo tháng</Text>
        <Text style={chartStyles.subtitle}>6 tháng gần nhất (đơn vị: triệu đồng)</Text>
        <View style={chartStyles.chartWrapper}>
          <BarChart
            data={chartData}
            width={SCREEN_WIDTH - 80}
            height={140}
            barWidth={32}
            spacing={16}
            roundedTop
            noOfSections={4}
            maxValue={Math.max(...chartData.map(d => d.value), 1)}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={Colors.border}
            yAxisTextStyle={chartStyles.axisLabel}
            xAxisLabelTextStyle={chartStyles.axisLabel}
            hideRules
            isAnimated
          />
        </View>
      </Card>

      <Card style={styles.withdrawCard}>
        <Text style={styles.cardTitle}>Rút tiền</Text>
        <Text style={styles.withdrawNote}>Tối thiểu 100.000đ · Chờ Admin duyệt</Text>
        
        <View style={styles.bankFields}>
          <TextInput style={styles.withdrawInput} value={bankName} onChangeText={setBankName} placeholder="Tên Ngân Hàng (VD: Vietcombank)" placeholderTextColor={Colors.text.tertiary} />
          <TextInput style={styles.withdrawInput} value={bankAccount} onChangeText={setBankAccount} placeholder="Số tài khoản" keyboardType="numeric" placeholderTextColor={Colors.text.tertiary} />
          <TextInput style={styles.withdrawInput} value={bankOwner} onChangeText={setBankOwner} placeholder="Tên chủ tài khoản (Không Dấu)" autoCapitalize="characters" placeholderTextColor={Colors.text.tertiary} />
        </View>

        <View style={styles.withdrawRow}>
          <TextInput
            style={[styles.withdrawInput, { flex: 1, marginBottom: 0 }]}
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

      <View style={styles.txSectionHeader}>
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
      </View>
      <View style={styles.cardTopBorder} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlashList
        data={filtered}
        renderItem={({ item }) => (
          <View style={styles.txRowWrapper}>
            <TransactionRow item={item as Transaction} />
          </View>
        )}
        keyExtractor={(item) => (item as Transaction).id}
        estimatedItemSize={76}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={styles.cardBottomBorder} />}
        ListEmptyComponent={
          <View style={[styles.txRowWrapper, styles.emptyBox]}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.txRowWrapper}><View style={styles.divider} /></View>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const chartStyles = StyleSheet.create({
  card: { marginBottom: Spacing.xl, padding: Spacing.lg },
  subtitle: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginBottom: Spacing.md },
  chartWrapper: { alignItems: 'center', marginLeft: -Spacing.sm },
  axisLabel: { fontSize: 9, color: Colors.text.tertiary },
  barLabel: { fontSize: 8, color: Colors.primary, fontWeight: '700', marginBottom: 2 },
});

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
  bankFields: { marginBottom: Spacing.md, gap: Spacing.sm },
  withdrawInput: {
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
  txSectionHeader: { marginBottom: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.secondary },
  tabTextActive: { color: '#fff' },
  headerWrapper: { paddingBottom: Spacing.xs },
  cardTopBorder: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, height: Spacing.md },
  cardBottomBorder: { backgroundColor: Colors.surface, borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg, height: Spacing.lg },
  txRowWrapper: { backgroundColor: Colors.surface },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
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
