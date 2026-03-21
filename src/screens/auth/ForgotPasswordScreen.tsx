import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!identifier.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Email.');
      return;
    }
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim().toLowerCase());
      if (error) {
        Alert.alert('Lỗi', error.message);
      } else {
        setStep(2);
        Alert.alert('Thành công', 'Link khôi phục mật khẩu đã được gửi đến email ' + identifier);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    // TODO: Call API to reset password
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi. Hãy đăng nhập lại.', [
        { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login' as never) }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Quay lại</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Nhập thông tin tài khoản để nhận mã khôi phục' 
                : 'Nhập mã OTP và đặt mật khẩu mới'}
            </Text>
          </View>

          <Card style={styles.card}>
            {step === 1 ? (
              <View>
                <Input
                  label="Email hoặc Số điện thoại"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="name@example.com hoặc 09..."
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />
                <Button
                  title="Gửi mã OTP"
                  onPress={handleRequestOTP}
                  loading={loading}
                  fullWidth
                  size="lg"
                  style={styles.submitBtn}
                />
              </View>
            ) : (
              <View>
                <Input
                  label="Mã OTP"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  required
                  hint="Nhập mã 6 số được gửi về email/SĐT của bạn"
                />
                <Input
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  required
                />
                <Input
                  label="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  required
                />
                <Button
                  title="Thay đổi mật khẩu"
                  onPress={handleResetPassword}
                  loading={loading}
                  variant="accent"
                  fullWidth
                  size="lg"
                  style={styles.submitBtn}
                />
                <Pressable onPress={() => setStep(1)} style={styles.resendRow}>
                  <Text style={styles.resendText}>Chưa nhận được mã? Gửi lại</Text>
                </Pressable>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing.xl, flexGrow: 1 },
  backBtn: { marginBottom: Spacing.xl },
  backText: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  header: { marginBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },
  card: { padding: Spacing.xl },
  submitBtn: { marginTop: Spacing.md },
  resendRow: { marginTop: Spacing.lg, alignItems: 'center' },
  resendText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
});

export default ForgotPasswordScreen;
