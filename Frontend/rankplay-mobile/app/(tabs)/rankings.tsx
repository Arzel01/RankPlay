/**
 * RankingsScreen - Tablas de clasificacion global y de amigos
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api, { Game, Score } from '@/services/api';
import LeaderboardItem from '@/components/LeaderboardItem';

type RankingType = 'global' | 'friends';

export default function RankingsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [rankingType, setRankingType] = useState<RankingType>('global');
  const [rankings, setRankings] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadRankings();
    }
  }, [selectedGame, rankingType]);

  const loadGames = async () => {
    try {
      const data = await api.getGames();
      setGames(data);
      if (data.length > 0) {
        setSelectedGame(data[0]);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRankings = async () => {
    if (!selectedGame) return;

    setIsLoadingRankings(true);
    try {
      const data =
        rankingType === 'global'
          ? await api.getGameLeaderboard(selectedGame.id)
          : await api.getFriendsLeaderboard(selectedGame.id);
      
      console.log('[Rankings] Datos recibidos:', data.length, 'jugadores');
      console.log('[Rankings] Primeros 5:', data.slice(0, 5).map(r => ({ username: r.username, score: r.score_value })));
      
      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
      setRankings([]);
    } finally {
      setIsLoadingRankings(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRankings();
    setRefreshing(false);
  }, [selectedGame, rankingType]);

  // Función para obtener el icono según el juego
  const getGameIcon = (gameTitle: string): keyof typeof Ionicons.glyphMap => {
    const title = gameTitle.toLowerCase();
    if (title.includes('memory') || title.includes('memoria')) return 'grid';
    if (title.includes('minas') || title.includes('buscaminas') || title.includes('mine')) return 'flag';
    if (title.includes('tres') || title.includes('tic') || title.includes('tac') || title.includes('gato')) return 'close';
    return 'game-controller-outline';
  };

  const renderGameSelector = ({ item }: { item: Game }) => {
    const isSelected = selectedGame?.id === item.id;
    const iconName = getGameIcon(item.title);
    return (
      <TouchableOpacity
        style={[styles.gameChip, isSelected && styles.gameChipSelected]}
        onPress={() => setSelectedGame(item)}
      >
        <Ionicons 
          name={iconName} 
          size={16} 
          color={isSelected ? '#FFFFFF' : Colors.neutral[600]} 
        />
        <Text style={[styles.gameChipText, isSelected && styles.gameChipTextSelected]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRankingItem = ({ item, index }: { item: Score; index: number }) => {
    const isCurrentUser = user?.id === item.user;
    const entry = {
      rank: index + 1,
      username: item.username,
      display_name: item.display_name || item.username,
      avatar_url: item.avatar_url,
      level: item.level || 1,
      score: item.score_value,
      is_current_user: isCurrentUser,
    };
    return (
      <LeaderboardItem
        entry={entry}
        showMedal={index < 3}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color={Colors.neutral[300]} />
      <Text style={styles.emptyTitle}>Sin puntuaciones</Text>
      <Text style={styles.emptySubtitle}>
        {rankingType === 'friends'
          ? 'Tus amigos aun no han jugado este juego'
          : 'Se el primero en jugar y aparecer en el ranking'}
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={64} color={Colors.neutral[300]} />
          <Text style={styles.authTitle}>Inicia sesion</Text>
          <Text style={styles.authSubtitle}>
            Necesitas una cuenta para ver los rankings
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rankings</Text>
        <Text style={styles.subtitle}>Compite por los primeros lugares</Text>
      </View>

      {/* Selector de juego */}
      <View style={styles.gameSelectorContainer}>
        <FlatList
          data={games}
          renderItem={renderGameSelector}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gamesList}
        />
      </View>

      {/* Tabs Global/Amigos */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, rankingType === 'global' && styles.tabActive]}
          onPress={() => setRankingType('global')}
        >
          <Ionicons
            name="earth"
            size={18}
            color={rankingType === 'global' ? Colors.primary[600] : Colors.neutral[500]}
          />
          <Text style={[styles.tabText, rankingType === 'global' && styles.tabTextActive]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, rankingType === 'friends' && styles.tabActive]}
          onPress={() => setRankingType('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={rankingType === 'friends' ? Colors.primary[600] : Colors.neutral[500]}
          />
          <Text style={[styles.tabText, rankingType === 'friends' && styles.tabTextActive]}>
            Amigos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 destacado */}
      {rankings.length >= 3 && !isLoadingRankings && (
        <View style={styles.topThree}>
          {/* Segundo lugar */}
          <View style={[styles.topItem, styles.topSecond]}>
            <View style={[styles.topAvatar, styles.topAvatarSecond]}>
              <Text style={styles.topAvatarText}>
                {rankings[1].username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.topBadge, { backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.topBadgeText}>2</Text>
            </View>
            <Text style={styles.topName} numberOfLines={1}>
              {rankings[1].username}
            </Text>
            <Text style={styles.topScore}>
              {rankings[1].score_value.toLocaleString()}
            </Text>
          </View>

          {/* Primer lugar */}
          <View style={[styles.topItem, styles.topFirst]}>
            <Ionicons
              name="trophy"
              size={24}
              color={Colors.accent.gold}
              style={styles.crownIcon}
            />
            <View style={[styles.topAvatar, styles.topAvatarFirst]}>
              <Text style={styles.topAvatarText}>
                {rankings[0].username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.topBadge, { backgroundColor: Colors.accent.gold }]}>
              <Text style={styles.topBadgeText}>1</Text>
            </View>
            <Text style={styles.topName} numberOfLines={1}>
              {rankings[0].username}
            </Text>
            <Text style={styles.topScore}>
              {rankings[0].score_value.toLocaleString()}
            </Text>
          </View>

          {/* Tercer lugar */}
          <View style={[styles.topItem, styles.topThird]}>
            <View style={[styles.topAvatar, styles.topAvatarThird]}>
              <Text style={styles.topAvatarText}>
                {rankings[2].username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.topBadge, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.topBadgeText}>3</Text>
            </View>
            <Text style={styles.topName} numberOfLines={1}>
              {rankings[2].username}
            </Text>
            <Text style={styles.topScore}>
              {rankings[2].score_value.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de rankings */}
      {isLoadingRankings ? (
        <View style={styles.loadingRankings}>
          <ActivityIndicator size="small" color={Colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rankings.slice(3)}
          renderItem={({ item, index }) => renderRankingItem({ item, index: index + 3 })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.rankingsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={rankings.length === 0 ? renderEmptyState : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[600]}
            />
          }
        />
      )}
    </SafeAreaView>
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

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    color: Colors.neutral[900],
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },

  // Game Selector
  gameSelectorContainer: {
    marginBottom: Spacing.sm,
  },
  gamesList: {
    paddingHorizontal: Spacing.lg,
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    marginRight: Spacing.sm,
  },
  gameChipSelected: {
    backgroundColor: Colors.primary[600],
  },
  gameChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.neutral[600],
  },
  gameChipTextSelected: {
    color: '#FFFFFF',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.neutral[500],
  },
  tabTextActive: {
    color: Colors.primary[600],
  },

  // Top 3 - Podio destacado
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  topItem: {
    alignItems: 'center',
    flex: 1,
  },
  topFirst: {
    marginTop: -Spacing.lg,
  },
  topSecond: {},
  topThird: {},
  topAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -Spacing.sm,
  },
  topAvatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary[100],
    borderWidth: 3,
    borderColor: Colors.accent.gold,
  },
  topAvatarSecond: {
    backgroundColor: Colors.neutral[200],
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  topAvatarThird: {
    backgroundColor: Colors.neutral[200],
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  topAvatarText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  crownIcon: {
    marginBottom: -Spacing.xs,
  },
  topBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  topBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.neutral[900],
    maxWidth: 80,
  },
  topScore: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
  },

  // Rankings List
  loadingRankings: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  rankingsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
    paddingHorizontal: Spacing.xl,
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
