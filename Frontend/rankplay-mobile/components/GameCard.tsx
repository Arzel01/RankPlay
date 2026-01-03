/**
 * Game Card Component for RankPlay
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { Game } from '@/services/api';

interface GameCardProps {
  game: Game;
  onPress: () => void;
  variant?: 'default' | 'featured' | 'compact';
}

// Función para obtener el icono según el nombre del juego
function getGameIcon(title: string): { name: keyof typeof Ionicons.glyphMap; color: string; bgColor: string } {
  const t = title.toLowerCase();
  if (t.includes('memory') || t.includes('memoria')) {
    return { name: 'grid', color: '#8B5CF6', bgColor: '#EDE9FE' };
  }
  if (t.includes('minas') || t.includes('buscaminas') || t.includes('mine')) {
    return { name: 'flag', color: '#EF4444', bgColor: '#FEE2E2' };
  }
  if (t.includes('tres') || t.includes('tic') || t.includes('tac') || t.includes('gato') || t.includes('raya')) {
    return { name: 'close-circle', color: '#3B82F6', bgColor: '#DBEAFE' };
  }
  return { name: 'game-controller-outline', color: Colors.primary[600], bgColor: Colors.primary[50] };
}

export function GameCard({ game, onPress, variant = 'default' }: GameCardProps) {
  const gameIconInfo = getGameIcon(game.title);

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.featuredImageContainer}>
          {/* Fondo con gradiente rojizo */}
          <View style={styles.featuredBackground}>
            <View style={styles.featuredIconLarge}>
              <Ionicons name={gameIconInfo.name} size={80} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={Colors.accent.gold} />
              <Text style={styles.featuredBadgeText}>DESTACADO</Text>
            </View>
            <Text style={styles.featuredTitle}>{game.title}</Text>
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {game.description}
            </Text>
            <View style={styles.featuredStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{game.total_players}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={14} color={Colors.accent.gold} />
                <Text style={styles.statText}>{game.best_score?.toLocaleString() || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.compactIcon, { backgroundColor: gameIconInfo.bgColor }]}>
          {game.icon_url ? (
            <Image source={{ uri: game.icon_url }} style={styles.compactIconImage} />
          ) : (
            <Ionicons name={gameIconInfo.name} size={24} color={gameIconInfo.color} />
          )}
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.compactCategory}>{getCategoryLabel(game.category)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconContainer, { backgroundColor: gameIconInfo.bgColor }]}>
        {game.icon_url ? (
          <Image source={{ uri: game.icon_url }} style={styles.icon} />
        ) : (
          <Ionicons name={gameIconInfo.name} size={32} color={gameIconInfo.color} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{getCategoryLabel(game.category)}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="play-circle" size={14} color={Colors.neutral[500]} />
            <Text style={styles.statTextDark}>{game.play_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={14} color={Colors.accent.gold} />
            <Text style={styles.statTextDark}>+{game.xp_per_play} XP</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    arcade: 'Arcade',
    puzzle: 'Puzzle',
    action: 'Acción',
    strategy: 'Estrategia',
    casual: 'Casual',
    sports: 'Deportes',
  };
  return labels[category] || category;
}

const styles = StyleSheet.create({
  // Default Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.neutral[900],
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statTextDark: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
    fontWeight: '500',
  },

  // Featured Card
  featuredCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  featuredImageContainer: {
    height: 200,
    position: 'relative',
  },
  featuredBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#B91C1C',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: Spacing.xl,
  },
  featuredIconLarge: {
    opacity: 0.5,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  featuredBadgeText: {
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  featuredTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  featuredDescription: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  compactIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  compactIconImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  compactCategory: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
});

export default GameCard;
