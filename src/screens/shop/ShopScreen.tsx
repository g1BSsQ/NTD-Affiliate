import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

const PACKAGES = [
  { id: '1', label: 'CTV Tiêu dùng', boxes: 1, pricePerBox: 3000000 },
  { id: '2', label: 'CTV Cơ bản', boxes: 2, pricePerBox: 3000000 },
  { id: '5', label: 'CTV Nâng cao', boxes: 5, pricePerBox: 3000000 },
  { id: '8', label: 'CTV Chuyên nghiệp', boxes: 8, pricePerBox: 3000000 },
];

const ShopScreen = () => {
  const [selected, setSelected] = useState<typeof PACKAGES[0] | null>(null);
  const [step, setStep] = useState<'shop' | 'checkout'>('shop');
  const [pickupAtWarehouse, setPickupAtWarehouse] = useState(true);
  const [address, setAddress] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = selected ? Math.floor(selected.boxes * selected.pricePerBox * 1.08) : 0;
  const vat = selected ? total - selected.boxes * selected.pricePerBox : 0;

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920 });
    if (result.assets?.[0]?.uri) setReceiptUri(result.assets[0].uri);
  };

  const handleOrder = async () => {
    if (!receiptUri) { Alert.alert('Thiếu biên lai', 'Vui lòng upload ảnh biên lai chuyển khoản.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Đã gửi!', 'Đơn hàng đang chờ Admin xác nhận thanh toán.');
      setStep('shop'); setSelected(null); setReceiptUri(null);
    }, 1200);
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
          </Card>

          {/* Bank info */}
          <Card style={styles.bankCard}>
            <Text style={styles.cardTitle}>🏦 Thông tin chuyển khoản</Text>
            <Text style={styles.bankRow}>Ngân hàng: <Text style={styles.bankVal}>MB Bank</Text></Text>
            <Text style={styles.bankRow}>Số TK: <Text style={styles.bankVal}>1234567890</Text></Text>
            <Text style={styles.bankRow}>Chủ TK: <Text style={styles.bankVal}>COEDU EDUCATION JSC</Text></Text>
            <Text style={styles.bankRow}>Số tiền: <Text style={[styles.bankVal, styles.bankAmt]}>{formatVND(total)}</Text></Text>
            <View style={styles.qrMock}>
              <Text style={styles.qrEmoji}>📱</Text>
              <Text style={styles.qrNote}>QR Code chuyển khoản nhanh</Text>
            </View>
          </Card>

          {/* Receipt upload */}
          <Card>
            <Text style={styles.cardTitle}>📸 Upload biên lai</Text>
            <Pressable style={styles.uploadBox} onPress={pickImage}>
              {receiptUri ? (
                <Image source={{ uri: receiptUri }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>Chọn ảnh biên lai</Text>
                </View>
              )}
            </Pressable>
            {receiptUri && <Pressable onPress={() => setReceiptUri(null)}><Text style={styles.removeText}>✕ Xóa</Text></Pressable>}
          </Card>

          <Button title="Gửi xác nhận đơn hàng" onPress={handleOrder} loading={loading} variant="accent" fullWidth size="lg" style={{ marginTop: Spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
                    <Text style={styles.pkgSalesLabel}>Doanh số: {formatVND(pkg.boxes * pkg.pricePerBox)}</Text>
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
  qrMock: { marginTop: Spacing.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, alignItems: 'center' },
  qrEmoji: { fontSize: 36, marginBottom: Spacing.xs },
  qrNote: { fontSize: FontSize.xs, color: Colors.text.secondary },
  uploadBox: { borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, minHeight: 120, overflow: 'hidden', marginTop: Spacing.sm },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  uploadIcon: { fontSize: 32, marginBottom: Spacing.xs },
  uploadText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  previewImg: { width: '100%', height: 180 },
  removeText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600', marginTop: Spacing.xs, alignSelf: 'flex-end' },
});

export default ShopScreen;
