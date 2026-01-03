/**
 * RankPlay Button Component
 * Professional styled button with red theme
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSizes, Shadows, Spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
      ...Shadows.md,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = Spacing.sm;
        baseStyle.paddingHorizontal = Spacing.md;
        break;
      case 'lg':
        baseStyle.paddingVertical = Spacing.md + 4;
        baseStyle.paddingHorizontal = Spacing.xl;
        break;
      default:
        baseStyle.paddingVertical = Spacing.md;
        baseStyle.paddingHorizontal = Spacing.lg;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = Colors.neutral[700];
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = Colors.primary[600];
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      default:
        baseStyle.backgroundColor = Colors.primary[600];
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size
    switch (size) {
      case 'sm':
        baseTextStyle.fontSize = FontSizes.sm;
        break;
      case 'lg':
        baseTextStyle.fontSize = FontSizes.xl;
        break;
      default:
        baseTextStyle.fontSize = FontSizes.lg;
    }

    // Variant
    switch (variant) {
      case 'outline':
      case 'ghost':
        baseTextStyle.color = Colors.primary[600];
        break;
      default:
        baseTextStyle.color = '#FFFFFF';
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[600] : '#FFFFFF'}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), icon && { marginLeft: Spacing.sm }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
