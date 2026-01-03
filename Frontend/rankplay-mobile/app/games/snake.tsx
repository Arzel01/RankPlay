/**
 * Snake - Juego clásico de la serpiente
 * Controles: WASD/Flechas en web, Swipe táctil en móvil
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 320);
const CELL_SIZE = Math.floor(BOARD_SIZE / GRID_SIZE);
const ACTUAL_BOARD_SIZE = CELL_SIZE * GRID_SIZE;
const INITIAL_SPEED = 180;
const SWIPE_THRESHOLD = 20;

export default function SnakeScreen() {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameOver, setGameOver] = useState(false);
  
  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // CLAVE: Bloquear cambios de dirección hasta que se procese el tick actual
  // Esto evita el movimiento diagonal cuando se presionan 2 teclas rápido
  const directionLocked = useRef<boolean>(false);

  // Game loop
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [isPlaying, speed, gameOver]);

  // Controles de teclado para web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isPlaying) return;
        
        const keyMap: Record<string, Direction> = {
          'ArrowUp': 'UP',
          'ArrowDown': 'DOWN',
          'ArrowLeft': 'LEFT',
          'ArrowRight': 'RIGHT',
          'w': 'UP',
          'W': 'UP',
          's': 'DOWN',
          'S': 'DOWN',
          'a': 'LEFT',
          'A': 'LEFT',
          'd': 'RIGHT',
          'D': 'RIGHT',
        };
        
        const newDirection = keyMap[e.key];
        if (newDirection) {
          e.preventDefault();
          changeDirection(newDirection);
        }
        
        // Espacio para pausar
        if (e.key === ' ') {
          e.preventDefault();
          setIsPlaying(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPlaying]);

  // PanResponder para swipe en móvil - detecta UN solo swipe por gesto
  const swipeDetected = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: () => {
        swipeDetected.current = false;
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Solo UN swipe por gesto táctil
        if (swipeDetected.current) return;
        
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // Necesita superar el threshold mínimo
        if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
          return;
        }
        
        // Marcar swipe como detectado ANTES de cambiar dirección
        swipeDetected.current = true;
        
        // CLAVE: Solo aceptar swipes claramente horizontales o verticales
        // El eje dominante debe ser al menos 1.5x mayor que el otro
        // Esto evita registrar diagonales accidentales
        const ratio = Math.max(absDx, absDy) / (Math.min(absDx, absDy) + 1);
        
        if (ratio < 1.5) {
          // Swipe demasiado diagonal - ignorar
          return;
        }
        
        // Determinar dirección basado en el eje dominante
        if (absDx > absDy) {
          // Movimiento claramente horizontal
          changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          // Movimiento claramente vertical
          changeDirection(dy > 0 ? 'DOWN' : 'UP');
        }
      },
      onPanResponderRelease: () => {
        // Resetear para el próximo gesto táctil
        swipeDetected.current = false;
      },
    })
  ).current;

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100
    );
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    // Desbloquear para permitir un nuevo input de dirección
    directionLocked.current = false;
    
    setSnake(currentSnake => {
      const head = currentSnake[0];
      let newHead: Position;

      switch (directionRef.current) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Colisión con paredes
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        handleGameOver(currentSnake.length - 1);
        return currentSnake;
      }

      // Colisión con cuerpo
      if (currentSnake.slice(1).some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver(currentSnake.length - 1);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      // Comió comida
      setFood(currentFood => {
        if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
          setScore(prev => {
            const newScore = prev + 10;
            // Aumentar velocidad cada 50 puntos
            if (newScore % 50 === 0) {
              setSpeed(prevSpeed => Math.max(60, prevSpeed - 15));
            }
            return newScore;
          });
          return generateFood(newSnake);
        }
        return currentFood;
      });

      // Verificar si comió
      if (newHead.x === food.x && newHead.y === food.y) {
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  }, [food, generateFood]);

  const handleGameOver = useCallback((finalScore: number) => {
    setIsPlaying(false);
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
  }, [highScore]);

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 7, y: 7 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    directionLocked.current = false; // Resetear bloqueo al iniciar
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsPlaying(true);
  }, [generateFood]);

  const togglePause = useCallback(() => {
    if (gameOver) {
      startGame();
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [gameOver, startGame]);

  const changeDirection = useCallback((newDirection: Direction) => {
    // CLAVE: Solo permitir UN cambio de dirección por tick
    // Esto previene el movimiento diagonal
    if (directionLocked.current) {
      return; // Ignorar input hasta el próximo tick
    }
    
    // Evitar ir en dirección opuesta (180 grados)
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    
    const currentDir = directionRef.current;
    
    // Solo cambiar si es una dirección válida (no opuesta y no la misma)
    if (currentDir !== opposites[newDirection] && currentDir !== newDirection) {
      directionRef.current = newDirection;
      setDirection(newDirection);
      // Bloquear hasta el próximo tick del game loop
      directionLocked.current = true;
    }
  }, []);

  const renderCell = useCallback((x: number, y: number) => {
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    return (
      <View
        key={`${x}-${y}`}
        style={[
          styles.cell,
          isSnakeBody && styles.snakeCell,
          isSnakeHead && styles.snakeHead,
          isFood && styles.foodCell,
        ]}
      >
        {isFood && <View style={styles.foodInner} />}
      </View>
    );
  }, [snake, food]);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(renderCell(x, y));
      }
    }
    return cells;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Snake',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.dark.background },
          headerTintColor: '#FFFFFF',
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Marcador */}
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Puntos</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Récord</Text>
            <Text style={styles.scoreValue}>{highScore}</Text>
          </View>
        </View>

        {/* Tablero de juego con gestos */}
        <View 
          style={styles.gameBoardWrapper}
          {...panResponder.panHandlers}
        >
          <View style={styles.gameBoard}>
            {renderGrid()}
          </View>
          
          {/* Overlay de Game Over */}
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Ionicons name="skull" size={48} color={Colors.accent.error} />
              <Text style={styles.gameOverText}>Game Over</Text>
              <Text style={styles.gameOverScore}>{score} puntos</Text>
            </View>
          )}
          
          {/* Overlay de Inicio */}
          {!isPlaying && !gameOver && score === 0 && (
            <View style={styles.startOverlay}>
              <Ionicons name="game-controller" size={48} color={Colors.primary[400]} />
              <Text style={styles.startText}>Snake</Text>
              <Text style={styles.instructionText}>
                {Platform.OS === 'web' 
                  ? 'WASD o Flechas para mover' 
                  : 'Desliza para mover'}
              </Text>
            </View>
          )}
        </View>

        {/* Instrucciones según plataforma */}
        <View style={styles.instructions}>
          {Platform.OS === 'web' ? (
            <Text style={styles.instructionHint}>
              <Text style={styles.keyHint}>WASD</Text> o <Text style={styles.keyHint}>↑↓←→</Text> para mover • <Text style={styles.keyHint}>Espacio</Text> para pausar
            </Text>
          ) : (
            <Text style={styles.instructionHint}>
              👆 Desliza sobre el tablero para cambiar dirección
            </Text>
          )}
        </View>

        {/* Botón de Jugar/Pausar */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isPlaying && styles.pauseButton,
            gameOver && styles.restartButton,
          ]}
          onPress={togglePause}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={gameOver ? 'refresh' : (isPlaying ? 'pause' : 'play')} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.actionButtonText}>
            {gameOver ? 'Reiniciar' : (isPlaying ? 'Pausar' : 'Jugar')}
          </Text>
        </TouchableOpacity>

        {/* Controles táctiles opcionales para móvil */}
        {Platform.OS !== 'web' && (
          <View style={styles.touchControls}>
            <Text style={styles.controlsLabel}>O usa los botones:</Text>
            <View style={styles.controlsGrid}>
              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeDirection('UP')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-up" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeDirection('LEFT')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.controlSpacer} />
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeDirection('RIGHT')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeDirection('DOWN')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: ACTUAL_BOARD_SIZE,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  gameBoardWrapper: {
    position: 'relative',
    width: ACTUAL_BOARD_SIZE + 4,
    height: ACTUAL_BOARD_SIZE + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBoard: {
    width: ACTUAL_BOARD_SIZE,
    height: ACTUAL_BOARD_SIZE,
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: Colors.accent.success,
    overflow: 'hidden',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  snakeCell: {
    backgroundColor: Colors.accent.success,
    borderRadius: 3,
    borderWidth: 0,
  },
  snakeHead: {
    backgroundColor: '#4ADE80',
    borderRadius: 4,
    borderWidth: 0,
  },
  foodCell: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  foodInner: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: Colors.accent.error,
    borderRadius: (CELL_SIZE - 4) / 2,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  gameOverText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.accent.error,
    marginTop: Spacing.md,
  },
  gameOverScore: {
    fontSize: FontSizes.lg,
    color: Colors.neutral[300],
    marginTop: Spacing.xs,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  startText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  instructionText: {
    fontSize: FontSizes.md,
    color: Colors.neutral[400],
    marginTop: Spacing.sm,
  },
  instructions: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  instructionHint: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  keyHint: {
    color: Colors.primary[400],
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    minWidth: 160,
  },
  pauseButton: {
    backgroundColor: Colors.accent.warning,
  },
  restartButton: {
    backgroundColor: Colors.primary[600],
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  touchControls: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  controlsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
  },
  controlsGrid: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  controlButton: {
    width: 56,
    height: 56,
    backgroundColor: Colors.neutral[700],
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlSpacer: {
    width: 56,
    height: 56,
    marginHorizontal: 2,
  },
});
