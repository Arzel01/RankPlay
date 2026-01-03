/**
 * GamesScreen - Catalogo de juegos con busqueda y filtros por categoria
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import api, { Game } from '@/services/api';
import GameCard from '@/components/GameCard';

const CATEGORIES = [
  { key: 'all', label: 'Todos', icon: 'apps' },
  { key: 'arcade', label: 'Arcade', icon: 'game-controller' },
  { key: 'puzzle', label: 'Puzzle', icon: 'grid' },
  { key: 'strategy', label: 'Estrategia', icon: 'bulb' },
  { key: 'action', label: 'Accion', icon: 'flash' },
  { key: 'casual', label: 'Casual', icon: 'happy' },
];

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedCategory]);

  const loadGames = async () => {
    try {
      const data = await api.getGames();
      console.log('=== DATOS RECIBIDOS ===');
      console.log('Tipo:', typeof data);
      console.log('Es array:', Array.isArray(data));
      console.log('Data:', data);
      
      // Manejar respuesta paginada o array directo
      let gamesArray: Game[] = [];
      if (Array.isArray(data)) {
        gamesArray = data;
      } else if (data && typeof data === 'object' && 'results' in data) {
        // Respuesta paginada de DRF
        gamesArray = (data as any).results;
      }
      
      console.log('Juegos procesados:', gamesArray.length);
      setGames(gamesArray);
    } catch (error) {
      console.error('ERROR cargando juegos:', error);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGames = () => {
    console.log('=== FILTRANDO ===');
    console.log('games.length:', games.length);
    console.log('categoria:', selectedCategory);
    console.log('busqueda:', searchQuery);
    
    if (!Array.isArray(games)) {
      console.error('ERROR: games NO es array en filterGames');
      setFilteredGames([]);
      return;
    }

    let result = [...games];

    if (selectedCategory !== 'all') {
      result = result.filter((game) => game.category === selectedCategory);
      console.log('Despues filtro categoria:', result.length);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query)
      );
      console.log('Despues busqueda:', result.length);
    }

    console.log('RESULTADO FINAL:', result.length, 'juegos');
    setFilteredGames(result);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }, []);

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isSelected = selectedCategory === item.key;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item.key)}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : Colors.neutral[600]}
        />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGameItem = ({ item, index }: { item: Game; index: number }) => (
    <View style={styles.gameItemContainer}>
      <GameCard
        game={item}
        variant={index === 0 && selectedCategory === 'all' ? 'featured' : 'default'}
        onPress={() => router.push(`/game/${item.id}`)}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color={Colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No se encontraron juegos</Text>
      <Text style={styles.emptySubtitle}>
        Intenta con otra busqueda o categoria
      </Text>
    </View>
  );

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
        <Text style={styles.title}>Juegos</Text>
        <Text style={styles.subtitle}>{games.length} juegos disponibles</Text>
      </View>

      {/* Barra de busqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar juegos..."
            placeholderTextColor={Colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorias */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Lista de juegos */}
      <FlatList
        data={filteredGames}
        renderItem={renderGameItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gamesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[600]}
          />
        }
      />
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

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },

  // Categories
  categoriesContainer: {
    marginBottom: Spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary[600],
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.neutral[600],
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },

  // Games List
  gamesList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  gameItemContainer: {
    marginBottom: Spacing.md,
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
  },
});
