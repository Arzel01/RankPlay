/**
 * Buscaminas - Juego clasico
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

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const GRID_SIZE = 8;
const MINE_COUNT = 10;

export default function MinesweeperScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { refreshUser } = useAuth();
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagMode, setFlagMode] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [flagsRemaining, setFlagsRemaining] = useState(MINE_COUNT);

  useEffect(() => {
    initializeBoard();
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing') {
      const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  const initializeBoard = () => {
    const newBoard: Cell[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    // Colocar minas
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calcular numeros
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < GRID_SIZE &&
                newCol >= 0 && newCol < GRID_SIZE &&
                newBoard[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newBoard[row][col].adjacentMines = count;
        }
      }
    }

    setBoard(newBoard);
    setGameStatus('playing');
    setTimeElapsed(0);
    setFlagsRemaining(MINE_COUNT);
  };

  const revealCell = (row: number, col: number) => {
    if (gameStatus !== 'playing' || board[row][col].isFlagged) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    
    if (newBoard[row][col].isMine) {
      // Game over
      newBoard.forEach(r => r.forEach(c => { if (c.isMine) c.isRevealed = true; }));
      setBoard(newBoard);
      setGameStatus('lost');
      Alert.alert('¡Boom!', 'Pisaste una mina. ¡Intenta de nuevo!');
      return;
    }

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
      if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return;
      
      newBoard[r][c].isRevealed = true;

      if (newBoard[r][c].adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(r + dr, c + dc);
          }
        }
      }
    };

    reveal(row, col);
    setBoard(newBoard);

    // Verificar victoria
    const allSafeCellsRevealed = newBoard.every(r =>
      r.every(c => c.isMine || c.isRevealed)
    );
    if (allSafeCellsRevealed) {
      setGameStatus('won');
      handleGameWon();
    }
  };

  const handleGameWon = async () => {
    // Calcular puntaje: menos tiempo = más puntos
    // Base: 10000 puntos - 50 por cada segundo, mínimo 1000
    const score = Math.max(10000 - (timeElapsed * 50), 1000);
    
    if (gameId) {
      try {
        const response = await api.submitScore(gameId, score);
        await refreshUser();
        
        Alert.alert(
          '¡Victoria!',
          `Despejaste todas las minas\n\nPuntaje: ${score} pts\nTiempo: ${timeElapsed}s\n\n+${response.xp_earned || 20} XP`,
          [{ text: '¡Genial!' }]
        );
      } catch (error) {
        console.error('Error enviando puntaje:', error);
        Alert.alert('¡Ganaste!', `Puntaje: ${score} pts\nTiempo: ${timeElapsed}s`);
      }
    } else {
      Alert.alert('¡Ganaste!', `Puntaje: ${score} pts\nTiempo: ${timeElapsed}s`);
    }
  };

  const toggleFlag = (row: number, col: number) => {
    if (gameStatus !== 'playing' || board[row][col].isRevealed) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setFlagsRemaining(prev => prev + (newBoard[row][col].isFlagged ? -1 : 1));
    setBoard(newBoard);
  };

  const handleCellPress = (row: number, col: number) => {
    if (flagMode) {
      toggleFlag(row, col);
    } else {
      revealCell(row, col);
    }
  };

  const renderCell = (cell: Cell, row: number, col: number) => {
    let content = null;
    let bgColor = Colors.neutral[700];

    if (cell.isRevealed) {
      bgColor = Colors.neutral[800];
      if (cell.isMine) {
        content = <Ionicons name="nuclear" size={20} color={Colors.accent.error} />;
      } else if (cell.adjacentMines > 0) {
        const colors = ['', Colors.accent.info, Colors.accent.success, Colors.accent.error, Colors.primary[600], Colors.accent.gold];
        content = (
          <Text style={[styles.cellNumber, { color: colors[cell.adjacentMines] || Colors.neutral[400] }]}>
            {cell.adjacentMines}
          </Text>
        );
      }
    } else if (cell.isFlagged) {
      content = <Ionicons name="flag" size={20} color={Colors.accent.error} />;
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[styles.cell, { backgroundColor: bgColor }]}
        onPress={() => handleCellPress(row, col)}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buscaminas',
          headerShown: true,
          headerBackTitle: 'Volver',
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.stat}>
            <Ionicons name="flag" size={24} color={Colors.accent.error} />
            <Text style={styles.statText}>{flagsRemaining}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={24} color={Colors.accent.info} />
            <Text style={styles.statText}>{timeElapsed}s</Text>
          </View>
        </View>

        <View style={styles.board}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.modeButton, !flagMode && styles.modeButtonActive]}
            onPress={() => setFlagMode(false)}
          >
            <Ionicons name="hand-left" size={24} color={!flagMode ? '#FFFFFF' : Colors.neutral[400]} />
            <Text style={[styles.modeText, !flagMode && styles.modeTextActive]}>Revelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, flagMode && styles.modeButtonActive]}
            onPress={() => setFlagMode(true)}
          >
            <Ionicons name="flag" size={24} color={flagMode ? '#FFFFFF' : Colors.neutral[400]} />
            <Text style={[styles.modeText, flagMode && styles.modeTextActive]}>Bandera</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={initializeBoard}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Nuevo Juego</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const { width } = Dimensions.get('window');
const boardSize = Math.min(width - 40, 400);
const cellSize = (boardSize - 20) / GRID_SIZE;

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
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.neutral[100],
  },
  board: {
    width: boardSize,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  cellNumber: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[800],
  },
  modeButtonActive: {
    backgroundColor: Colors.primary[600],
  },
  modeText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[400],
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
