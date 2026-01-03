/**
 * RankPlay Card Component
 * Versatile card container with shadow
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.light.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
    };

    switch (variant) {
      case 'elevated':
        return { ...baseStyle, ...Shadows.lg };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: Colors.light.border,
        };
      default:
        return { ...baseStyle, ...Shadows.md };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
}

export default Card;
