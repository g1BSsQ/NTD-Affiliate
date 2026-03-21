import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontFamily } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.text.inverse },
  },
  secondary: {
    container: { backgroundColor: Colors.primaryLight },
    text: { color: Colors.text.inverse },
  },
  accent: {
    container: { backgroundColor: Colors.accent },
    text: { color: Colors.text.primary },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
    text: { color: Colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.primary },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.text.inverse },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.sm, minHeight: 36 },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, minHeight: 48 },
    text: { fontSize: FontSize.md },
  },
  lg: {
    container: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.md, minHeight: 56 },
    text: { fontSize: FontSize.lg },
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  style,
  textStyle,
  disabled,
  ...rest
}) => {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  const noShadow = variant === 'outline' || variant === 'ghost';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        !noShadow && styles.shadow,
        ss.container,
        vs.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.text.color as string} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, ss.text, vs.text, textStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  shadow: {
    ...Shadow.sm,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  text: {
    fontWeight: FontFamily.mediumWeight,
    letterSpacing: 0.3,
  },
});
