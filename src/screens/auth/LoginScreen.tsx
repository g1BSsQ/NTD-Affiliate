import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth, MOCK_CREDENTIALS } from '../../navigation/AppNavigator';
import { supabase } from '../../lib/supabase';


type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'Email hoặc mật khẩu không đúng.\n\n📝 Tài khoản test: test@ntd.com / 123456'
          : authError.message
        );
      } else if (data.session) {
        login();
      }
    } catch (err: any) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NTD</Text>
            </View>
            <Text style={styles.title}>NTD Affiliate</Text>
            <Text style={styles.subtitle}>Đăng nhập vào tài khoản của bạn</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />

            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              required
              rightIcon={
                <Text style={styles.showHide}>{showPass ? 'Ẩn' : 'Hiện'}</Text>
              }
              onRightIconPress={() => setShowPass(!showPass)}
            />

            <Pressable 
              style={styles.forgotRow} 
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>

            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.loginBtn}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Mock credentials hint */}
            <View style={styles.mockHint}>
              <View style={styles.mockHintHeader}>
                <Text style={styles.mockHintTitle}>📝 Tài khoản test:</Text>
                <Pressable 
                  style={styles.quickLoginBtn} 
                  onPress={() => {
                    setEmail(MOCK_CREDENTIALS.email);
                    setPassword(MOCK_CREDENTIALS.password);
                    // Use a small delay to show the fields being filled
                    setTimeout(handleLogin, 100);
                  }}
                >
                  <Text style={styles.quickLoginText}>Dùng ngay ⚡</Text>
                </Pressable>
              </View>
              <Text style={styles.mockHintText}>Email: test@ntd.com</Text>
              <Text style={styles.mockHintText}>Mật khẩu: 123456</Text>
            </View>

            <Button
              title="Tạo tài khoản mới"
              variant="outline"
              fullWidth
              size="lg"
              onPress={() => navigation.navigate('Register')}
            />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2025 CÔNG TY CỔ PHẦN GIÁO DỤC COEDU
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: { color: '#fff', fontSize: FontSize.xl, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.text.secondary, textAlign: 'center' },
  form: { backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 20, elevation: 6 },
  errorBanner: { backgroundColor: Colors.dangerLight, color: Colors.danger, padding: Spacing.sm, borderRadius: 8, marginBottom: Spacing.md, fontSize: FontSize.sm, textAlign: 'center' },
  showHide: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  forgotRow: { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.xs },
  forgotText: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  loginBtn: { marginBottom: Spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.sm, fontSize: FontSize.sm, color: Colors.text.tertiary },
  mockHint: { backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  mockHintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mockHintTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  quickLoginBtn: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  quickLoginText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  mockHintText: { fontSize: FontSize.xs, color: Colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  footer: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.text.tertiary, marginTop: Spacing.xxl },
});

export default LoginScreen;
