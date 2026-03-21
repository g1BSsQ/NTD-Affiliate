import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';

interface CurrencyTextProps extends TextProps {
  amount: number;
  style?: TextStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  showSign?: boolean; // + or -
  dimSuffix?: boolean;
}

/**
 * Formats a VNĐ amount using Math.floor (per business rules).
 * e.g. 3240000 → "3.240.000 đ"
 */
export const formatVND = (amount: number): string => {
  const floored = Math.floor(amount);
  return floored.toLocaleString('vi-VN') + ' đ';
};

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  style,
  size = 'md',
  color,
  showSign = false,
  dimSuffix = false,
  ...rest
}) => {
  const sizeMap = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.xl, xl: FontSize.xxxl };
  const textColor = color ?? (amount >= 0 ? Colors.text.primary : Colors.danger);
  const sign = showSign && amount > 0 ? '+' : '';
  const formatted = formatVND(Math.abs(amount));

  return (
    <Text style={[{ fontSize: sizeMap[size], color: textColor, fontWeight: '700' }, style]} {...rest}>
      {sign}
      {formatted}
    </Text>
  );
};

const styles = StyleSheet.create({});
