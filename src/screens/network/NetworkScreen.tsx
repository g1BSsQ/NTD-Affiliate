import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  PanGestureHandler, 
  PinchGestureHandler, 
  State, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CurrencyText, formatVND } from '../../components/CurrencyText';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { useAppStore, BinaryTreeNode, UnplacedMember, PlacementRequest } from '../../store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NetworkScreen = () => {
  const { 
    profile, 
    networkNode, 
    subordinates, 
    binaryTree,
    unplacedMembers,
    placementRequests,
    loading, 
    fetchProfile, 
    fetchNetworkNode, 
    fetchSubordinates, 
    fetchBinaryTree,
    fetchUnplacedMembers,
    fetchPlacementRequests,
    cancelPlacementRequest,
    submitPlacementRequest,
    fetchAll 
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ parentId: string, position: 'LEFT' | 'RIGHT' } | null>(null);
  const [memberToPlace, setMemberToPlace] = useState<UnplacedMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewRootId, setViewRootId] = useState<string | null>(null);
  const [isGesturing, setIsGesturing] = useState(false);

  // --- Zoom & Pan Logic (Enhanced) ---
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastOffset = useRef({ x: 0, y: 0 });

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: scale } }], { useNativeDriver: true });
  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) setIsGesturing(true);
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      if (lastScale.current < 0.5) lastScale.current = 0.5;
      if (lastScale.current > 2) lastScale.current = 2;
      scale.setValue(lastScale.current);
      setIsGesturing(false);
    } else if (event.nativeEvent.state === State.FAILED || event.nativeEvent.state === State.CANCELLED) {
      setIsGesturing(false);
    }
  };

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) setIsGesturing(true);
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastOffset.current.x += event.nativeEvent.translationX;
      lastOffset.current.y += event.nativeEvent.translationY;
      translateX.setOffset(lastOffset.current.x);
      translateX.setValue(0);
      translateY.setOffset(lastOffset.current.y);
      translateY.setValue(0);
      setIsGesturing(false);
    } else if (event.nativeEvent.state === State.FAILED || event.nativeEvent.state === State.CANCELLED) {
      setIsGesturing(false);
    }
  };

  const resetZoom = () => {
    lastScale.current = 1;
    lastOffset.current = { x: 0, y: 0 };
    setIsGesturing(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    translateX.setOffset(0);
    translateY.setOffset(0);
  };

  // --- Data Fetching ---
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (profile && !viewRootId) setViewRootId(profile.id);
  }, [profile]);

  // Tree Helper: Merge binaryTree and pending placementRequests
  const treeMap = useMemo(() => {
    const map: Record<string, { LEFT?: any, RIGHT?: any }> = {};
    
    // 1. Official nodes
    binaryTree.forEach(node => {
      if (node.parent_id) {
        if (!map[node.parent_id]) map[node.parent_id] = {};
        map[node.parent_id][node.node_position as 'LEFT' | 'RIGHT'] = { ...node, isDraft: false };
      }
    });

    // 2. Draft (Planning & Pending) nodes
    placementRequests.filter(r => r.status === 'PLANNING' || r.status === 'PENDING').forEach(req => {
      if (!map[req.parent_id]) map[req.parent_id] = {};
      
      const member = unplacedMembers.find(m => m.user_id === req.member_id);
      
      map[req.parent_id][req.position] = {
        id: req.id,
        user_id: req.member_id,
        full_name: member?.full_name || 'Hội viên mới',
        node_position: req.position,
        isDraft: true,
        parent_id: req.parent_id,
        status: req.status
      };
    });

    return map;
  }, [binaryTree, placementRequests, unplacedMembers]);

  const planningCount = useMemo(() => 
    placementRequests.filter(r => r.status === 'PLANNING').length
  , [placementRequests]);

  if (loading && !refreshing && (!networkNode || !profile)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải mạng lưới...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!networkNode || !profile || !viewRootId) return null;

  const handlePlaceMember = async () => {
    if (!selectedSlot || !memberToPlace) return;
    setSubmitting(true);
    try {
      await submitPlacementRequest(memberToPlace.user_id, selectedSlot.parentId, selectedSlot.position);
      Alert.alert('Giao dịch Xem trước', 'Hội viên đã được thêm vào sơ đồ ảo. Vị trí sẽ chính thức sau khi Admin duyệt.');
      setSelectedSlot(null);
      setMemberToPlace(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể gửi yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderNode = (node: any, parentId: string, pos: 'LEFT' | 'RIGHT', depth: number) => {
    if (depth > 4) return null; // Increased depth for better preview

    if (!node) {
      return (
        <TouchableOpacity 
          style={[styles.nodeContainer, styles.emptyNode]} 
          onPress={() => setSelectedSlot({ parentId, position: pos })}
        >
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>+</Text>
          </View>
          <Text style={styles.emptyNodeText}>Trống</Text>
        </TouchableOpacity>
      );
    }

    const children = treeMap[node.user_id] || {};
    const isRoot = node.user_id === viewRootId;

    return (
      <View style={styles.treeBranch}>
        <View style={styles.nodeWrapper}>
          <TouchableOpacity 
            style={[
              styles.nodeContainer, 
              isRoot && styles.rootNode,
              node.isDraft && styles.draftNode
            ]}
            onPress={() => setViewRootId(node.user_id)}
          >
            {node.isDraft && (
              <View style={[styles.draftBadge, node.status === 'PENDING' && styles.pendingBadge]}>
                <Text style={styles.draftBadgeText}>
                  {node.status === 'PLANNING' ? 'Bản nháp' : 'Chờ duyệt'}
                </Text>
              </View>
            )}
            <Text style={styles.nodeName} numberOfLines={1}>{node.full_name}</Text>
            
            {!node.isDraft && (
              <Text style={styles.nodeSales}>{formatVND(node.total_sales || 0)}</Text>
            )}

            <Text style={styles.nodePos}>{pos === 'LEFT' ? 'Trái' : 'Phải'}</Text>

            {node.isDraft && (
              <TouchableOpacity 
                style={styles.cancelDraftBtn} 
                onPress={() => cancelPlacementRequest(node.id)}
              >
                <Text style={styles.cancelDraftText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          
          <View style={styles.connectorLine} />
        </View>

        <View style={styles.childrenRow}>
          <View style={styles.childColumn}>
             {renderNode(children.LEFT || null, node.user_id, 'LEFT', depth + 1)}
          </View>
          <View style={styles.childColumn}>
             {renderNode(children.RIGHT || null, node.user_id, 'RIGHT', depth + 1)}
          </View>
        </View>
      </View>
    );
  };

  const rootNodeItem = binaryTree.find(n => n.user_id === viewRootId) || (viewRootId === profile.id ? { user_id: profile.id, full_name: profile.full_name, isDraft: false } : null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          scrollEnabled={!isGesturing}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Cơ cấu nhân sự</Text>
            <Text style={styles.subtitle}>Thiết kế sơ đồ nhị phân (Hỗ trợ Xem trước)</Text>
          </View>

          {/* Unplaced members banner */}
          {unplacedMembers.length > 0 && (
            <Card style={styles.unplacedCard}>
              <View style={styles.unplacedHeader}>
                <View style={styles.warningIndicator} />
                <Text style={styles.unplacedTitle}>{unplacedMembers.length} Hội viên mới chờ sắp xếp</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unplacedScroll}>
                {unplacedMembers.map(m => (
                  <TouchableOpacity 
                    key={m.user_id} 
                    style={[styles.memberTab, memberToPlace?.user_id === m.user_id && styles.selectedMemberTab]}
                    onPress={() => setMemberToPlace(m)}
                  >
                    <Text style={[styles.memberName, memberToPlace?.user_id === m.user_id && styles.selectedMemberName]}>{m.full_name}</Text>
                    <Text style={styles.memberDate}>{new Date(m.created_at).toLocaleDateString('vi-VN')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.unplacedHint}>* Chọn hội viên, sau đó chọn "Vị trí ảo" trên sơ đồ để xem trước.</Text>
            </Card>
          )}

          {/* Diagram Section */}
          <View style={styles.diagramContainer}>
            <View style={styles.diagramHeader}>
              <Text style={styles.treeTitle}>Sơ đồ Cây ảo (Zoom & Pan)</Text>
              <TouchableOpacity onPress={resetZoom} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Đặt lại Zoom</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.canvasFrame}>
              <PanGestureHandler
                ref={panRef}
                simultaneousHandlers={[pinchRef]}
                onGestureEvent={onPanEvent}
                onHandlerStateChange={onPanStateChange}
              >
                <Animated.View style={{ flex: 1 }}>
                  <PinchGestureHandler
                    ref={pinchRef}
                    simultaneousHandlers={[panRef]}
                    onGestureEvent={onPinchEvent}
                    onHandlerStateChange={onPinchStateChange}
                  >
                    <Animated.View 
                      style={[
                        styles.canvas,
                        {
                          transform: [
                            { scale: scale },
                            { translateX: translateX },
                            { translateY: translateY },
                          ]
                        }
                      ]}
                    >
                      <View style={styles.treeRootWrapper}>
                         {renderNode(rootNodeItem, '', 'LEFT', 0)}
                      </View>
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </PanGestureHandler>
            </View>
            
            {viewRootId !== profile.id && (
              <Button 
                title="Về Gốc của tôi" 
                onPress={() => setViewRootId(profile.id)} 
                variant="outline"
                size="sm"
                style={styles.backRootBtn}
              />
            )}
          </View>

          {/* F1 List removed as requested, all info now in tree */}
        </ScrollView>

        {/* Global Submit Button for Drafts */}
        {planningCount > 0 && (
          <View style={styles.floatingSubmitContainer}>
            <Button 
              title={`Gửi phê duyệt (${planningCount} phiếu)`}
              onPress={() => {
                Alert.alert(
                  'Gửi phê duyệt',
                  `Bạn có chắc chắn muốn gửi ${planningCount} yêu cầu sắp xếp này cho Admin phê duyệt không?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xác nhận gửi', onPress: () => useAppStore.getState().submitAllPlacements() }
                  ]
                );
              }}
              loading={submitting}
            />
          </View>
        )}

        {/* Placement Confirmation Modal */}
        <Modal visible={!!selectedSlot} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xếp vị trí (Dự thảo)</Text>
              
              {!memberToPlace ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalText}>Vui lòng chọn một hội viên mới từ danh sách phía trên trước khi chọn vị trí.</Text>
                  <Button title="Đóng" onPress={() => setSelectedSlot(null)} variant="outline" />
                </View>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>Bạn muốn xếp hội viên:</Text>
                  <Text style={styles.confirmMember}>{memberToPlace.full_name}</Text>
                  <Text style={styles.confirmText}>Vào vị trí này trên sơ đồ ảo?</Text>
                  
                  <View style={styles.modalButtons}>
                    <Button 
                      title="Hủy" 
                      onPress={() => setSelectedSlot(null)} 
                      variant="outline" 
                      style={styles.modalBtn}
                    />
                    <Button 
                      title={submitting ? "Đang gửi..." : "Xác nhận"} 
                      onPress={handlePlaceMember} 
                      loading={submitting}
                      style={styles.modalBtn}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  
  unplacedCard: { backgroundColor: '#FFF9E6', borderColor: '#FFE58F', borderWidth: 1, marginBottom: Spacing.xl },
  unplacedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  warningIndicator: { width: 4, height: 16, backgroundColor: Colors.warning, borderRadius: 2 },
  unplacedTitle: { fontSize: FontSize.sm, fontWeight: '700', color: '#856404' },
  unplacedScroll: { marginBottom: Spacing.sm },
  memberTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: '#fff', borderRadius: Radius.md, marginRight: Spacing.sm, borderWidth: 1, borderColor: '#eee' },
  selectedMemberTab: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '20' },
  memberName: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.primary },
  selectedMemberName: { color: Colors.primary },
  memberDate: { fontSize: 10, color: Colors.text.tertiary, marginTop: 2 },
  unplacedHint: { fontSize: 10, color: Colors.text.secondary, fontStyle: 'italic' },

  diagramContainer: { marginBottom: Spacing.xxxl },
  diagramHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  resetBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  resetBtnText: { fontSize: 10, fontWeight: '700', color: Colors.text.secondary },
  canvasFrame: { height: 400, backgroundColor: '#fcfcfc', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  canvas: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  treeRootWrapper: { padding: 100 }, // Large padding to allow panning to children

  treeTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  
  treeBranch: { alignItems: 'center' },
  nodeWrapper: { alignItems: 'center' },
  nodeContainer: { width: 100, padding: 6, backgroundColor: '#fff', borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  rootNode: { borderColor: Colors.primary, borderWidth: 2 },
  draftNode: { borderStyle: 'dashed', opacity: 0.8, borderColor: Colors.warning },
  
  draftBadge: { position: 'absolute', top: -10, backgroundColor: Colors.text.tertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  pendingBadge: { backgroundColor: Colors.warning },
  draftBadgeText: { fontSize: 7, fontWeight: '800', color: '#fff' },

  nodeName: { fontSize: 8, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  nodeSales: { fontSize: 7, fontWeight: '600', color: Colors.primary, marginTop: 1 },
  nodePos: { fontSize: 6, color: Colors.text.tertiary, marginTop: 1 },
  
  cancelDraftBtn: { marginTop: 4, width: '100%', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 2 },
  cancelDraftText: { fontSize: 8, color: Colors.danger, fontWeight: '800', textAlign: 'center' },
  
  emptyNode: { borderStyle: 'dashed', backgroundColor: 'transparent', borderColor: Colors.border, paddingVertical: Spacing.md },
  emptyIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyIconText: { color: '#fff', fontWeight: '900', fontSize: FontSize.sm },
  emptyNodeText: { fontSize: 8, color: Colors.text.tertiary },

  connectorLine: { width: 1.5, height: 12, backgroundColor: Colors.border },
  childrenRow: { flexDirection: 'row', gap: 20 },
  childColumn: { alignItems: 'center' },

  backRootBtn: { marginTop: Spacing.md, alignSelf: 'center' },

  subListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  subCount: { fontSize: FontSize.xs, color: Colors.text.tertiary, fontWeight: '600' },
  subCard: { marginBottom: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  posBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posLeft: { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
  posRight: { backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  posText: { fontSize: 9, fontWeight: '900', color: Colors.text.secondary },
  subInfo: { flex: 1 },
  subName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary },
  subSales: { fontSize: 9, color: Colors.text.secondary, marginTop: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md, textAlign: 'center' },
  modalEmpty: { alignItems: 'center', gap: Spacing.md },
  modalText: { fontSize: FontSize.sm, color: Colors.text.secondary, textAlign: 'center' },
  confirmBox: { alignItems: 'center' },
  confirmText: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: Spacing.md },
  confirmMember: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl, width: '100%' },
  modalBtn: { flex: 1 },
  floatingSubmitContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  }
});

export default NetworkScreen;
