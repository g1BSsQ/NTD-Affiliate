import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { UserStatusBadge } from '../../components/Badge';
import { useAuth } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserStatus, UserRank, UserRankLabel } from '../../constants/enums';

const mockUser = {
  fullName: 'Nguyễn Văn A',
  username: 'nguyenvana',
  email: 'nguyenvana@email.com',
  phone: '0901234567',
  status: UserStatus.ACTIVE,
  rank: UserRank.CTV_NANG_CAO,
  referralCode: 'nguyenvana',
  sponsorCode: 'tranthiB',
  totalSales: 63000000,
  thisMonthSales: 15000000,
  commissionWallet: 4750000,
  rewardWallet: 1500000,
};

// Progress milestones
const MILESTONES = [
  { label: 'TĐL 3', target: 48000000, ekip: 5 },
  { label: 'TĐL 2', target: 96000000, ekip: 7 },
  { label: 'TĐL 1', target: 150000000, ekip: 10 },
];

const InfoRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, accent && styles.infoAccent]}>{value}</Text>
  </View>
);

const ProfileScreen = () => {
  const { logout } = useAuth();
  const nextMilestone = MILESTONES.find(m => mockUser.totalSales < m.target) ?? MILESTONES[MILESTONES.length - 1];
  const progress = Math.min(1, mockUser.totalSales / nextMilestone.target);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar / header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{mockUser.fullName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{mockUser.fullName}</Text>
          <Text style={styles.rank}>{UserRankLabel[mockUser.rank]}</Text>
          <UserStatusBadge status={mockUser.status} />
        </View>

        {/* Referral code */}
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>🎯 Mã giới thiệu của bạn</Text>
          <Pressable
            style={styles.referralCodeBox}
            onPress={() => Alert.alert('Sao chép!', `Mã: ${mockUser.referralCode}`)}
          >
            <Text style={styles.referralCode}>{mockUser.referralCode.toUpperCase()}</Text>
            <Text style={styles.copyHint}>Nhấn để sao chép</Text>
          </Pressable>
        </Card>

        {/* Progress to next rank */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Tiến độ lên {nextMilestone.label}</Text>
            <Text style={styles.progressPct}>{Math.floor(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.floor(progress * 100)}%` }]} />
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressDetail}>DS tích lũy: {formatVND(mockUser.totalSales)} / {formatVND(nextMilestone.target)}</Text>
            <Text style={styles.progressDetail}>Ekip cần: {nextMilestone.ekip} user trực hệ</Text>
          </View>
        </Card>

        {/* Account info */}
        <Card>
          <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
          <InfoRow label="Họ tên" value={mockUser.fullName} />
          <InfoRow label="Username" value={'@' + mockUser.username} />
          <InfoRow label="Email" value={mockUser.email} />
          <InfoRow label="Điện thoại" value={mockUser.phone} />
          <InfoRow label="Người bảo trợ" value={mockUser.sponsorCode} accent />
          <Pressable
            style={styles.editBtn}
            onPress={() => Alert.alert('Chỉnh sửa', 'Yêu cầu chỉnh sửa thông tin sẽ được gửi lên Admin để xét duyệt.')}
          >
            <Text style={styles.editBtnText}>Yêu cầu chỉnh sửa thông tin</Text>
          </Pressable>
        </Card>

        {/* Wallet summary */}
        <Card style={styles.walletSummary}>
          <Text style={styles.cardTitle}>Tóm tắt tài chính tháng này</Text>
          <InfoRow label="DS tháng hiện tại" value={formatVND(mockUser.thisMonthSales)} />
          <InfoRow label="Ví Điểm Thưởng" value={formatVND(mockUser.rewardWallet)} />
          <InfoRow label="Ví Hoa Hồng" value={formatVND(mockUser.commissionWallet)} />
        </Card>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={() => Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [{ text: 'Hủy' }, { text: 'Đăng xuất', style: 'destructive', onPress: logout }])}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  profileHeader: { alignItems: 'center', marginBottom: Spacing.xl, paddingVertical: Spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: '900', color: '#fff' },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  rank: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600', marginBottom: Spacing.sm },
  referralCard: { marginBottom: Spacing.md, backgroundColor: Colors.primary },
  referralTitle: { fontSize: FontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.sm },
  referralCodeBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  referralCode: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.accent, letterSpacing: 4 },
  copyHint: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  progressCard: { marginBottom: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md },
  progressPct: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  progressBg: { height: 10, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radius.full },
  progressDetails: { gap: Spacing.xs },
  progressDetail: { fontSize: FontSize.xs, color: Colors.text.secondary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: FontSize.sm, color: Colors.text.secondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary, maxWidth: '60%', textAlign: 'right' },
  infoAccent: { color: Colors.primaryLight },
  editBtn: { marginTop: Spacing.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  walletSummary: { marginTop: Spacing.md },
  logoutBtn: { marginTop: Spacing.xl, padding: Spacing.md, alignItems: 'center' },
  logoutText: { fontSize: FontSize.md, color: Colors.danger, fontWeight: '700' },
});

export default ProfileScreen;
