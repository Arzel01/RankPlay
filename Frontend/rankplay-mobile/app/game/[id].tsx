/**
 * GameDetailScreen - Detalle de juego con leaderboard y opcion de jugar
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api, { Game, Score } from '@/services/api';
import Card from '@/components/ui/Card';
import LeaderboardItem from '@/components/LeaderboardItem';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [myBestScore, setMyBestScore] = useState<Score | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    if (!id) return;

    try {
      const [gameData, leaderboardData] = await Promise.all([
        api.getGame(id),
        api.getGameLeaderboard(id),
      ]);

      setGame(gameData);
      setLeaderboard(leaderboardData);

      if (isAuthenticated) {
        const myScores = await api.getMyBestScores();
        const bestForGame = myScores.find((s) => s.game === id);
        setMyBestScore(bestForGame || null);
      }
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // Juegos implementados internamente - pasar el ID del juego para guardar puntuaciones
    const gameRoutes: Record<string, string> = {
      'tic-tac-toe': '/games/tic-tac-toe',
      'tres-en-raya': '/games/tic-tac-toe',
      'minesweeper': '/games/minesweeper',
      'buscaminas': '/games/minesweeper',
      'memory': '/games/memory',
      'memoria': '/games/memory',
    };

    const route = gameRoutes[game?.slug?.toLowerCase() || ''];
    if (route) {
      // Pasar el ID del juego como parámetro para que se guarden las puntuaciones
      router.push({ pathname: route as any, params: { id: game?.id } });
      return;
    }
    
    // Para otros juegos, navegar a pantalla genérica
    router.push(`/play/${id}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.neutral[300]} />
          <Text style={styles.errorText}>Juego no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      arcade: 'game-controller',
      puzzle: 'grid',
      strategy: 'bulb',
      action: 'flash',
      casual: 'happy',
    };
    return icons[category] || 'game-controller';
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header con imagen */}
        <View style={styles.header}>
          <ImageBackground
            source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/400x200' }}
            style={styles.headerImage}
            imageStyle={styles.headerImageStyle}
          >
            <View style={styles.headerOverlay} />
            <View style={styles.headerContent}>
              <View style={styles.categoryBadge}>
                <Ionicons
                  name={getCategoryIcon(game.category)}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.categoryText}>{game.category}</Text>
              </View>
              <Text style={styles.gameTitle}>{game.title}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {/* Estadisticas del juego */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="people" size={20} color={Colors.primary[600]} />
              <Text style={styles.statValue}>{game.play_count}</Text>
              <Text style={styles.statLabel}>Jugadores</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="trophy" size={20} color={Colors.accent.gold} />
              <Text style={styles.statValue}>
                {leaderboard[0]?.score_value?.toLocaleString() || '-'}
              </Text>
              <Text style={styles.statLabel}>Record</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="star" size={20} color={Colors.rarity.epic} />
              <Text style={styles.statValue}>{myBestScore?.score_value || '-'}</Text>
              <Text style={styles.statLabel}>Mi mejor</Text>
            </View>
          </View>

          {/* Descripcion */}
          <Card style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Descripcion</Text>
            <Text style={styles.descriptionText}>{game.description}</Text>
            {game.instructions && (
              <>
                <Text style={styles.instructionsTitle}>Como jugar</Text>
                <Text style={styles.descriptionText}>{game.instructions}</Text>
              </>
            )}
          </Card>

          {/* Mi posicion */}
          {myBestScore && (
            <Card style={styles.myRankCard}>
              <View style={styles.myRankHeader}>
                <Ionicons name="medal" size={24} color={Colors.primary[600]} />
                <Text style={styles.myRankTitle}>Mi posicion</Text>
              </View>
              <View style={styles.myRankContent}>
                <View style={styles.myRankPosition}>
                  <Text style={styles.myRankNumber}>#{myBestScore.rank || '?'}</Text>
                </View>
                <View style={styles.myRankInfo}>
                  <Text style={styles.myRankScore}>
                    {myBestScore.score_value.toLocaleString()} pts
                  </Text>
                  <Text style={styles.myRankDate}>
                    {new Date(myBestScore.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Leaderboard */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Clasificacion</Text>
              <TouchableOpacity
                onPress={() => router.push(`/leaderboard/${id}`)}
              >
                <Text style={styles.seeAllText}>Ver todo</Text>
              </TouchableOpacity>
            </View>
            {leaderboard.slice(0, 10).map((score, index) => (
              <LeaderboardItem
                key={score.id}
                rank={index + 1}
                username={score.username}
                score={score.score_value}
                avatarUrl={score.avatar_url}
              />
            ))}
            {leaderboard.length === 0 && (
              <View style={styles.emptyLeaderboard}>
                <Ionicons name="trophy-outline" size={48} color={Colors.neutral[300]} />
                <Text style={styles.emptyText}>Se el primero en jugar</Text>
              </View>
            )}
          </View>
        </View>

        {/* Espacio para el boton flotante */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Boton de jugar */}
      <View style={styles.playButtonContainer}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Jugar ahora</Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.neutral[600],
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 280,
  },
  headerImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerImageStyle: {
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    padding: Spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  gameTitle: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Content
  content: {
    padding: Spacing.lg,
    marginTop: -Spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.xs,
  },

  // Description
  descriptionCard: {
    marginTop: Spacing.md,
  },
  descriptionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
    lineHeight: 22,
  },
  instructionsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  // My Rank
  myRankCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
  },
  myRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  myRankTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary[700],
  },
  myRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myRankPosition: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  myRankNumber: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myRankInfo: {
    flex: 1,
  },
  myRankScore: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  myRankDate: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },

  // Leaderboard
  leaderboardSection: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  seeAllText: {
    fontSize: FontSizes.md,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.sm,
  },

  // Bottom
  bottomSpacer: {
    height: 100,
  },
  playButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
