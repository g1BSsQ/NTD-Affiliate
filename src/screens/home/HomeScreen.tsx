import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button } from '../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { CurrencyText } from '../../components/CurrencyText';
import { OrderStatusBadge, UserStatusBadge } from '../../components/Badge';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserRankLabel } from '../../constants/enums';
import { useAppStore, type Order as StoreOrder } from '../../store/useAppStore';
import { FlashList } from '@shopify/flash-list';
import { MILESTONES } from '../../constants/milestones';
import { formatVND } from '../../components/CurrencyText';

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

const OrderRow = React.memo(({ item, onPay }: { item: StoreOrder; onPay: (o: StoreOrder) => void }) => {
  const orderName = PACKAGE_NAMES[item.package_id] ?? 'Đơn hàng';
  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');
  const isWaiting = item.status === 'WAITING_PAYMENT';

  return (
    <View style={styles.orderRow}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderName}>{orderName}</Text>
        <Text style={styles.orderDate}>{dateStr}</Text>
      </View>
      <View style={styles.orderRight}>
        <CurrencyText amount={item.total_price} size="sm" />
        <OrderStatusBadge status={item.status as any} />
        {isWaiting && (
          <Pressable style={styles.payNowBtn} onPress={() => onPay(item)}>
            <Text style={styles.payNowText}>Thanh toán ngay</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const HomeScreen = () => {
  const { profile, wallets, orders, networkNode, loading, fetchAll, uploadOrderReceipt } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [payingOrder, setPayingOrder] = React.useState<StoreOrder | null>(null);
  const [receiptUri, setReceiptUri] = React.useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

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

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
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
          <Text style={styles.referralLabel}>🎯 Mã giới thiệu của bạn (Nhấn để chép)</Text>
          <View style={styles.referralBox}>
            <Text 
              style={styles.referralCode}
              onPress={() => {
                Clipboard.setString(profile.sponsor_code || '');
                Alert.alert('Đã chép!', `Mã ${profile.sponsor_code} đã được lưu vào bộ nhớ tạm.`);
              }}
            >
              {profile.sponsor_code || '---'}
            </Text>
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
        
        {(() => {
          const nextMill = MILESTONES.find(m => totalSales < m.target) ?? MILESTONES[MILESTONES.length - 1];
          const prog = Math.min(1, totalSales / nextMill.target);
          return (
            <>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Tiến độ lên {nextMill.label} ({formatVND(nextMill.target)})</Text>
                <Text style={styles.progressPct}>{Math.floor(prog * 100)}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.floor(prog * 100)}%` }]} />
              </View>
            </>
          );
        })()}
      </Card>

      {/* Recent Orders */}
      <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>Đơn hàng gần đây</Text>
      <View style={styles.cardTopBorder} />
    </View>
  );

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, includeBase64: true });
    if (result.assets?.[0]?.uri) {
      setReceiptUri(result.assets[0].uri);
      if (result.assets[0].base64) setReceiptBase64(result.assets[0].base64);
    }
  };

  const handlePay = async () => {
    if (!payingOrder || !receiptUri || !receiptBase64 || !profile) return;
    try {
      setUploading(true);
      const ext = receiptUri.split('.').pop() || 'jpg';
      const fileName = `receipt_order_${payingOrder.id}_${Date.now()}.${ext}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, require('base64-arraybuffer').decode(receiptBase64), {
          contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath);

      await uploadOrderReceipt(payingOrder.id, publicUrl);

      Alert.alert('Thành công', 'Biên lai đã được gửi. Vui lòng chờ quản trị viên duyệt.');
      setPayingOrder(null);
      setReceiptUri(null);
      setReceiptBase64(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tải lên biên lai.');
    } finally {
      setUploading(false);
    }
  };

  const renderPaymentModal = () => (
    <Modal visible={!!payingOrder} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thanh toán đơn hàng</Text>
            <Pressable onPress={() => setPayingOrder(null)}>
              <Text style={{ fontSize: 24, color: Colors.text.secondary }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>Quét mã QR để chuyển khoản</Text>
              <Image 
                source={{ uri: 'https://img.vietqr.io/image/mbbank-0393043405-compact2.jpg?amount=' + payingOrder?.total_price + '&addInfo=THANH TOAN DON HANG ' + payingOrder?.id }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
              <View style={styles.bankInfo}>
                <Text style={styles.bankText}>Ngân hàng: <Text style={styles.boldText}>MB Bank</Text></Text>
                <Text style={styles.bankText}>Số TK: <Text style={styles.boldText}>0393043405</Text></Text>
                <Text style={styles.bankText}>Chủ TK: <Text style={styles.boldText}>NGUYEN TIEN DUNG</Text></Text>
                <Text style={styles.bankText}>Số tiền: <Text style={styles.boldText}>{formatVND(payingOrder?.total_price || 0)}</Text></Text>
              </View>
            </View>

            <Text style={styles.label}>Tải lên ảnh biên lai</Text>
            <Pressable style={styles.imagePicker} onPress={handlePickImage}>
              {receiptUri ? (
                <Image source={{ uri: receiptUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={{ fontSize: 32 }}>📸</Text>
                  <Text style={{ color: Colors.text.tertiary, marginTop: 8 }}>Chạm để chọn ảnh</Text>
                </View>
              )}
            </Pressable>

            <Button
              title={uploading ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
              onPress={handlePay}
              disabled={!receiptUri || uploading}
              style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxl }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlashList
        data={recentOrders}
        renderItem={({ item }) => (
          <View style={styles.orderRowWrapper}>
            <OrderRow item={item as StoreOrder} onPay={setPayingOrder} />
          </View>
        )}
        keyExtractor={(item) => (item as StoreOrder).id}
        estimatedItemSize={76}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={styles.cardBottomBorder} />}
        ListEmptyComponent={
          <View style={[styles.orderRowWrapper, styles.emptyBox]}>
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.orderRowWrapper}><View style={styles.divider} /></View>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      />
      {renderPaymentModal()}
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
  headerWrapper: { paddingBottom: Spacing.xs },
  cardTopBorder: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, height: Spacing.md, marginHorizontal: Spacing.lg },
  cardBottomBorder: { backgroundColor: Colors.surface, borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg, height: Spacing.lg, marginHorizontal: Spacing.lg },
  orderRowWrapper: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg },
  listContent: { paddingBottom: Spacing.xxxl },
  payNowBtn: { backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, marginTop: Spacing.xs },
  payNowText: { fontSize: 10, color: Colors.warning, fontWeight: '700', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, height: '85%', padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  qrContainer: { alignItems: 'center', backgroundColor: '#f8f9fa', padding: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.lg },
  qrTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.secondary, marginBottom: Spacing.md },
  qrImage: { width: 220, height: 220, marginBottom: Spacing.md },
  bankInfo: { width: '100%', gap: 4 },
  bankText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  boldText: { fontWeight: '700', color: Colors.text.primary },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary, marginBottom: Spacing.sm },
  imagePicker: { height: 200, backgroundColor: '#f8f9fa', borderRadius: Radius.md, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
});

export default HomeScreen;
