/**
 * ProfileScreen - Perfil del usuario, logros y configuracion
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, showBadge, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? Colors.accent.error : Colors.neutral[600]}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {showBadge && <View style={styles.menuBadge} />}
      <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshUser, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const handleLogout = async () => {
    const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (confirmar) {
      try {
        await logout();
        router.replace('/auth/login');
      } catch (error) {
        console.error('[Profile] Logout error:', error);
        alert('Error: No se pudo cerrar sesión');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="person" size={64} color={Colors.neutral[300]} />
          <Text style={styles.authTitle}>Inicia sesion</Text>
          <Text style={styles.authSubtitle}>
            Necesitas una cuenta para ver tu perfil
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Iniciar Sesion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const xpProgress = user?.profile?.xp_for_next_level
    ? ((1000 - user.profile.xp_for_next_level) / 1000) * 100
    : 0;

  return (
    <View style={styles.container}>
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
        {/* Header del perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.headerBackground} />
          <View style={styles.profileInfo}>
            <Avatar
              uri={user?.profile?.avatar_url}
              name={user?.profile?.display_name || user?.username}
              size="xl"
              showLevel
              level={user?.profile?.current_level}
            />
            <Text style={styles.displayName}>
              {user?.profile?.display_name || user?.username}
            </Text>
            <Text style={styles.username}>@{user?.username}</Text>
            
            {/* Barra de nivel */}
            <View style={styles.levelContainer}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelText}>
                  Nivel {user?.profile?.current_level || 1}
                </Text>
                <Text style={styles.xpText}>
                  {user?.profile?.xp_for_next_level || 0} XP para el siguiente
                </Text>
              </View>
              <View style={styles.levelBar}>
                <View style={[styles.levelProgress, { width: `${xpProgress}%` }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary[600]} />
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadisticas */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="game-controller"
            value={user?.profile?.games_played || 0}
            label="Partidas"
            color={Colors.primary[600]}
          />
          <StatCard
            icon="star"
            value={(user?.profile?.total_xp || 0).toLocaleString()}
            label="XP Total"
            color={Colors.accent.gold}
          />
          <StatCard
            icon="people"
            value={user?.friends_count || 0}
            label="Amigos"
            color={Colors.accent.info}
          />
        </View>

        {/* Seccion de Logros */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Logros</Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.achievementsPreview}>
            <View style={styles.achievementRow}>
              <View style={[styles.achievementBadge, { backgroundColor: Colors.rarity.common + '20' }]}>
                <Ionicons name="ribbon" size={24} color={Colors.rarity.common} />
              </View>
              <View style={[styles.achievementBadge, { backgroundColor: Colors.rarity.rare + '20' }]}>
                <Ionicons name="ribbon" size={24} color={Colors.rarity.rare} />
              </View>
              <View style={[styles.achievementBadge, { backgroundColor: Colors.rarity.epic + '20' }]}>
                <Ionicons name="ribbon" size={24} color={Colors.rarity.epic} />
              </View>
              <View style={[styles.achievementBadge, styles.achievementMore]}>
                <Text style={styles.achievementMoreText}>+12</Text>
              </View>
            </View>
            <Text style={styles.achievementSubtext}>
              Has desbloqueado 15 de 50 logros
            </Text>
          </Card>
        </View>

        {/* Menu de opciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuracion</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Editar perfil"
              onPress={() => router.push('/profile/edit')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications-outline"
              label="Notificaciones"
              onPress={() => router.push('/settings/notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Privacidad"
              onPress={() => router.push('/settings/privacy')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle-outline"
              label="Ayuda y soporte"
              onPress={() => router.push('/settings/help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="information-circle-outline"
              label="Acerca de"
              onPress={() => router.push('/settings/about')}
            />
          </Card>
        </View>

        {/* Cerrar sesion */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>RankPlay v1.0.0</Text>
      </ScrollView>
    </View>
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

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: Colors.primary[600],
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: 60,
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
  levelContainer: {
    width: '80%',
    marginTop: Spacing.md,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  levelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  xpText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  levelBar: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgress: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    gap: Spacing.xs,
  },
  editButtonText: {
    color: Colors.primary[600],
    fontWeight: '500',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
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
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  seeAllText: {
    fontSize: FontSizes.md,
    color: Colors.primary[600],
    fontWeight: '500',
  },

  // Achievements
  achievementsPreview: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  achievementRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementMore: {
    backgroundColor: Colors.neutral[100],
  },
  achievementMoreText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  achievementSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },

  // Menu
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuIconDanger: {
    backgroundColor: Colors.accent.error + '15',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
  },
  menuLabelDanger: {
    color: Colors.accent.error,
  },
  menuBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[600],
    marginRight: Spacing.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginLeft: 64,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.error,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  logoutIcon: {
    marginRight: Spacing.sm,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
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

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    marginTop: Spacing.lg,
  },
});
