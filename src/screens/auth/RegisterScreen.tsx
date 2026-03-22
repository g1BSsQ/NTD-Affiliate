import React, { useState } from 'react';
import { decode } from 'base64-arraybuffer';
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
import { supabase } from '../../lib/supabase';


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
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>();

  // Step 4
  const [cccdFrontUri, setCccdFrontUri] = useState<string | null>(null);
  const [cccdFrontBase64, setCccdFrontBase64] = useState<string | undefined>();
  const [cccdBackUri, setCccdBackUri] = useState<string | null>(null);
  const [cccdBackBase64, setCccdBackBase64] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);

  const nextStep = async () => {
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !sponsorCode.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        Alert.alert('Lỗi định dạng', 'Email không hợp lệ.');
        return;
      }

      const phoneRegex = /^(0|84|\\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(phone.trim())) {
        Alert.alert('Lỗi định dạng', 'Số điện thoại không hợp lệ (cần 10 số, mạng VN).');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Lỗi bảo mật', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
        return;
      }

      setLoading(true);
      try {
        // Verify if sponsor code exists
        if (sponsorCode.trim().toLowerCase() !== 'admin') {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('sponsor_code', sponsorCode.trim())
            .single();

          if (error || !data) {
            Alert.alert('Lỗi Bảo trợ', 'Mã người giới thiệu không tồn tại trong hệ thống.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        Alert.alert('Lỗi mạng', 'Không thể xác minh mã bảo trợ.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    
    if (step === 2) {
      if (!selectedPkg) {
        Alert.alert('Chưa chọn gói', 'Vui lòng chọn 1 gói khởi đầu.');
        return;
      }
      if (!pickupAtWarehouse && !address.trim()) {
        Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ nhận hàng.');
        return;
      }
    }
    if (step === 3) {
      if (!receiptUri) {
        Alert.alert('Thiếu biên lai', 'Vui lòng tải lên ảnh biên lai chuyển khoản.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };
  const prevStep = () => {
    if (step === 1) { navigation.goBack(); return; }
    setStep(s => Math.max(s - 1, 1));
  };

  const pickImage = async (setterUri: (uri: string) => void, setterBase64: (base64: string) => void) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920, includeBase64: true });
    if (result.assets?.[0]?.uri) {
      setterUri(result.assets[0].uri);
      if (result.assets[0].base64) setterBase64(result.assets[0].base64);
    }
  };

  const uploadImage = async (uri: string, base64Data: string | undefined, bucket: string, prefix: string) => {
    try {
      const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
      const safeExt = ext.toLowerCase() === 'jpg' ? 'jpeg' : ext.toLowerCase();
      const fileName = `${prefix}_${Date.now()}.${safeExt}`;
      const filePath = `${email.trim().toLowerCase()}/${fileName}`;

      if (!base64Data) throw new Error('Không thể đọc dữ liệu ảnh (base64).');

      const arrayBuffer = decode(base64Data);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${safeExt}`,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (e: any) {
      console.error('Image upload error:', e);
      throw new Error(e.message || 'Lỗi mạng khi tải ảnh lên.');
    }
  };

  const handleSubmit = async () => {
    if (!cccdFrontUri || !cccdBackUri) {
      Alert.alert('Thiếu ảnh', 'Vui lòng upload đủ 2 mặt CCCD.');
      return;
    }
    if (!receiptUri || !selectedPkg) {
      Alert.alert('Lỗi', 'Thiếu thông tin gói hoặc biên lai thanh toán.');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Upload Images
      const uploadedReceipt = await uploadImage(receiptUri, receiptBase64, 'receipts', 'receipt');
      const uploadedCccdFront = await uploadImage(cccdFrontUri, cccdFrontBase64, 'cccds', 'cccd_front');
      const uploadedCccdBack = await uploadImage(cccdBackUri, cccdBackBase64, 'cccds', 'cccd_back');

      // 2. Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            sponsor_code: sponsorCode,
            package_id: selectedPkg.id,
            address: address,
            receipt_url: uploadedReceipt,
            cccd_front_url: uploadedCccdFront,
            cccd_back_url: uploadedCccdBack,
          }
        }
      });

      if (signUpError) {
        Alert.alert('Lỗi đăng ký', signUpError.message);
      } else {
        Alert.alert(
          'Đăng ký thành công!',
          'Tài khoản của bạn đã được khởi tạo. Vui lòng chờ quản trị viên duyệt thông tin.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra trong quá trình đăng ký.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              <Pressable style={styles.uploadBox} onPress={() => pickImage(setReceiptUri, setReceiptBase64)}>
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
                { label: 'Mặt trước CCCD', uri: cccdFrontUri, setterUri: setCccdFrontUri, setterBase64: setCccdFrontBase64 },
                { label: 'Mặt sau CCCD', uri: cccdBackUri, setterUri: setCccdBackUri, setterBase64: setCccdBackBase64 },
              ].map(({ label, uri, setterUri, setterBase64 }) => (
                <View key={label} style={styles.cccdSection}>
                  <Text style={styles.sectionLabel}>{label}</Text>
                  <Pressable style={styles.uploadBox} onPress={() => pickImage(setterUri, setterBase64)}>
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
                    <Pressable onPress={() => { setterUri(''); setterBase64(''); }} style={styles.removeBtn}>
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
