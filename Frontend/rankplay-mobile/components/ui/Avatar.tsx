/**
 * RankPlay Avatar Component
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSizes } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showLevel?: boolean;
  level?: number;
}

export function Avatar({ uri, name, size = 'md', style, showLevel, level }: AvatarProps) {
  const getSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return FontSizes.sm;
      case 'lg': return FontSizes.xxl;
      case 'xl': return FontSizes.xxxl;
      default: return FontSizes.lg;
    }
  };

  const avatarSize = getSize();
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={[{ position: 'relative' }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: getFontSize() }]}>
            {initials}
          </Text>
        </View>
      )}
      
      {showLevel && level && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.neutral[200],
  },
  placeholder: {
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.accent.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
});

export default Avatar;
