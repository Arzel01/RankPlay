/**
 * UserProfileScreen - Perfil publico de otro usuario
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api, { Score } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

interface UserProfile {
  id: string;
  username: string;
  profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    current_level: number;
    total_xp: number;
    games_played: number;
  };
  friends_count: number;
  is_friend: boolean;
  friendship_status?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    if (!id) return;

    try {
      const userData = await api.getUserProfile(id);
      setUser(userData);

      const scores = await api.getUserScores(id);
      setRecentScores(scores.slice(0, 5));
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!user || !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setIsSendingRequest(true);
    try {
      if (user.friendship_status === 'none') {
        await api.sendFriendRequest(user.id);
        Alert.alert('Solicitud enviada', 'La solicitud de amistad ha sido enviada');
        loadUserData();
      } else if (user.friendship_status === 'pending_received') {
        await api.acceptFriendRequest(user.id);
        Alert.alert('Solicitud aceptada', 'Ahora son amigos');
        loadUserData();
      } else if (user.friendship_status === 'friends') {
        Alert.alert(
          'Eliminar amigo',
          `Deseas eliminar a ${user.profile.display_name || user.username} de tus amigos?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: async () => {
                await api.removeFriend(user.id);
                loadUserData();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la accion');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const getFriendButtonConfig = () => {
    if (!user) return { text: 'Agregar', icon: 'person-add', style: 'primary' };

    switch (user.friendship_status) {
      case 'friends':
        return { text: 'Amigos', icon: 'checkmark-circle', style: 'success' };
      case 'pending_sent':
        return { text: 'Pendiente', icon: 'time', style: 'disabled' };
      case 'pending_received':
        return { text: 'Aceptar', icon: 'person-add', style: 'primary' };
      default:
        return { text: 'Agregar', icon: 'person-add', style: 'primary' };
    }
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person" size={64} color={Colors.neutral[300]} />
          <Text style={styles.errorText}>Usuario no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const friendButton = getFriendButtonConfig();
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: user.profile.display_name || user.username,
          headerBackTitle: 'Atras',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={styles.profileSection}>
          <View style={styles.headerBackground} />
          <View style={styles.profileContent}>
            <Avatar
              uri={user.profile.avatar_url}
              name={user.profile.display_name || user.username}
              size="xl"
              showLevel
              level={user.profile.current_level}
            />
            <Text style={styles.displayName}>
              {user.profile.display_name || user.username}
            </Text>
            <Text style={styles.username}>@{user.username}</Text>

            {user.profile.bio && (
              <Text style={styles.bio}>{user.profile.bio}</Text>
            )}

            {!isOwnProfile && isAuthenticated && (
              <TouchableOpacity
                style={[
                  styles.friendButton,
                  friendButton.style === 'success' && styles.friendButtonSuccess,
                  friendButton.style === 'disabled' && styles.friendButtonDisabled,
                ]}
                onPress={handleFriendAction}
                disabled={isSendingRequest || friendButton.style === 'disabled'}
              >
                {isSendingRequest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={friendButton.icon as any}
                      size={18}
                      color={friendButton.style === 'disabled' ? Colors.neutral[500] : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.friendButtonText,
                        friendButton.style === 'disabled' && styles.friendButtonTextDisabled,
                      ]}
                    >
                      {friendButton.text}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Estadisticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.profile.current_level}</Text>
            <Text style={styles.statLabel}>Nivel</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user.profile.total_xp.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.profile.games_played}</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.friends_count}</Text>
            <Text style={styles.statLabel}>Amigos</Text>
          </View>
        </View>

        {/* Mejores puntajes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mejores puntajes</Text>
          {recentScores.length > 0 ? (
            recentScores.map((score) => (
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
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="game-controller-outline" size={48} color={Colors.neutral[300]} />
              <Text style={styles.emptyText}>Sin puntajes registrados</Text>
            </Card>
          )}
        </View>
      </ScrollView>
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

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: Colors.primary[600],
  },
  profileContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: Spacing.lg,
  },
  displayName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginTop: Spacing.md,
  },
  username: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  bio: {
    fontSize: FontSizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  friendButtonSuccess: {
    backgroundColor: Colors.accent.success,
  },
  friendButtonDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  friendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  friendButtonTextDisabled: {
    color: Colors.neutral[500],
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.xs,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
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

  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.sm,
  },
});
