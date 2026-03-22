import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { UserStatusBadge } from '../../components/Badge';
import { useAuth } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserRankLabel } from '../../constants/enums';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

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
  const { profile, wallets, networkNode, orders, loading, fetchAll } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [editData, setEditData] = useState({ fullName: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (profile) {
      setEditData({ 
        fullName: profile.full_name || '', 
        phone: profile.phone || '' 
      });
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSales = networkNode?.total_sales ?? 0;
  const rankKey = (networkNode?.rank ?? 'CTV') as keyof typeof UserRankLabel;
  const rewardWallet = wallets.find(w => w.type === 'REWARD')?.balance ?? 0;
  const commissionWallet = wallets.find(w => w.type === 'COMMISSION')?.balance ?? 0;
  const thisMonthSales = orders
    .filter(o => o.status === 'COMPLETED' && new Date(o.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, o) => sum + o.total_price, 0);

  const nextMilestone = MILESTONES.find(m => totalSales < m.target) ?? MILESTONES[MILESTONES.length - 1];
  const progress = Math.min(1, totalSales / nextMilestone.target);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  const handleSubmitEdit = () => {
    if (!editData.fullName.trim() || !editData.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call to request change
    setTimeout(() => {
      setIsSubmitting(false);
      setIsEditModalVisible(false);
      Alert.alert('Thành công', 'Yêu cầu thay đổi thông tin của bạn đã được gửi tới Admin. Vui lòng chờ phê duyệt.');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        {/* Avatar / header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile.full_name ?? 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.rank}>{UserRankLabel[rankKey] ?? rankKey}</Text>
          <UserStatusBadge status={profile.status as any} />
        </View>

        {/* Referral code */}
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>🎯 Mã giới thiệu của bạn</Text>
          <Pressable
            style={styles.referralCodeBox}
            onPress={() => Alert.alert('Sao chép!', `Mã: ${profile.full_name}`)}
          >
            <Text style={styles.referralCode}>{(profile.full_name ?? '').toUpperCase()}</Text>
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
            <Text style={styles.progressDetail}>DS tích lũy: {formatVND(totalSales)} / {formatVND(nextMilestone.target)}</Text>
            <Text style={styles.progressDetail}>Ekip cần: {nextMilestone.ekip} user trực hệ</Text>
          </View>
        </Card>

        {/* Account info */}
        <Card>
          <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
          <InfoRow label="Họ tên" value={profile.full_name ?? '—'} />
          <InfoRow label="Điện thoại" value={profile.phone ?? '—'} />
          <InfoRow label="Người bảo trợ" value={profile.sponsor_code ?? '—'} accent />
          <InfoRow label="Trạng thái" value={profile.status} />
          <Pressable
            style={styles.editBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Text style={styles.editBtnText}>Yêu cầu chỉnh sửa thông tin</Text>
          </Pressable>
        </Card>

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                <Pressable onPress={() => setIsEditModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={editData.fullName}
                onChangeText={(text) => setEditData({ ...editData, fullName: text })}
                placeholder="Nhập họ tên mới"
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={editData.phone}
                onChangeText={(text) => setEditData({ ...editData, phone: text })}
                placeholder="Nhập số điện thoại mới"
                keyboardType="phone-pad"
              />

              <View style={styles.modalTip}>
                <Text style={styles.modalTipText}>💡 Lưu ý: Thông tin mới sẽ chỉ có hiệu lực sau khi Admin phê duyệt.</Text>
              </View>

              <Button
                title="Gửi yêu cầu phê duyệt"
                onPress={handleSubmitEdit}
                loading={isSubmitting}
                variant="primary"
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </View>
        </Modal>

        {/* Wallet summary */}
        <Card style={styles.walletSummary}>
          <Text style={styles.cardTitle}>Tóm tắt tài chính tháng này</Text>
          <InfoRow label="DS tháng hiện tại" value={formatVND(thisMonthSales)} />
          <InfoRow label="Ví Điểm Thưởng" value={formatVND(rewardWallet)} />
          <InfoRow label="Ví Hoa Hồng" value={formatVND(commissionWallet)} />
        </Card>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={() => Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [{ text: 'Hủy' }, { text: 'Đăng xuất', style: 'destructive', onPress: handleLogout }])}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.text.secondary },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  closeBtn: { fontSize: 20, color: Colors.text.tertiary, padding: 4 },
  inputLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.secondary, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text.primary, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  modalTip: { backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xl },
  modalTipText: { fontSize: 12, color: Colors.primary, lineHeight: 18, fontWeight: '500' },
});

export default ProfileScreen;
