import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';
import { UserStatus, OrderStatus } from '../constants/enums';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger: { bg: Colors.dangerLight, text: Colors.danger },
  info: { bg: '#D6EAF8', text: Colors.info },
  primary: { bg: '#D6E4F7', text: Colors.primary },
  neutral: { bg: Colors.surfaceElevated, text: Colors.text.secondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const v = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
};

// Convenience: status badge for UserStatus
export const UserStatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const map: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
    [UserStatus.NEW]: { label: 'Mới', variant: 'neutral' },
    [UserStatus.PENDING_PLACEMENT]: { label: 'Chờ xếp cây', variant: 'warning' },
    [UserStatus.PENDING_APPROVAL]: { label: 'Chờ duyệt', variant: 'info' },
    [UserStatus.ACTIVE]: { label: 'Đã kích hoạt', variant: 'success' },
    [UserStatus.BLOCKED]: { label: 'Bị khóa', variant: 'danger' },
  };
  const cfg = map[status];
  return <Badge label={cfg.label} variant={cfg.variant} />;
};

// Convenience: status badge for OrderStatus
export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const map: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
    [OrderStatus.WAITING_PAYMENT]: { label: 'Chờ thanh toán', variant: 'warning' },
    [OrderStatus.PENDING_ADMIN]: { label: 'Chờ xác nhận', variant: 'info' },
    [OrderStatus.COMPLETED]: { label: 'Hoàn thành', variant: 'success' },
    [OrderStatus.REJECTED]: { label: 'Từ chối', variant: 'danger' },
  };
  const cfg = map[status];
  return <Badge label={cfg.label} variant={cfg.variant} />;
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
