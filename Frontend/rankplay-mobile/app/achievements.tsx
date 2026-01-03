/**
 * AchievementsScreen - Lista de logros del usuario
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import Card from '@/components/ui/Card';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achievement_type: string;
  threshold: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  can_claim?: boolean;
}

type FilterType = 'all' | 'unlocked' | 'locked';

export default function AchievementsScreen() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAchievements();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAchievements = async () => {
    try {
      console.log('[Achievements] Cargando logros del usuario...');
      const data = await api.getAllAchievementsWithProgress();
      console.log('[Achievements] Logros recibidos:', data.length);
      
      // Manejar respuesta paginada
      let achievementsArray: Achievement[] = [];
      if (Array.isArray(data)) {
        achievementsArray = data as any;
      } else if (data && typeof data === 'object' && 'results' in data) {
        achievementsArray = (data as any).results;
      }
      
      setAchievements(achievementsArray);
    } catch (error) {
      console.error('[Achievements] Error cargando logros:', error);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, []);

  const claimReward = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      const result = await api.claimAchievement(achievementId);
      Alert.alert(
        'Recompensa reclamada',
        `Has obtenido ${result.xp_earned} XP`,
        [{ text: 'OK' }]
      );
      loadAchievements();
      refreshUser();
    } catch (error) {
      console.error('Error claiming achievement:', error);
      Alert.alert('Error', 'No se pudo reclamar la recompensa');
    } finally {
      setClaimingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ title: 'Logros' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.authRequired}>
            <Ionicons name="trophy" size={64} color={Colors.neutral[300]} />
            <Text style={styles.authTitle}>Inicia sesión</Text>
            <Text style={styles.authSubtitle}>
              Necesitas una cuenta para ver tus logros
            </Text>
            <TouchableOpacity
              style={styles.authButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.authButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const getRarityColor = (rarity: string): string => {
    return Colors.rarity[rarity as keyof typeof Colors.rarity] || Colors.rarity.common;
  };

  const getRarityLabel = (rarity: string): string => {
    const labels: Record<string, string> = {
      common: 'Comun',
      rare: 'Raro',
      epic: 'Epico',
      legendary: 'Legendario',
    };
    return labels[rarity] || rarity;
  };

  const getFilteredAchievements = () => {
    switch (filter) {
      case 'unlocked':
        return achievements.filter((a) => a.is_unlocked);
      case 'locked':
        return achievements.filter((a) => !a.is_unlocked);
      default:
        return achievements;
    }
  };

  const getStats = () => {
    const unlocked = achievements.filter((a) => a.is_unlocked).length;
    const total = achievements.length;
    const totalXP = achievements
      .filter((a) => a.is_unlocked)
      .reduce((sum, a) => sum + a.xp_reward, 0);
    return { unlocked, total, totalXP };
  };

  const renderAchievementItem = ({ item }: { item: Achievement }) => {
    const rarityColor = getRarityColor(item.rarity);
    const progressPercent = item.progress
      ? Math.min(100, (item.progress / item.threshold) * 100)
      : 0;

    return (
      <Card
        style={[
          styles.achievementCard,
          !item.is_unlocked && styles.achievementCardLocked,
        ]}
      >
        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.achievementIcon,
              { backgroundColor: rarityColor + '20' },
              !item.is_unlocked && styles.achievementIconLocked,
            ]}
          >
            <Ionicons
              name={item.is_unlocked ? 'ribbon' : 'lock-closed'}
              size={28}
              color={item.is_unlocked ? rarityColor : Colors.neutral[400]}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text
              style={[
                styles.achievementTitle,
                !item.is_unlocked && styles.textLocked,
              ]}
            >
              {item.title}
            </Text>
            <View style={styles.rarityBadge}>
              <View
                style={[styles.rarityDot, { backgroundColor: rarityColor }]}
              />
              <Text style={styles.rarityText}>{getRarityLabel(item.rarity)}</Text>
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={14} color={Colors.accent.gold} />
            <Text style={styles.xpText}>{item.xp_reward}</Text>
          </View>
        </View>

        <Text
          style={[styles.achievementDescription, !item.is_unlocked && styles.textLocked]}
        >
          {item.description}
        </Text>

        {/* Barra de progreso para logros no desbloqueados */}
        {!item.is_unlocked && item.progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress} / {item.threshold}
            </Text>
          </View>
        )}

        {/* Boton de reclamar */}
        {item.is_unlocked && item.can_claim && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => claimReward(item.id)}
            disabled={claimingId === item.id}
          >
            {claimingId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="gift" size={18} color="#FFFFFF" />
                <Text style={styles.claimButtonText}>Reclamar</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Fecha de desbloqueo */}
        {item.is_unlocked && item.unlocked_at && !item.can_claim && (
          <View style={styles.unlockedInfo}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent.success} />
            <Text style={styles.unlockedText}>
              Desbloqueado el {new Date(item.unlocked_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="ribbon" size={64} color={Colors.neutral[300]} />
          <Text style={styles.authTitle}>Inicia sesion</Text>
          <Text style={styles.authSubtitle}>
            Necesitas una cuenta para ver tus logros
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Iniciar Sesion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = getStats();
  const filteredAchievements = getFilteredAchievements();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Logros',
          headerBackTitle: 'Atras',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Resumen */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryValue}>
                {stats.unlocked}/{stats.total}
              </Text>
              <Text style={styles.summaryLabel}>Logros desbloqueados</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summarySecondary}>
              <Ionicons name="star" size={20} color={Colors.accent.gold} />
              <Text style={styles.summaryXP}>{stats.totalXP.toLocaleString()}</Text>
              <Text style={styles.summaryXPLabel}>XP ganado</Text>
            </View>
          </View>

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            {(['all', 'unlocked', 'locked'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f === 'all' ? 'Todos' : f === 'unlocked' ? 'Desbloqueados' : 'Bloqueados'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de logros */}
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievementItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[600]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={64} color={Colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Sin logros</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'unlocked'
                  ? 'Aun no has desbloqueado ningun logro'
                  : filter === 'locked'
                  ? 'Has desbloqueado todos los logros'
                  : 'No hay logros disponibles'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  summaryMain: {
    flex: 1,
  },
  summaryValue: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.md,
  },
  summarySecondary: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryXP: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryXPLabel: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[600],
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.neutral[600],
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Achievement Card
  achievementCard: {
    marginBottom: Spacing.md,
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  achievementIconLocked: {
    backgroundColor: Colors.neutral[100],
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  textLocked: {
    color: Colors.neutral[500],
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  rarityText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.gold + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  xpText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.accent.gold,
  },
  achievementDescription: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
    lineHeight: 20,
  },

  // Progress
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
    textAlign: 'right',
  },

  // Claim Button
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.gold,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Unlocked Info
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  unlockedText: {
    fontSize: FontSizes.sm,
    color: Colors.accent.success,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Auth Required
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginTop: Spacing.md,
  },
  authSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
