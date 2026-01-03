/**
 * FriendsScreen - Lista de amigos, solicitudes y busqueda de usuarios
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

type TabType = 'friends' | 'requests' | 'search';

interface Friend {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  current_level?: number;
  is_online?: boolean;
}

interface FriendRequest {
  id: string;
  from_user: string;
  from_username: string;
  from_avatar_url?: string;
  created_at: string;
}

export default function FriendsScreen() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
      loadPendingRequests();
    }
  }, [isAuthenticated]);

  const loadFriends = async () => {
    try {
      const data = await api.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await api.getPendingRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api.searchUsers(query);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      searchUsers(text);
    } else {
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      Alert.alert('Solicitud enviada', 'La solicitud de amistad ha sido enviada');
      searchUsers(searchQuery);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      loadPendingRequests();
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  const removeFriend = async (friendId: string) => {
    Alert.alert(
      'Eliminar amigo',
      'Esta accion no se puede deshacer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeFriend(friendId);
              loadFriends();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar al amigo');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setRefreshing(false);
  }, []);

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Avatar
        uri={item.avatar_url}
        name={item.display_name || item.username}
        size="md"
        showLevel
        level={item.current_level}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name || item.username}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => removeFriend(item.id)}
      >
        <Ionicons name="person-remove-outline" size={20} color={Colors.neutral[500]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          uri={item.from_avatar_url}
          name={item.from_username}
          size="md"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.from_username}</Text>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => acceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => rejectRequest(item.id)}
        >
          <Ionicons name="close" size={20} color={Colors.neutral[600]} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderSearchItem = ({ item }: { item: Friend }) => (
    <View style={styles.userItem}>
      <Avatar
        uri={item.avatar_url}
        name={item.display_name || item.username}
        size="md"
        showLevel
        level={item.current_level}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name || item.username}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton]}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Ionicons name="person-add" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="people" size={64} color={Colors.neutral[300]} />
          <Text style={styles.authTitle}>Inicia sesion</Text>
          <Text style={styles.authSubtitle}>
            Necesitas una cuenta para ver tus amigos
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Amigos</Text>
        <Text style={styles.subtitle}>
          {friends.length} amigo{friends.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'friends' ? Colors.primary[600] : Colors.neutral[500]}
          />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Amigos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Ionicons
            name="mail"
            size={18}
            color={activeTab === 'requests' ? Colors.primary[600] : Colors.neutral[500]}
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Solicitudes
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons
            name="search"
            size={18}
            color={activeTab === 'search' ? Colors.primary[600] : Colors.neutral[500]}
          />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido segun tab activo */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
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
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={Colors.neutral[300]} />
                <Text style={styles.emptyTitle}>Sin amigos aun</Text>
                <Text style={styles.emptySubtitle}>
                  Busca usuarios para agregar amigos
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('search')}
                >
                  <Text style={styles.emptyButtonText}>Buscar usuarios</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color={Colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Sin solicitudes</Text>
              <Text style={styles.emptySubtitle}>
                No tienes solicitudes de amistad pendientes
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre de usuario..."
              placeholderTextColor={Colors.neutral[400]}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={20} color={Colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>

          {isSearching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="small" color={Colors.primary[600]} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                searchQuery.length >= 2 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={64} color={Colors.neutral[300]} />
                    <Text style={styles.emptyTitle}>Sin resultados</Text>
                    <Text style={styles.emptySubtitle}>
                      No se encontraron usuarios con ese nombre
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="person-add-outline" size={64} color={Colors.neutral[300]} />
                    <Text style={styles.emptyTitle}>Buscar usuarios</Text>
                    <Text style={styles.emptySubtitle}>
                      Escribe al menos 2 caracteres para buscar
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.neutral[500],
  },
  tabTextActive: {
    color: Colors.primary[600],
  },
  badge: {
    backgroundColor: Colors.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  userUsername: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  actionButton: {
    padding: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary[600],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  // Requests
  requestCard: {
    marginBottom: Spacing.sm,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  requestName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  requestDate: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: Colors.neutral[100],
  },

  // Search
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  searchLoading: {
    padding: Spacing.xl,
    alignItems: 'center',
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
  emptyButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
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
});
