/**
 * HomeScreen - Pantalla principal de RankPlay
 * Muestra juegos destacados, estadisticas del usuario y accesos rapidos
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api, { Game, Score } from '@/services/api';
import GameCard from '@/components/GameCard';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const games = await api.getFeaturedGames();
      setFeaturedGames(games);

      if (isAuthenticated) {
        const scores = await api.getMyBestScores();
        setRecentScores(scores.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Redirigir a login si no esta autenticado
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="trophy" size={80} color={Colors.primary[600]} />
          </View>
          <Text style={styles.welcomeTitle}>RankPlay</Text>
          <Text style={styles.welcomeSubtitle}>
            Centro de minijuegos con rankings y sistema de amigos
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesion</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Crear Cuenta</Text>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[600]}
          />
        }
      >
        {/* Header con perfil */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.username}>
              {user?.profile?.display_name || user?.username}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar
              uri={user?.profile?.avatar_url}
              name={user?.profile?.display_name || user?.username}
              size="lg"
              showLevel
              level={user?.profile?.current_level}
            />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de estadisticas */}
        <Card style={styles.statsCard} variant="elevated">
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.profile?.current_level || 1}</Text>
              <Text style={styles.statLabel}>Nivel</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(user?.profile?.total_xp || 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>XP Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.profile?.games_played || 0}</Text>
              <Text style={styles.statLabel}>Partidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.friends_count || 0}</Text>
              <Text style={styles.statLabel}>Amigos</Text>
            </View>
          </View>
          {/* Barra de progreso XP */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressHeader}>
              <Text style={styles.xpProgressLabel}>Progreso al siguiente nivel</Text>
              <Text style={styles.xpProgressValue}>
                {user?.profile?.xp_for_next_level || 0} XP restantes
              </Text>
            </View>
            <View style={styles.xpProgressBar}>
              <View
                style={[
                  styles.xpProgressFill,
                  {
                    width: `${Math.min(
                      100,
                      ((1000 - (user?.profile?.xp_for_next_level || 0)) / 1000) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Acciones rapidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/games')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary[100] }]}>
              <Ionicons name="game-controller" size={24} color={Colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Jugar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/rankings')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent.gold + '20' }]}>
              <Ionicons name="trophy" size={24} color={Colors.accent.gold} />
            </View>
            <Text style={styles.quickActionText}>Rankings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/friends')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent.info + '20' }]}>
              <Ionicons name="people" size={24} color={Colors.accent.info} />
            </View>
            <Text style={styles.quickActionText}>Amigos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/achievements')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.rarity.epic + '20' }]}>
              <Ionicons name="ribbon" size={24} color={Colors.rarity.epic} />
            </View>
            <Text style={styles.quickActionText}>Logros</Text>
          </TouchableOpacity>
        </View>

        {/* Juegos destacados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Juegos Destacados</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/games')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {featuredGames.length > 0 && (
            <GameCard
              game={featuredGames[0]}
              variant="featured"
              onPress={() => router.push(`/game/${featuredGames[0].id}`)}
            />
          )}
        </View>

        {/* Mejores puntajes */}
        {recentScores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Mejores Puntajes</Text>
            </View>
            {recentScores.map((score) => (
              <TouchableOpacity
                key={score.id}
                style={styles.scoreItem}
                onPress={() => router.push(`/game/${score.game}`)}
              >
                <View style={styles.scoreIcon}>
                  <Ionicons name="game-controller" size={20} color={Colors.primary[600]} />
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreGameTitle}>{score.game_title}</Text>
                  <Text style={styles.scoreDate}>
                    {new Date(score.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.scoreValue}>
                  <Text style={styles.scoreNumber}>
                    {score.score_value.toLocaleString()}
                  </Text>
                  <Text style={styles.scoreLabel}>pts</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mas juegos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mas Juegos</Text>
          </View>
          <View style={styles.gamesGrid}>
            {featuredGames.slice(1, 5).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                variant="compact"
                onPress={() => router.push(`/game/${game.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome (no auth)
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    color: Colors.primary[600],
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: Spacing.md,
  },
  registerButtonText: {
    color: Colors.primary[600],
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
  },
  username: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },

  // Stats Card
  statsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary[600],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  xpProgressContainer: {
    marginTop: Spacing.sm,
  },
  xpProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  xpProgressLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  xpProgressValue: {
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.gold,
    borderRadius: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[700],
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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

  // Scores
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  scoreIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreGameTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  scoreDate: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
  },

  // Games Grid
  gamesGrid: {
    gap: Spacing.sm,
  },
});
