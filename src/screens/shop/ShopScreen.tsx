import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

import { useAppStore } from '../../store/useAppStore';

const PACKAGES = [
  { id: '1', label: 'CTV Tiêu dùng', boxes: 1, pricePerBox: 3000000 },
  { id: '2', label: 'CTV Cơ bản', boxes: 2, pricePerBox: 3000000 },
  { id: '5', label: 'CTV Nâng cao', boxes: 5, pricePerBox: 3000000 },
  { id: '8', label: 'CTV Chuyên nghiệp', boxes: 8, pricePerBox: 3000000 },
];
const REWARD_PER_BOX = 50000;

const ShopScreen = () => {
  const { profile, wallets, fetchWallets, fetchOrders, fetchTransactions, createOrder, fetchAll } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const [selected, setSelected] = useState<typeof PACKAGES[0] | null>(null);
  const [step, setStep] = useState<'shop' | 'checkout'>('shop');
  const [usePoints, setUsePoints] = useState(false);
  const [pickupAtWarehouse, setPickupAtWarehouse] = useState(true);
  const [address, setAddress] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rewardBalance = wallets.find(w => w.type === 'REWARD')?.balance ?? 0;

  useEffect(() => {
    if (profile?.address) {
      setAddress(profile.address);
    }
  }, [profile]);

  const total = selected ? Math.floor(selected.boxes * selected.pricePerBox * 1.08) : 0;
  const vat = selected ? total - selected.boxes * selected.pricePerBox : 0;
  const estimatedReward = selected ? selected.boxes * REWARD_PER_BOX : 0;

  const amountToPay = selected ? total : 0;
  const pointsToUse = usePoints ? Math.min(rewardBalance, amountToPay) : 0;
  const remainingAmount = amountToPay - pointsToUse;

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920 });
    if (result.assets?.[0]?.uri) setReceipt(result.assets[0].uri);
  };

  const handleOrder = async () => {
    if (!selected) return;
    if (remainingAmount > 0 && !receipt) {
      Alert.alert('Lỗi', 'Vui lòng tải ảnh biên lai chuyển khoản.');
      return;
    }
    if (!pickupAtWarehouse && !address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    try {
      await createOrder(
        selected.id,
        selected.boxes,
        total,
        receipt || '',
        pointsToUse,
        pickupAtWarehouse ? 'Tại kho đại lý' : address,
        pickupAtWarehouse ? 'PICKUP' : 'SHIPPING'
      );
      Alert.alert('Thành công!', 'Đơn hàng của bạn đã được gửi và đang chờ xác nhận.');
      setStep('shop');
      setSelected(null);
      setReceipt(null);
      setUsePoints(false);
      setAddress('');
      setPickupAtWarehouse(true);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'checkout' && selected) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => setStep('shop')} style={styles.backRow}>
            <Text style={styles.backText}>← Quay lại</Text>
          </Pressable>
          <Text style={styles.title}>Xác nhận đơn hàng</Text>

          {/* Order Summary */}
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
            <View style={styles.summaryRow}><Text style={styles.rowLabel}>Sản phẩm</Text><Text style={styles.rowValue}>{selected.label}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.rowLabel}>Số lượng</Text><Text style={styles.rowValue}>{selected.boxes} hộp</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.rowLabel}>Tiền hàng</Text><CurrencyText amount={selected.boxes * selected.pricePerBox} size="sm" /></View>
            <View style={styles.summaryRow}><Text style={styles.rowLabel}>Thuế VAT 8%</Text><CurrencyText amount={vat} size="sm" /></View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TỔNG THANH TOÁN</Text>
              <CurrencyText amount={total} size="lg" color={Colors.accent} />
            </View>
            <View style={styles.rewardNote}>
              <Text style={styles.rewardNoteText}>🎁 Dự kiến tích lũy: <Text style={styles.rewardVal}>{formatVND(estimatedReward)}</Text></Text>
            </View>
          </Card>

          {/* Delivery Method */}
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>📍 Hình thức nhận hàng</Text>
            <View style={styles.deliveryToggleRow}>
              <Pressable
                style={[styles.deliveryBtn, pickupAtWarehouse && styles.deliveryBtnActive]}
                onPress={() => setPickupAtWarehouse(true)}
              >
                <Text style={[styles.deliveryBtnText, pickupAtWarehouse && styles.deliveryBtnTextActive]}>Tại kho</Text>
              </Pressable>
              <Pressable
                style={[styles.deliveryBtn, !pickupAtWarehouse && styles.deliveryBtnActive]}
                onPress={() => setPickupAtWarehouse(false)}
              >
                <Text style={[styles.deliveryBtnText, !pickupAtWarehouse && styles.deliveryBtnTextActive]}>Giao tận nơi</Text>
              </Pressable>
            </View>

            {!pickupAtWarehouse && (
              <View style={styles.addressContainer}>
                <Text style={styles.inputLabel}>Địa chỉ giao hàng:</Text>
                <TextInput
                  style={styles.addressInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Nhập địa chỉ nhận hàng chi tiết..."
                  multiline
                />
              </View>
            )}
          </Card>

          {/* Payment Method - Mixed */}
          <Card style={styles.paymentCard}>
            <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>

            <Pressable
              style={styles.pointToggle}
              onPress={() => setUsePoints(!usePoints)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, usePoints && styles.checkboxChecked]}>
                  {usePoints && <View style={styles.checkmark} />}
                </View>
                <View style={styles.pointTextContainer}>
                  <Text style={styles.pointLabel}>Sử dụng Ví Điểm Thưởng</Text>
                  <Text style={styles.pointBalance}>Số dư: {formatVND(rewardBalance)}</Text>
                </View>
              </View>
            </Pressable>

            {usePoints && (
              <View style={styles.calculationRow}>
                <Text style={styles.calcLabel}>Số điểm sử dụng:</Text>
                <Text style={styles.calcValue}>-{formatVND(pointsToUse)}</Text>
              </View>
            )}

            <View style={styles.transferInfo}>
              <Text style={styles.transferLabel}>Số tiền cần chuyển khoản:</Text>
              <Text style={styles.transferAmount}>
                {formatVND(remainingAmount)}
              </Text>
            </View>

            {remainingAmount > 0 ? (
              <View style={styles.bankInfo}>
                <Text style={styles.bankTitle}>Thông tin chuyển khoản:</Text>
                <Text style={styles.bankText}>Ngân hàng: MB Bank</Text>
                <Text style={styles.bankText}>Số TK: 1234567890</Text>
                <Text style={styles.bankText}>Chủ TK: COEDU EDUCATION JSC</Text>
                <Text style={styles.bankNote}>* Nội dung: MDH {profile?.sponsor_code} {selected.boxes}H</Text>

                <View style={styles.qrMock}>
                  <Text style={styles.qrEmoji}>📱</Text>
                  <Text style={styles.qrNote}>QR Code chuyển khoản nhanh</Text>
                </View>

                <Pressable style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnText}>
                    {receipt ? '✅ Đã thay đổi biên lai' : '📤 Tải ảnh biên lai'}
                  </Text>
                </Pressable>

                {receipt && (
                  <View style={{ marginTop: Spacing.md }}>
                    <View style={styles.uploadBox}>
                      <Image source={{ uri: receipt }} style={styles.previewImg} resizeMode="cover" />
                    </View>
                    <Pressable onPress={() => setReceipt(null)}>
                      <Text style={styles.removeText}>✕ Xóa ảnh này</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.fullPointNote}>
                <Text style={styles.fullPointText}>🎉 Bạn dùng 100% điểm thưởng, không cần chuyển khoản.</Text>
              </View>
            )}
          </Card>

          <Button title="Gửi xác nhận đơn hàng" onPress={handleOrder} loading={loading} variant="accent" fullWidth size="lg" style={{ marginTop: Spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Mua hàng</Text>
          <Text style={styles.subtitle}>Chọn gói sản phẩm phù hợp</Text>
        </View>

        {PACKAGES.map(pkg => {
          const pkgTotal = Math.floor(pkg.boxes * pkg.pricePerBox * 1.08);
          const isSelected = selected?.id === pkg.id;
          return (
            <Pressable key={pkg.id} onPress={() => setSelected(pkg)}>
              <Card style={[styles.pkgCard, isSelected && styles.pkgSelected]}>
                <View style={styles.pkgRow}>
                  <View style={styles.pkgLeft}>
                    <Text style={[styles.pkgName, isSelected && styles.pkgNameSelected]}>{pkg.label}</Text>
                    <Text style={styles.pkgBoxes}>{pkg.boxes} hộp CTH</Text>
                    <Text style={styles.rewardBadge}>🎁 +{formatVND(pkg.boxes * REWARD_PER_BOX)} điểm</Text>
                  </View>
                  <View style={styles.pkgRight}>
                    <Text style={styles.pkgPayLabel}>Thanh toán</Text>
                    <CurrencyText amount={pkgTotal} size="md" color={isSelected ? Colors.accent : Colors.primary} />
                    <Text style={styles.vatNote}>VAT 8% đã bao gồm</Text>
                  </View>
                </View>
                {isSelected && <View style={styles.checkIcon}><Text style={styles.checkText}>✓</Text></View>}
              </Card>
            </Pressable>
          );
        })}

        <Button
          title={selected ? `Đặt mua — ${formatVND(total)}` : 'Chọn gói trước'}
          onPress={() => setStep('checkout')}
          disabled={!selected}
          variant="primary"
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  pageHeader: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs },
  backRow: { marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  pkgCard: { marginBottom: Spacing.sm },
  pkgSelected: { borderWidth: 2, borderColor: Colors.accent },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgLeft: { flex: 1 },
  pkgName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary },
  pkgNameSelected: { color: Colors.primary },
  pkgBoxes: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 2 },
  pkgSalesLabel: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginTop: 2 },
  pkgRight: { alignItems: 'flex-end' },
  pkgPayLabel: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginBottom: 2 },
  vatNote: { fontSize: 10, color: Colors.text.tertiary },
  checkIcon: { position: 'absolute', top: -1, right: -1, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  summaryCard: { marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  rowLabel: { fontSize: FontSize.sm, color: Colors.text.secondary },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text.primary },
  bankCard: { marginBottom: Spacing.md },
  bankRow: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.xs },
  bankVal: { fontWeight: '700', color: Colors.text.primary },
  bankAmt: { color: Colors.accent, fontSize: FontSize.md },
  bankNote: { color: Colors.primary, fontWeight: '700', fontSize: 10, marginTop: Spacing.sm },
  
  // Mixed Payment Styles
  paymentCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  pointToggle: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: Colors.primary, borderRadius: 4, marginRight: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary },
  checkmark: { width: 10, height: 10, backgroundColor: 'white', borderRadius: 2 },
  pointTextContainer: { flex: 1 },
  pointLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary },
  pointBalance: { fontSize: 11, color: Colors.text.secondary },
  calculationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  calcLabel: { color: Colors.text.secondary, fontSize: FontSize.sm },
  calcValue: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },
  transferInfo: { backgroundColor: 'rgba(52, 152, 219, 0.05)', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  transferLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 4 },
  transferAmount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  bankInfo: { marginTop: Spacing.md },
  bankTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  bankText: { fontSize: 13, color: Colors.text.secondary, marginBottom: 2 },
  uploadBtn: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md },
  uploadBtnText: { color: 'white', fontWeight: '700' },
  fullPointNote: { padding: Spacing.md, backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: Radius.md, alignItems: 'center' },

  fullPointText: { color: Colors.success, fontWeight: '700', textAlign: 'center' },
  qrMock: { marginTop: Spacing.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, alignItems: 'center' },
  qrEmoji: { fontSize: 36, marginBottom: Spacing.xs },
  qrNote: { fontSize: FontSize.xs, color: Colors.text.secondary },
  uploadBox: { borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, minHeight: 120, overflow: 'hidden', marginTop: Spacing.sm },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  uploadIcon: { fontSize: 32, marginBottom: Spacing.xs },
  uploadText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  previewImg: { width: '100%', height: 180 },
  removeText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600', marginTop: Spacing.xs, alignSelf: 'flex-end' },
  rewardBadge: { fontSize: 10, fontWeight: '700', color: Colors.success, marginTop: 4, backgroundColor: 'rgba(39, 174, 96, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, alignSelf: 'flex-start' },
  rewardNote: { marginTop: Spacing.sm, alignItems: 'flex-end' },
  rewardNoteText: { fontSize: FontSize.xs, color: Colors.text.secondary },
  deliveryToggleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  deliveryBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surface },
  deliveryBtnActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  deliveryBtnText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600' },
  deliveryBtnTextActive: { color: Colors.primary },
  addressContainer: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginBottom: 4, fontWeight: '600' },
  addressInput: { 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    padding: Spacing.sm, 
    fontSize: FontSize.sm, 
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  rewardVal: { fontWeight: '700', color: Colors.success },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  methodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  methodBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  methodActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  methodTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary, marginBottom: 2 },
  methodTextActive: { color: Colors.primary },
  methodSub: { fontSize: 10, color: Colors.text.tertiary },
  rewardCard: { padding: Spacing.lg, backgroundColor: Colors.surfaceElevated, borderLeftWidth: 4, borderLeftColor: Colors.accent },
  rewardInfoText: { fontSize: FontSize.sm, color: Colors.text.primary, lineHeight: 20 },
  rewardHighlight: { fontWeight: '800', color: Colors.accent },
  insufficientText: { fontSize: FontSize.xs, color: Colors.danger, marginTop: Spacing.sm, fontWeight: '600' },
});

export default ShopScreen;
