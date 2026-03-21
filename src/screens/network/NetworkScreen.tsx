import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { UserStatusBadge } from '../../components/Badge';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserRankLabel } from '../../constants/enums';
import { useAppStore } from '../../store/useAppStore';

const NetworkScreen = () => {
  const { profile, networkNode, loading, fetchProfile, fetchNetworkNode } = useAppStore();

  useEffect(() => {
    fetchProfile();
    fetchNetworkNode();
  }, [fetchProfile, fetchNetworkNode]);

  if (loading || !networkNode || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải mạng lưới...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const leftSales = networkNode.left_sales;
  const rightSales = networkNode.right_sales;
  const weakBranch = leftSales <= rightSales ? 'left' : 'right';
  const rankKey = (networkNode.rank ?? 'CTV') as keyof typeof UserRankLabel;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mạng lưới</Text>
          <Text style={styles.subtitle}>Cây hệ thống Nhị phân của bạn</Text>
        </View>

        {/* Binary stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Doanh số nhánh</Text>
          <View style={styles.branchRow}>
            <View style={styles.branchItem}>
              <View style={[styles.branchDot, weakBranch === 'left' && styles.weakDot]} />
              <Text style={styles.branchLabel}>Nhánh Trái</Text>
              <CurrencyText amount={leftSales} size="sm" color={weakBranch === 'left' ? Colors.warning : Colors.success} />
              {weakBranch === 'left' && <Text style={styles.weakTag}>Nhánh yếu</Text>}
            </View>
            <View style={styles.branchDivider} />
            <View style={styles.branchItem}>
              <View style={[styles.branchDot, weakBranch === 'right' && styles.weakDot]} />
              <Text style={styles.branchLabel}>Nhánh Phải</Text>
              <CurrencyText amount={rightSales} size="sm" color={weakBranch === 'right' ? Colors.warning : Colors.success} />
              {weakBranch === 'right' && <Text style={styles.weakTag}>Nhánh yếu</Text>}
            </View>
          </View>
          <View style={styles.bonusRow}>
            <Text style={styles.bonusLabel}>💰 Hoa hồng Nhị phân (9% nhánh yếu):</Text>
            <CurrencyText amount={Math.floor(Math.min(leftSales, rightSales) * 0.09)} size="sm" color={Colors.accent} />
          </View>
        </Card>

        {/* User's node card */}
        <Text style={styles.treeTitle}>Thông tin node của bạn</Text>
        <Card style={styles.myNodeCard}>
          <View style={styles.myNodeRow}>
            <View style={styles.myNodeAvatar}>
              <Text style={styles.myNodeAvatarText}>{(profile.full_name ?? 'U').charAt(0)}</Text>
            </View>
            <View style={styles.myNodeInfo}>
              <Text style={styles.myNodeName}>{profile.full_name}</Text>
              <Text style={styles.myNodeRank}>{UserRankLabel[rankKey] ?? rankKey}</Text>
              <Text style={styles.myNodeSales}>DS tích lũy: {formatVND(networkNode.total_sales)}</Text>
            </View>
            <UserStatusBadge status={profile.status as any} />
          </View>
        </Card>

        {/* Rearrange request button */}
        <Button
          title="Gửi yêu cầu sắp xếp lại cơ cấu"
          variant="outline"
          fullWidth
          style={styles.rearrangeBtn}
          onPress={() => Alert.alert('Yêu cầu đã gửi', 'Admin sẽ xem xét và phản hồi yêu cầu của bạn.')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs },
  statsCard: { marginBottom: Spacing.xl },
  statsTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md },
  branchRow: { flexDirection: 'row', marginBottom: Spacing.md },
  branchItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  branchDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success },
  weakDot: { backgroundColor: Colors.warning },
  branchLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.secondary },
  weakTag: { fontSize: 10, color: Colors.warning, fontWeight: '700', backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.xs, paddingVertical: 1, borderRadius: Radius.full },
  branchDivider: { width: 1, backgroundColor: Colors.border },
  bonusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  bonusLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, flex: 1, marginRight: Spacing.sm },
  treeTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md },
  myNodeCard: { marginBottom: Spacing.md },
  myNodeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  myNodeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  myNodeAvatarText: { fontSize: FontSize.lg, fontWeight: '900', color: '#fff' },
  myNodeInfo: { flex: 1 },
  myNodeName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary },
  myNodeRank: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: '600' },
  myNodeSales: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2 },
  rearrangeBtn: { marginTop: Spacing.xl },
});

export default NetworkScreen;
