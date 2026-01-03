/**
 * Tres en Raya - Juego simple contra IA
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
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

type Player = 'X' | 'O' | null;
type Board = Player[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
  [0, 4, 8], [2, 4, 6], // diagonales
];

export default function TicTacToeScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { refreshUser } = useAuth();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw'>(null);
  const [score, setScore] = useState({ player: 0, ai: 0, draws: 0 });
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      setTimeout(() => makeAIMove(), 500);
    }
  }, [isPlayerTurn, winner]);

  const checkWinner = (currentBoard: Board): Player | 'draw' => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    return currentBoard.every(cell => cell !== null) ? 'draw' : null;
  };

  const makeMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      handleGameEnd(gameWinner);
    } else {
      setIsPlayerTurn(false);
    }
  };

  const makeAIMove = () => {
    const emptyIndices = board.map((cell, idx) => cell === null ? idx : null).filter(i => i !== null) as number[];
    if (emptyIndices.length === 0) return;

    // IA simple: elegir celda aleatoria
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...board];
    newBoard[randomIndex] = 'O';
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      handleGameEnd(gameWinner);
    } else {
      setIsPlayerTurn(true);
    }
  };

  const handleGameEnd = async (gameWinner: Player | 'draw') => {
    setWinner(gameWinner);
    const newScore = { ...score };
    let points = 0;
    let message = '';
    
    if (gameWinner === 'X') {
      newScore.player++;
      points = 5; // 5 puntos por ganar
      message = '¡Ganaste!';
    } else if (gameWinner === 'O') {
      newScore.ai++;
      points = 0; // 0 puntos por perder
      message = 'La IA ganó';
    } else {
      newScore.draws++;
      points = 1; // 1 punto por empate
      message = '¡Empate!';
    }
    
    setScore(newScore);
    const newTotal = totalScore + points;
    setTotalScore(newTotal);
    
    // Enviar puntaje al backend si el juego está disponible y hay puntos
    if (gameId && points > 0) {
      try {
        const response = await api.submitScore(gameId, newTotal);
        await refreshUser();
        
        Alert.alert(
          message,
          `+${points} puntos esta ronda\nPuntaje total: ${newTotal}\n\n+${response.xp_earned || 10} XP`,
          [{ text: 'Continuar' }]
        );
      } catch (error) {
        console.error('Error enviando puntaje:', error);
      }
    } else if (points === 0) {
      Alert.alert(message, 'Sigue intentando para sumar puntos');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winner && winner !== 'draw' && 
      WINNING_COMBINATIONS.some(combo => 
        combo.includes(index) && 
        combo.every(i => board[i] === winner)
      );
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          isWinningCell && styles.winningCell
        ]}
        onPress={() => makeMove(index)}
        disabled={!isPlayerTurn || winner !== null || value !== null}
        activeOpacity={0.7}
      >
        {value === 'X' && (
          <View style={styles.xContainer}>
            <View style={[styles.xLine, styles.xLine1]} />
            <View style={[styles.xLine, styles.xLine2]} />
          </View>
        )}
        {value === 'O' && (
          <View style={styles.oCircle}>
            <View style={styles.oInner} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tres en Raya',
          headerShown: true,
          headerBackTitle: 'Volver',
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Ionicons name="person" size={24} color={Colors.primary[600]} />
            <Text style={styles.scoreValue}>{score.player}</Text>
            <Text style={styles.scoreLabel}>Tú</Text>
          </View>
          <View style={styles.scoreItem}>
            <Ionicons name="remove" size={24} color={Colors.neutral[400]} />
            <Text style={styles.scoreValue}>{score.draws}</Text>
            <Text style={styles.scoreLabel}>Empates</Text>
          </View>
          <View style={styles.scoreItem}>
            <Ionicons name="hardware-chip" size={24} color={Colors.accent.info} />
            <Text style={styles.scoreValue}>{score.ai}</Text>
            <Text style={styles.scoreLabel}>IA</Text>
          </View>
        </View>

        <View style={styles.turnIndicator}>
          {!winner && (
            <Text style={styles.turnText}>
              {isPlayerTurn ? 'Tu turno (X)' : 'Turno de IA (O)'}
            </Text>
          )}
          {winner && (
            <Text style={styles.winnerText}>
              {winner === 'X' ? '¡Ganaste!' : winner === 'O' ? 'IA Ganó' : 'Empate'}
            </Text>
          )}
        </View>

        <View style={styles.board}>
          {[0, 1, 2].map(row => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map(col => renderCell(row * 3 + col))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Nueva Partida</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const { width } = Dimensions.get('window');
const boardSize = Math.min(width - 60, 360);
const cellSize = boardSize / 3;
const lineThickness = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: boardSize,
    marginBottom: Spacing.xl,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: Spacing.xs,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  turnIndicator: {
    height: 50,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  turnText: {
    fontSize: FontSizes.lg,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  winnerText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.accent.success,
    textAlign: 'center',
  },
  board: {
    width: boardSize,
    height: boardSize,
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: lineThickness / 2,
    borderColor: Colors.neutral[700],
  },
  winningCell: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  // Estilos para X
  xContainer: {
    width: cellSize * 0.6,
    height: cellSize * 0.6,
    position: 'relative',
  },
  xLine: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: Colors.primary[500],
    borderRadius: 3,
  },
  xLine1: {
    transform: [{ rotate: '45deg' }],
    top: '50%',
    marginTop: -3,
  },
  xLine2: {
    transform: [{ rotate: '-45deg' }],
    top: '50%',
    marginTop: -3,
  },
  // Estilos para O
  oCircle: {
    width: cellSize * 0.6,
    height: cellSize * 0.6,
    borderRadius: cellSize * 0.3,
    borderWidth: 6,
    borderColor: Colors.accent.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oInner: {
    width: cellSize * 0.2,
    height: cellSize * 0.2,
    borderRadius: cellSize * 0.1,
    backgroundColor: 'transparent',
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
    fontWeight: '700',
  },
});
