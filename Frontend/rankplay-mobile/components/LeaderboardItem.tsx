/**
 * Leaderboard Item Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';

interface LeaderboardItemProps {
  entry: RankingEntry;
  showMedal?: boolean;
}

export function LeaderboardItem({ entry, showMedal = true }: LeaderboardItemProps) {
  // Validación de seguridad
  if (!entry) {
    return null;
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return Colors.accent.gold;
      case 2: return Colors.accent.silver;
      case 3: return Colors.accent.bronze;
      default: return null;
    }
  };

  const medalColor = showMedal ? getMedalColor(entry.rank) : null;

  return (
    <View style={[
      styles.container,
      entry.is_current_user && styles.currentUser,
    ]}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {medalColor ? (
          <View style={[styles.medal, { backgroundColor: medalColor }]}>
            <Text style={styles.medalText}>{entry.rank}</Text>
          </View>
        ) : (
          <Text style={styles.rankText}>{entry.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <Avatar
        uri={entry.avatar_url}
        name={entry.display_name || entry.username}
        size="md"
        showLevel
        level={entry.level}
      />

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName} numberOfLines={1}>
          {entry.display_name || entry.username}
          {entry.is_current_user && <Text style={styles.youBadge}> (Tú)</Text>}
        </Text>
        <Text style={styles.username}>@{entry.username}</Text>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{entry.score.toLocaleString()}</Text>
        <Text style={styles.scoreLabel}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  currentUser: {
    backgroundColor: Colors.primary[50],
    borderWidth: 2,
    borderColor: Colors.primary[600],
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  medal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  rankText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  displayName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  youBadge: {
    color: Colors.primary[600],
    fontWeight: '700',
  },
  username: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
  },
});

export default LeaderboardItem;
