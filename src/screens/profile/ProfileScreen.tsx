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
  Clipboard,
  Linking,
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
import { MILESTONES } from '../../constants/milestones'; // Added import
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

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
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Yêu cầu Xóa / Khóa Tài khoản',
      'Theo quy định về kế toán và phòng chống gian lận, lịch sử giao dịch và vị trí mạng lưới của bạn sẽ tiếp tục được lưu trữ an toàn để đối soát. Tuy nhiên, toàn bộ Thông tin cá nhân (Tên, SĐT, CCCD) sẽ bị ẩn danh hoàn toàn và quyền truy cập ứng dụng sẽ bị thu hồi vĩnh viễn.\n\nBạn có chắc chắn muốn gửi Yêu cầu xóa?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          style: 'destructive', 
          onPress: () => {
            // Gửi email yêu cầu tới Admin
            Linking.openURL(`mailto:support@ntdaffiliate.com?subject=Yêu cầu đóng tài khoản: ${profile.id}&body=Chào Admin, tôi muốn yêu cầu đóng tài khoản và ẩn danh hóa dữ liệu cá nhân của tôi. User ID: ${profile.id}`);
            handleLogout();
          }
        }
      ]
    );
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
        {/* User name and rank header */}
        <View style={styles.profileHeader}>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.rank}>{UserRankLabel[rankKey] ?? rankKey}</Text>
          <UserStatusBadge status={profile.status as any} />
        </View>

        {/* Referral code */}
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>🎯 Mã giới thiệu của bạn</Text>
          <Pressable
            style={styles.referralCodeBox}
            onPress={() => {
              Clipboard.setString(profile.sponsor_code || '');
              Alert.alert('Đã chép!', `Mã ${profile.sponsor_code} đã được lưu vào bộ nhớ tạm.`);
            }}
          >
            <Text style={styles.referralCode}>{profile.sponsor_code || 'CHƯA CẬP NHẬT'}</Text>
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
          <InfoRow label="Trạng thái" value={profile.status} />
          
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => setIsPolicyModalVisible(true)}
            >
              <Text style={styles.actionBtnText}>Hướng dẫn & Chính sách</Text>
            </Pressable>
            
            <Pressable
              style={styles.actionBtn}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text style={styles.actionBtnText}>Yêu cầu chỉnh sửa</Text>
            </Pressable>
          </View>
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

        {/* Policy Modal */}
        <Modal
          visible={isPolicyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPolicyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hướng dẫn & Chính sách</Text>
                <Pressable onPress={() => setIsPolicyModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.policyScroll}>
                <Text style={styles.policyHeading}>1. Chính sách tham gia</Text>
                <Text style={styles.policyText}>- Người tham gia phải đủ 18 tuổi và có đầy đủ năng lực hành vi dân sự.{'\n'}- Tài khoản sẽ được kích hoạt (ACTIVE) sau khi thanh toán đơn hàng gói sản phẩm đầu tiên và tải lên CCCD để xác minh phân phối.</Text>
                
                <Text style={styles.policyHeading}>2. Cấu trúc hoa hồng</Text>
                <Text style={styles.policyText}>- Hoa hồng trực tiếp: Nhận ngay khi F1 hoàn thành đơn hàng.{'\n'}- Hoa hồng cân nhánh (Nhị phân): 9% trên doanh số nhánh yếu, thanh toán khi đạt điều kiện cân cặp.{'\n'}- Hoa hồng đồng chia: Dành cho TĐL và các cấp cao hơn dựa vào tổng doanh số toàn hệ thống.</Text>

                <Text style={styles.policyHeading}>3. Chính sách Rút tiền</Text>
                <Text style={styles.policyText}>- Hạn mức rút tối thiểu là 100,000 VNĐ.{'\n'}- Lệnh rút tiền sẽ được bộ phận Kế toán duyệt vào ngày 15 và 30 hàng tháng.{'\n'}- Vui lòng cung cấp chính xác thông tin Tài khoản Ngân hàng. Công ty không chịu trách nhiệm nếu bank sai số tài khoản.</Text>

                <Text style={styles.policyHeading}>4. Quyền riêng tư & Lưu trữ Dữ liệu</Text>
                <Text style={styles.policyText}>- Chúng tôi cam kết không chia sẻ dữ liệu cá nhân của hội viên cho bên thứ 3 phục vụ mục đích quảng cáo.{'\n'}- Mọi lịch sử giao dịch và sơ đồ mạng lưới được lưu trữ trên Server bảo mật chuẩn quốc tế phục vụ đối soát.</Text>

                <View style={{ height: Spacing.xxxl }} />
              </ScrollView>
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

        {/* Danger Area */}
        <View style={styles.dangerZone}>
          <Pressable style={styles.logoutBtn} onPress={() => Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [{ text: 'Hủy' }, { text: 'Đăng xuất', style: 'destructive', onPress: handleLogout }])}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
          
          <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Yêu cầu đóng / xóa tài khoản</Text>
          </Pressable>
        </View>
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
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.xs },
  rank: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700', marginBottom: Spacing.sm },
  referralCard: { marginBottom: Spacing.md, backgroundColor: Colors.primary },
  referralTitle: { fontSize: FontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.sm },
  referralCodeBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  referralCode: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
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
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  actionBtn: { flex: 1, padding: Spacing.sm, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md },
  actionBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  walletSummary: { marginTop: Spacing.md },
  dangerZone: { marginTop: Spacing.xl, gap: Spacing.md },
  logoutBtn: { padding: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  logoutText: { fontSize: FontSize.md, color: Colors.text.primary, fontWeight: '700' },
  deleteBtn: { padding: Spacing.md, alignItems: 'center' },
  deleteText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  closeBtn: { fontSize: 20, color: Colors.text.tertiary, padding: 4 },
  inputLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.secondary, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text.primary, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  modalTip: { backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xl },
  modalTipText: { fontSize: 12, color: Colors.primary, lineHeight: 18, fontWeight: '500' },
  policyScroll: { flex: 1 },
  policyHeading: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  policyText: { fontSize: FontSize.sm, color: Colors.text.secondary, lineHeight: 22 },
});

export default ProfileScreen;
