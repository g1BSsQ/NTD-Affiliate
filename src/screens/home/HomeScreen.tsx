import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { OrderStatusBadge, UserStatusBadge } from '../../components/Badge';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserRankLabel } from '../../constants/enums';
import { useAppStore, type Order as StoreOrder } from '../../store/useAppStore';

const PACKAGE_NAMES: Record<string, string> = {
  '1': 'CTV Tiêu dùng',
  '2': 'CTV Cơ bản',
  '5': 'CTV Nâng cao',
  '8': 'CTV Chuyên nghiệp',
};

const StatCard = ({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) => (
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <CurrencyText amount={amount} size="lg" color={accent ? Colors.accent : Colors.primary} />
  </Card>
);

const OrderRow = React.memo(({ item }: { item: StoreOrder }) => {
  const orderName = PACKAGE_NAMES[item.package_id] ?? 'Đơn hàng';
  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderName}>{orderName}</Text>
        <Text style={styles.orderDate}>{dateStr}</Text>
      </View>
      <View style={styles.orderRight}>
        <CurrencyText amount={item.total_price} size="sm" />
        <OrderStatusBadge status={item.status as any} />
      </View>
    </View>
  );
});

const HomeScreen = () => {
  const { profile, wallets, orders, networkNode, loading, fetchAll } = useAppStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rewardWallet = wallets.find(w => w.type === 'REWARD')?.balance ?? 0;
  const commissionWallet = wallets.find(w => w.type === 'COMMISSION')?.balance ?? 0;
  const totalSales = networkNode?.total_sales ?? 0;
  const thisMonthSales = orders
    .filter(o => o.status === 'COMPLETED' && new Date(o.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, o) => sum + o.total_price, 0);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rankKey = (networkNode?.rank ?? 'CTV') as keyof typeof UserRankLabel;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header / Greeting */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.userName}>{profile.full_name}</Text>
                <Text style={styles.rankText}>{UserRankLabel[rankKey] ?? rankKey}</Text>
              </View>
              <UserStatusBadge status={profile.status as any} />
            </View>
            <Text style={styles.referralLabel}>Mã giới thiệu của bạn</Text>
            <View style={styles.referralBox}>
              <Text style={styles.referralCode}>{(profile.full_name ?? '').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Wallet Cards */}
        <Text style={styles.sectionTitle}>Số dư ví</Text>
        <View style={styles.statRow}>
          <StatCard label="💰 Ví Điểm Thưởng" amount={rewardWallet} />
          <StatCard label="💸 Ví Hoa Hồng" amount={commissionWallet} accent />
        </View>

        {/* Sales stats */}
        <Text style={styles.sectionTitle}>Doanh số</Text>
        <Card style={styles.salesCard}>
          <View style={styles.salesRow}>
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>Tháng này</Text>
              <CurrencyText amount={thisMonthSales} size="lg" color={Colors.success} />
            </View>
            <View style={styles.salesDivider} />
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>Tích lũy</Text>
              <CurrencyText amount={totalSales} size="lg" color={Colors.primary} />
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Tiến độ lên TĐL 3 (48 triệu)</Text>
            <Text style={styles.progressPct}>{Math.min(100, Math.floor((totalSales / 48000000) * 100))}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.floor((totalSales / 48000000) * 100))}%` }]} />
          </View>
        </Card>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
        <Card noPadding>
          {orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          ) : (
            orders.slice(0, 5).map((order, idx) => (
              <React.Fragment key={order.id}>
                <OrderRow item={order} />
                {idx < Math.min(orders.length, 5) - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  header: { marginBottom: Spacing.xl },
  headerGradient: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.xs },
  userName: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  rankText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600', marginTop: 2 },
  referralLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.xs },
  referralBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md, padding: Spacing.sm, alignSelf: 'flex-start' },
  referralCode: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.accent, letterSpacing: 3 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, marginBottom: Spacing.md },
  statRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  statCard: { flex: 1 },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginBottom: Spacing.xs, fontWeight: '600' },
  salesCard: { marginHorizontal: Spacing.lg },
  salesRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  salesItem: { flex: 1, alignItems: 'center' },
  salesLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, fontWeight: '600', marginBottom: Spacing.xs },
  salesDivider: { width: 1, backgroundColor: Colors.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressLabel: { fontSize: FontSize.xs, color: Colors.text.secondary },
  progressPct: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  progressBg: { height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radius.full },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg },
  orderInfo: { flex: 1 },
  orderName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.xs },
  orderDate: { fontSize: FontSize.xs, color: Colors.text.tertiary },
  orderRight: { alignItems: 'flex-end', gap: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  emptyBox: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.text.tertiary },
});

export default HomeScreen;
