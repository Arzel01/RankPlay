/**
 * Memory - Juego de emparejar cartas
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

type Card = {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  isFlipped: boolean;
  isMatched: boolean;
};

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'heart', 'star', 'rocket', 'flash', 'trophy', 'gift',
  'diamond', 'pizza', 'basketball', 'flower', 'headset', 'camera',
];

export default function MemoryScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { refreshUser } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      if (cards[first].icon === cards[second].icon) {
        // Match
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, isMatched: true } : card
          ));
          setMatches(prev => prev + 1);
          setFlippedIndices([]);
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, isFlipped: false } : card
          ));
          setFlippedIndices([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedIndices]);

  useEffect(() => {
    if (matches === 8 && isPlaying) {
      setIsPlaying(false);
      handleGameEnd();
    }
  }, [matches]);

  const handleGameEnd = async () => {
    // Calcular puntaje: menos movimientos y menos tiempo = más puntos
    // Base: 1000 puntos - 10 por cada movimiento - 1 por cada segundo
    const score = Math.max(1000 - (moves * 10) - timeElapsed, 100);
    
    if (gameId) {
      try {
        const response = await api.submitScore(gameId, score);
        await refreshUser();
        
        Alert.alert(
          '¡Felicidades!',
          `Completaste el juego\n\nPuntaje: ${score} pts\nMovimientos: ${moves}\nTiempo: ${timeElapsed}s\n\n+${response.xp_earned || 20} XP`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error enviando puntaje:', error);
        Alert.alert('¡Completado!', `Puntaje: ${score} pts\nMovimientos: ${moves}\nTiempo: ${timeElapsed}s`);
      }
    } else {
      Alert.alert('¡Completado!', `Puntaje: ${score} pts\nMovimientos: ${moves}\nTiempo: ${timeElapsed}s`);
    }
  };

  const initializeGame = () => {
    const selectedIcons = ICONS.slice(0, 8);
    const pairedIcons = [...selectedIcons, ...selectedIcons];
    const shuffled = pairedIcons
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setIsPlaying(true);
  };

  const handleCardPress = (index: number) => {
    if (!isPlaying) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length === 2) return;

    setCards(prev => prev.map((card, idx) =>
      idx === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedIndices(prev => [...prev, index]);
  };

  const renderCard = (card: Card, index: number) => {
    const showFront = card.isFlipped || card.isMatched;

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          showFront && styles.cardFlipped,
          card.isMatched && styles.cardMatched,
        ]}
        onPress={() => handleCardPress(index)}
        disabled={card.isFlipped || card.isMatched}
      >
        {showFront ? (
          <Ionicons name={card.icon} size={40} color={card.isMatched ? Colors.accent.gold : Colors.primary[600]} />
        ) : (
          <Ionicons name="help" size={40} color={Colors.neutral[500]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Memory',
          headerShown: true,
          headerBackTitle: 'Volver',
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.stat}>
            <Ionicons name="repeat" size={24} color={Colors.accent.info} />
            <Text style={styles.statText}>{moves}</Text>
            <Text style={styles.statLabel}>Movimientos</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent.success} />
            <Text style={styles.statText}>{matches}/8</Text>
            <Text style={styles.statLabel}>Pares</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={24} color={Colors.accent.warning} />
            <Text style={styles.statText}>{timeElapsed}s</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        <View style={styles.board}>
          {cards.map((card, index) => renderCard(card, index))}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Nuevo Juego</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const { width } = Dimensions.get('window');
const boardWidth = Math.min(width - 40, 400);
const cardSize = (boardWidth - 40) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[100],
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[400],
  },
  board: {
    width: boardWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    width: cardSize,
    height: cardSize,
    backgroundColor: Colors.neutral[700],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[600],
  },
  cardFlipped: {
    backgroundColor: Colors.neutral[800],
    borderColor: Colors.primary[600],
  },
  cardMatched: {
    backgroundColor: Colors.accent.success + '30',
    borderColor: Colors.accent.gold,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
