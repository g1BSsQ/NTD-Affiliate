import React, { useState } from 'react';
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
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { UserStatusBadge } from '../../components/Badge';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { UserStatus, UserRank, UserRankLabel } from '../../constants/enums';
import type { NetworkNode } from '../../types';

// --- Mock binary tree data ---
const mockTree: NetworkNode = {
  id: 'u1',
  username: 'nguyenvana',
  fullName: 'Nguyễn Văn A (Bạn)',
  rank: UserRank.CTV_NANG_CAO,
  status: UserStatus.ACTIVE,
  totalSales: 63000000,
  left: {
    id: 'u2',
    username: 'tranthibinh',
    fullName: 'Trần Thị Bình',
    rank: UserRank.CTV_CO_BAN,
    status: UserStatus.ACTIVE,
    totalSales: 6000000,
    left: {
      id: 'u4',
      username: 'levancuong',
      fullName: 'Lê Văn Cường',
      rank: UserRank.CTV_TIEU_DUNG,
      status: UserStatus.PENDING_APPROVAL,
      totalSales: 3000000,
    },
  },
  right: {
    id: 'u3',
    username: 'phamvanduong',
    fullName: 'Phạm Văn Dương',
    rank: UserRank.CTV_CHUYEN_NGHIEP,
    status: UserStatus.ACTIVE,
    totalSales: 24000000,
  },
};

interface NodeCardProps {
  node: NetworkNode;
  isRoot?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, isRoot }) => (
  <View style={[styles.nodeCard, isRoot && styles.nodeCardRoot]}>
    <Text style={styles.nodeName} numberOfLines={1}>{node.fullName}</Text>
    <Text style={styles.nodeUsername}>@{node.username}</Text>
    <Text style={styles.nodeRank}>{UserRankLabel[node.rank]}</Text>
    <Text style={styles.nodeSales}>{formatVND(node.totalSales)}</Text>
    <UserStatusBadge status={node.status} />
  </View>
);

const EmptySlot = ({ label }: { label: string }) => (
  <View style={styles.emptySlot}>
    <Text style={styles.emptyText}>+ {label}</Text>
    <Text style={styles.emptyHint}>Vị trí trống</Text>
  </View>
);

const NetworkScreen = () => {
  const leftSales = mockTree.left?.totalSales ?? 0;
  const rightSales = mockTree.right?.totalSales ?? 0;
  const weakBranch = leftSales <= rightSales ? 'left' : 'right';

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

        {/* Binary Tree Visual */}
        <Text style={styles.treeTitle}>Sơ đồ cây</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.treeContainer}>
            {/* Root */}
            <View style={styles.treeLevel}>
              <NodeCard node={mockTree} isRoot />
            </View>

            {/* Connector */}
            <View style={styles.branchConnectors}>
              <View style={styles.connectorLine} />
              <View style={styles.connectorLine} />
            </View>

            {/* Level 1 */}
            <View style={styles.treeLevel}>
              {mockTree.left ? <NodeCard node={mockTree.left} /> : <EmptySlot label="Nhánh trái" />}
              {mockTree.right ? <NodeCard node={mockTree.right} /> : <EmptySlot label="Nhánh phải" />}
            </View>

            {/* Level 2 */}
            <View style={styles.treeLevel}>
              {mockTree.left?.left ? <NodeCard node={mockTree.left.left} /> : <EmptySlot label="Trái-Trái" />}
              {mockTree.left?.right ? <NodeCard node={mockTree.left.right} /> : <EmptySlot label="Trái-Phải" />}
              {mockTree.right?.left ? <NodeCard node={mockTree.right.left} /> : <EmptySlot label="Phải-Trái" />}
              {mockTree.right?.right ? <NodeCard node={mockTree.right.right} /> : <EmptySlot label="Phải-Phải" />}
            </View>
          </View>
        </ScrollView>

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
  treeContainer: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  treeLevel: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  branchConnectors: { flexDirection: 'row', justifyContent: 'center', gap: 80 },
  connectorLine: { width: 1, height: 20, backgroundColor: Colors.border },
  nodeCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  nodeCardRoot: { borderColor: Colors.primary, borderWidth: 2 },
  nodeName: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.primary },
  nodeUsername: { fontSize: 10, color: Colors.text.tertiary },
  nodeRank: { fontSize: 10, color: Colors.primaryLight, fontWeight: '600' },
  nodeSales: { fontSize: 10, color: Colors.text.secondary },
  emptySlot: { width: 140, height: 100, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  emptyText: { fontSize: FontSize.xs, color: Colors.text.tertiary, fontWeight: '600' },
  emptyHint: { fontSize: 10, color: Colors.text.tertiary },
  rearrangeBtn: { marginTop: Spacing.xl },
});

export default NetworkScreen;
