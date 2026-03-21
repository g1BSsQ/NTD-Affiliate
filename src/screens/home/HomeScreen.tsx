import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { OrderStatusBadge, UserStatusBadge } from '../../components/Badge';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserStatus, OrderStatus, UserRankLabel, UserRank } from '../../constants/enums';
import type { Order } from '../../types';

// --- Mock data (replace with API / Zustand) ---
const mockUser = {
  fullName: 'Nguyễn Văn A',
  username: 'nguyenvana',
  status: UserStatus.ACTIVE,
  rank: UserRank.CTV_NANG_CAO,
  referralCode: 'nguyenvana',
  rewardWallet: 1500000,
  commissionWallet: 4750000,
  thisMonthSales: 15000000,
  totalSales: 63000000,
};

const mockOrders: Order[] = [
  {
    id: '1',
    items: [{ product: { id: '5', name: 'CTV Nâng cao', boxes: 5, pricePerBox: 3000000 }, quantity: 1 }],
    subtotal: 15000000,
    vat: 1200000,
    total: 16200000,
    status: OrderStatus.COMPLETED,
    pickupAtWarehouse: true,
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: '2',
    items: [{ product: { id: '2', name: 'CTV Cơ bản', boxes: 2, pricePerBox: 3000000 }, quantity: 1 }],
    subtotal: 6000000,
    vat: 480000,
    total: 6480000,
    status: OrderStatus.PENDING_ADMIN,
    pickupAtWarehouse: false,
    createdAt: '2026-03-20T14:30:00Z',
  },
];

const StatCard = ({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) => (
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <CurrencyText amount={amount} size="lg" color={accent ? Colors.accent : Colors.primary} />
  </Card>
);

const OrderRow = React.memo(({ item }: { item: Order }) => {
  const orderName = item.items[0]?.product.name ?? 'Đơn hàng';
  const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderName}>{orderName}</Text>
        <Text style={styles.orderDate}>{dateStr}</Text>
      </View>
      <View style={styles.orderRight}>
        <CurrencyText amount={item.total} size="sm" />
        <OrderStatusBadge status={item.status} />
      </View>
    </View>
  );
});

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header / Greeting */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.userName}>{mockUser.fullName}</Text>
                <Text style={styles.rankText}>{UserRankLabel[mockUser.rank]}</Text>
              </View>
              <UserStatusBadge status={mockUser.status} />
            </View>
            <Text style={styles.referralLabel}>Mã giới thiệu của bạn</Text>
            <View style={styles.referralBox}>
              <Text style={styles.referralCode}>{mockUser.referralCode.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Wallet Cards */}
        <Text style={styles.sectionTitle}>Số dư ví</Text>
        <View style={styles.statRow}>
          <StatCard label="💰 Ví Điểm Thưởng" amount={mockUser.rewardWallet} />
          <StatCard label="💸 Ví Hoa Hồng" amount={mockUser.commissionWallet} accent />
        </View>

        {/* Sales stats */}
        <Text style={styles.sectionTitle}>Doanh số</Text>
        <Card style={styles.salesCard}>
          <View style={styles.salesRow}>
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>Tháng này</Text>
              <CurrencyText amount={mockUser.thisMonthSales} size="lg" color={Colors.success} />
            </View>
            <View style={styles.salesDivider} />
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>Tích lũy</Text>
              <CurrencyText amount={mockUser.totalSales} size="lg" color={Colors.primary} />
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Tiến độ lên TĐL 3 (48 triệu)</Text>
            <Text style={styles.progressPct}>{Math.min(100, Math.floor((mockUser.totalSales / 48000000) * 100))}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.floor((mockUser.totalSales / 48000000) * 100))}%` }]} />
          </View>
        </Card>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
        <Card noPadding>
          {mockOrders.map((order, idx) => (
            <React.Fragment key={order.id}>
              <OrderRow item={order} />
              {idx < mockOrders.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xxxl },
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
});

export default HomeScreen;
