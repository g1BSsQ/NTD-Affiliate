import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { formatVND } from '../../components/CurrencyText';

// --- Data ---
const PACKAGES = [
  { id: '1', label: 'CTV Tiêu dùng', boxes: 1, pricePerBox: 3000000 },
  { id: '2', label: 'CTV Cơ bản', boxes: 2, pricePerBox: 3000000 },
  { id: '5', label: 'CTV Nâng cao', boxes: 5, pricePerBox: 3000000 },
  { id: '8', label: 'CTV Chuyên nghiệp', boxes: 8, pricePerBox: 3000000 },
];

const TOTAL_STEPS = 4;

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [pickupAtWarehouse, setPickupAtWarehouse] = useState(true);
  const [address, setAddress] = useState('');

  // Step 3
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  // Step 4
  const [cccdFrontUri, setCccdFrontUri] = useState<string | null>(null);
  const [cccdBackUri, setCccdBackUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => {
    if (step === 1) { navigation.goBack(); return; }
    setStep(s => Math.max(s - 1, 1));
  };

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
    if (result.assets?.[0]?.uri) setter(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!cccdFrontUri || !cccdBackUri) {
      Alert.alert('Thiếu ảnh', 'Vui lòng upload đủ 2 mặt CCCD.');
      return;
    }
    setLoading(true);
    // TODO: call API submit
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được gửi. Vui lòng chờ người bảo trợ xếp vào hệ thống.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const selectedPkgTotal = selectedPkg ? Math.floor(selectedPkg.boxes * selectedPkg.pricePerBox * 1.08) : 0;

  // --- Step Headers ---
  const stepTitles = ['Thông tin cá nhân', 'Chọn gói & Địa chỉ', 'Thanh toán', 'Xác minh CCCD'];
  const stepSubtitles = [
    'Điền thông tin và mã giới thiệu',
    'Chọn gói khởi đầu và địa chỉ nhận hàng',
    'Upload ảnh biên lai chuyển khoản',
    'Upload ảnh Căn cước công dân 2 mặt',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={prevStep} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backText}>← {step === 1 ? 'Đăng nhập' : 'Quay lại'}</Text>
          </Pressable>
          <Text style={styles.stepIndicator}>Bước {step}/{TOTAL_STEPS}</Text>
        </View>

        {/* Step progress bar */}
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressSegment, i + 1 <= step && styles.progressActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{stepTitles[step - 1]}</Text>
          <Text style={styles.subtitle}>{stepSubtitles[step - 1]}</Text>

          {/* ---- STEP 1: Info ---- */}
          {step === 1 && (
            <Card style={styles.card}>
              <Input label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" required />
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" required />
              <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0901234567" keyboardType="phone-pad" required />
              <Input label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry required />
              <Input
                label="Mã giới thiệu (Sponsor)"
                value={sponsorCode}
                onChangeText={setSponsorCode}
                placeholder="Nhập username của người bảo trợ"
                autoCapitalize="none"
                required
                hint="Mã này là username của người đã giới thiệu bạn."
              />
              <Button title="Tiếp theo →" onPress={nextStep} fullWidth size="lg" style={styles.nextBtn} />
            </Card>
          )}

          {/* ---- STEP 2: Package & Address ---- */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionLabel}>Chọn gói khởi đầu</Text>
              {PACKAGES.map(pkg => {
                const total = Math.floor(pkg.boxes * pkg.pricePerBox * 1.08);
                const isSelected = selectedPkg?.id === pkg.id;
                return (
                  <Pressable key={pkg.id} onPress={() => setSelectedPkg(pkg)}>
                    <Card style={[styles.pkgCard, isSelected && styles.pkgCardSelected]}>
                      <View style={styles.pkgRow}>
                        <View style={styles.pkgInfo}>
                          <Text style={[styles.pkgLabel, isSelected && styles.pkgLabelSelected]}>{pkg.label}</Text>
                          <Text style={styles.pkgBoxes}>{pkg.boxes} hộp CTH</Text>
                          <Text style={styles.pkgPrice}>DS: {formatVND(pkg.boxes * pkg.pricePerBox)}</Text>
                        </View>
                        <View style={styles.pkgTotalBox}>
                          <Text style={styles.pkgTotalLabel}>Thanh toán</Text>
                          <Text style={[styles.pkgTotal, isSelected && styles.pkgTotalSelected]}>{formatVND(total)}</Text>
                          <Text style={styles.vatNote}>đã bao gồm VAT 8%</Text>
                        </View>
                      </View>
                      {isSelected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓ Đã chọn</Text></View>}
                    </Card>
                  </Pressable>
                );
              })}

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Địa chỉ nhận hàng</Text>
              <Card style={styles.card}>
                <View style={styles.pickupRow}>
                  <Pressable style={[styles.pickupOption, pickupAtWarehouse && styles.pickupSelected]} onPress={() => setPickupAtWarehouse(true)}>
                    <Text style={[styles.pickupText, pickupAtWarehouse && styles.pickupTextSelected]}>🏭 Tại kho</Text>
                  </Pressable>
                  <Pressable style={[styles.pickupOption, !pickupAtWarehouse && styles.pickupSelected]} onPress={() => setPickupAtWarehouse(false)}>
                    <Text style={[styles.pickupText, !pickupAtWarehouse && styles.pickupTextSelected]}>🚚 Ship tận nhà</Text>
                  </Pressable>
                </View>
                {!pickupAtWarehouse && (
                  <Input label="Địa chỉ giao hàng" value={address} onChangeText={setAddress} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" multiline numberOfLines={3} required />
                )}
                <Button title="Tiếp theo →" onPress={nextStep} fullWidth size="lg" style={styles.nextBtn} disabled={!selectedPkg} />
              </Card>
            </View>
          )}

          {/* ---- STEP 3: Payment ---- */}
          {step === 3 && (
            <Card style={styles.card}>
              <View style={styles.qrBox}>
                <Text style={styles.qrTitle}>Thông tin chuyển khoản</Text>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankRow}><Text style={styles.bankLabel}>Ngân hàng: </Text>MB Bank</Text>
                  <Text style={styles.bankRow}><Text style={styles.bankLabel}>Số TK: </Text>1234567890</Text>
                  <Text style={styles.bankRow}><Text style={styles.bankLabel}>Chủ TK: </Text>COEDU EDUCATION JSC</Text>
                  <Text style={styles.bankRow}><Text style={styles.bankLabel}>Số tiền: </Text>
                    <Text style={styles.bankAmount}>{selectedPkg ? formatVND(selectedPkgTotal) : '---'}</Text>
                  </Text>
                  <Text style={styles.bankRow}><Text style={styles.bankLabel}>Nội dung: </Text>NTD {sponsorCode} {phone}</Text>
                </View>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrEmoji}>📱</Text>
                  <Text style={styles.qrNote}>Quét QR để thanh toán nhanh</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Upload biên lai chuyển khoản</Text>
              <Pressable style={styles.uploadBox} onPress={() => pickImage(setReceiptUri)}>
                {receiptUri ? (
                  <Image source={{ uri: receiptUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.uploadText}>Chụp / Chọn ảnh biên lai</Text>
                    <Text style={styles.uploadHint}>Tối đa 5MB · JPEG, PNG</Text>
                  </View>
                )}
              </Pressable>
              {receiptUri && (
                <Pressable onPress={() => setReceiptUri(null)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕ Xóa ảnh</Text>
                </Pressable>
              )}

              <Button title="Tiếp theo →" onPress={nextStep} fullWidth size="lg" style={styles.nextBtn} disabled={!receiptUri} />
            </Card>
          )}

          {/* ---- STEP 4: CCCD ---- */}
          {step === 4 && (
            <Card style={styles.card}>
              <Text style={styles.cccdNote}>
                Vui lòng chụp ảnh rõ nét CCCD của bạn. Admin sẽ xác minh để kích hoạt tài khoản.
              </Text>

              {[
                { label: 'Mặt trước CCCD', uri: cccdFrontUri, setter: setCccdFrontUri },
                { label: 'Mặt sau CCCD', uri: cccdBackUri, setter: setCccdBackUri },
              ].map(({ label, uri, setter }) => (
                <View key={label} style={styles.cccdSection}>
                  <Text style={styles.sectionLabel}>{label}</Text>
                  <Pressable style={styles.uploadBox} onPress={() => pickImage(setter)}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={styles.uploadIcon}>🪪</Text>
                        <Text style={styles.uploadText}>Chọn ảnh {label.toLowerCase()}</Text>
                        <Text style={styles.uploadHint}>Tối đa 5MB · JPEG, PNG</Text>
                      </View>
                    )}
                  </Pressable>
                  {uri && (
                    <Pressable onPress={() => setter('')} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕ Xóa ảnh</Text>
                    </Pressable>
                  )}
                </View>
              ))}

              <Button
                title={loading ? 'Đang gửi...' : 'Gửi đăng ký'}
                onPress={handleSubmit}
                loading={loading}
                variant="accent"
                fullWidth
                size="lg"
                style={styles.nextBtn}
              />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtn: { padding: Spacing.xs },
  backText: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  stepIndicator: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600' },
  progressBar: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.accent },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.xl },
  card: { marginBottom: Spacing.md },
  nextBtn: { marginTop: Spacing.md },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.secondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  pkgCard: { marginBottom: Spacing.sm },
  pkgCardSelected: { borderWidth: 2, borderColor: Colors.accent },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgInfo: { flex: 1 },
  pkgLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary, marginBottom: 2 },
  pkgLabelSelected: { color: Colors.primary },
  pkgBoxes: { fontSize: FontSize.sm, color: Colors.text.secondary },
  pkgPrice: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginTop: 2 },
  pkgTotalBox: { alignItems: 'flex-end' },
  pkgTotalLabel: { fontSize: FontSize.xs, color: Colors.text.tertiary, marginBottom: 2 },
  pkgTotal: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  pkgTotalSelected: { color: Colors.accent },
  vatNote: { fontSize: 10, color: Colors.text.tertiary },
  selectedBadge: { marginTop: Spacing.sm, alignSelf: 'flex-start', backgroundColor: Colors.accent, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  selectedBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  pickupRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  pickupOption: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  pickupSelected: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  pickupText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.secondary },
  pickupTextSelected: { color: Colors.primary },
  qrBox: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.lg },
  qrTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, textAlign: 'center' },
  bankInfo: { marginBottom: Spacing.md },
  bankRow: { fontSize: FontSize.sm, color: Colors.text.primary, marginBottom: Spacing.xs },
  bankLabel: { fontWeight: '700', color: Colors.text.secondary },
  bankAmount: { fontSize: FontSize.md, fontWeight: '900', color: Colors.accent },
  qrPlaceholder: { alignItems: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, borderStyle: 'dashed' },
  qrEmoji: { fontSize: 40, marginBottom: Spacing.xs },
  qrNote: { fontSize: FontSize.sm, color: Colors.text.secondary },
  uploadBox: { borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden', minHeight: 140 },
  uploadPlaceholder: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  uploadIcon: { fontSize: 36, marginBottom: Spacing.sm },
  uploadText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.secondary, marginBottom: Spacing.xs },
  uploadHint: { fontSize: FontSize.xs, color: Colors.text.tertiary },
  previewImage: { width: '100%', height: 200 },
  removeBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md },
  removeBtnText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600' },
  cccdNote: { fontSize: FontSize.sm, color: Colors.text.secondary, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  cccdSection: { marginBottom: Spacing.md },
});

export default RegisterScreen;
