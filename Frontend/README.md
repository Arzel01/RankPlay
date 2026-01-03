# RankPlay Frontend

Aplicación móvil desarrollada con React Native y Expo.

## Descripción

App móvil multiplataforma (iOS/Android) que permite a los usuarios jugar minijuegos, competir en rankings y socializar con amigos.

## Arquitectura

### Estructura de Carpetas

```
rankplay-mobile/
├── app/                      # Navegación y pantallas (Expo Router)
│   ├── (tabs)/              # Navegación principal con tabs
│   │   ├── _layout.tsx      # Configuración del tab navigator
│   │   ├── index.tsx        # Home - Destacados y bienvenida
│   │   ├── games.tsx        # Catálogo de juegos
│   │   ├── rankings.tsx     # Rankings globales
│   │   ├── friends.tsx      # Lista de amigos
│   │   └── profile.tsx      # Perfil del usuario
│   │
│   ├── auth/                # Autenticación
│   │   ├── login.tsx        # Inicio de sesión
│   │   └── register.tsx     # Registro
│   │
│   ├── games/               # Juegos jugables
│   │   ├── tic-tac-toe.tsx  # Tres en raya
│   │   ├── memory.tsx       # Juego de memoria
│   │   └── minesweeper.tsx  # Buscaminas
│   │
│   ├── game/                # Detalles y rankings
│   │   └── [id].tsx         # Pantalla de detalle de juego
│   │
│   ├── settings/            # Configuración
│   │   ├── edit-profile.tsx
│   │   ├── privacy.tsx
│   │   ├── help.tsx
│   │   └── notifications.tsx
│   │
│   ├── user/                # Perfiles de otros usuarios
│   │   └── [id].tsx
│   │
│   └── _layout.tsx          # Layout raíz con AuthProvider
│
├── components/              # Componentes reutilizables
│   ├── ui/                  # Componentes UI base
│   │   ├── Avatar.tsx       # Avatar con iniciales/imagen
│   │   ├── Button.tsx       # Botón con variantes
│   │   ├── Card.tsx         # Tarjeta contenedor
│   │   └── Input.tsx        # Input de texto
│   │
│   ├── GameCard.tsx         # Tarjeta de juego
│   ├── LeaderboardItem.tsx  # Item de ranking
│   └── haptic-tab.tsx       # Tab con feedback háptico
│
├── contexts/                # Context API de React
│   └── AuthContext.tsx      # Estado de autenticación global
│
├── services/                # Servicios externos
│   └── api.ts               # Cliente API REST
│
├── constants/               # Constantes y configuración
│   └── theme.ts             # Sistema de diseño (colores, spacing)
│
└── assets/                  # Recursos estáticos
    └── images/              # Imágenes y sprites
```

## Sistema de Diseño

### Paleta de Colores

Definida en `constants/theme.ts`:

```typescript
Colors = {
  // Primary (Azul) - Acciones principales
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',   // Color principal
    600: '#2563eb',   // Hover/Active
    900: '#1e3a8a',   // Texto oscuro
  },
  
  // Success (Verde) - Éxitos y confirmaciones
  success: {
    500: '#22c55e',
    600: '#16a34a',
  },
  
  // Error (Rojo) - Errores y alertas
  error: {
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Neutral (Grises) - UI general
  neutral: {
    50: '#f9fafb',    // Fondo claro
    100: '#f3f4f6',   // Fondo secundario
    200: '#e5e7eb',   // Bordes
    300: '#d1d5db',   // Bordes activos
    500: '#6b7280',   // Texto secundario
    700: '#374151',   // Texto principal
    900: '#111827',   // Texto destacado
  }
}
```

### Tipografía

```typescript
FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,    // Base
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
}
```

### Espaciado

```typescript
Spacing = {
  1: 4,    // 4px
  2: 8,    // 8px
  3: 12,   // 12px
  4: 16,   // 16px - Base
  5: 20,   // 20px
  6: 24,   // 24px
  8: 32,   // 32px
  12: 48,  // 48px
  16: 64,  // 64px
}
```

### Sombras

```typescript
Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: { /* ... */ },
  md: { /* ... */ },
  lg: { /* ... */ },
}
```

## Autenticación

### AuthContext

Context global que maneja el estado de autenticación.

**Ubicación:** `contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;           // Usuario actual
  isLoading: boolean;          // Cargando inicial
  isAuthenticated: boolean;    // ¿Está autenticado?
  login: (email, password) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;  // Actualizar datos del usuario
}
```

**Uso:**

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Text>No autenticado</Text>;
  }
  
  return (
    <View>
      <Text>Hola {user.profile.display_name}</Text>
      <Button onPress={logout}>Cerrar Sesión</Button>
    </View>
  );
}
```

### Flujo de Autenticación

1. Usuario ingresa credenciales
2. `AuthContext.login()` llama a `api.login()`
3. API retorna tokens + datos de usuario
4. Tokens se guardan en AsyncStorage
5. Usuario se guarda en estado del contexto
6. App redirige a home automáticamente

## API Service

### Cliente HTTP

**Ubicación:** `services/api.ts`

Cliente centralizado para todas las llamadas HTTP al backend.

```typescript
import api from '@/services/api';

// Autenticación
await api.register({ username, email, password, password_confirm });
await api.login(email, password);
await api.logout();

// Juegos
const games = await api.getGames();
const game = await api.getGame(gameId);
const featured = await api.getFeaturedGames();

// Puntajes
await api.submitScore(gameId, scoreValue, metadata);
const myScores = await api.getMyScores();
const leaderboard = await api.getGameLeaderboard(gameId);

// Amigos
const friends = await api.getFriends();
await api.sendFriendRequest(username);
await api.acceptFriendRequest(friendshipId);

// Perfil
const user = await api.getMe();
await api.updateProfile({ display_name, bio, avatar_url });
```

### Manejo de Tokens

Los tokens JWT se manejan automáticamente:

```typescript
// Al hacer login/register, tokens se guardan
await api.setTokens({ access, refresh });

// En cada request, se añade el header
headers['Authorization'] = `Bearer ${this.accessToken}`;

// Si expira (401), se intenta refresh automático
if (response.status === 401 && this.refreshToken) {
  const refreshed = await this.refreshAccessToken();
  if (refreshed) {
    // Reintentar request original
  }
}
```

## Componentes de Juegos

### Tic-Tac-Toe (Tres en Raya)

**Ubicación:** `app/games/tic-tac-toe.tsx`

**Características:**
- Tablero 3x3
- Juego contra IA simple
- Símbolos X/O dibujados con Canvas
- Resalta celdas ganadoras
- Sistema de puntuación acumulativa

**Flujo:**
1. Usuario toca celda vacía
2. Se coloca X del usuario
3. IA calcula mejor movimiento y coloca O
4. Verifica victoria/empate
5. Si termina, envía puntaje total al backend
6. Actualiza XP del usuario

**Puntuación:**
- Victoria: +5 puntos
- Empate: +1 punto
- Derrota: +0 puntos
- Acumulativo: puntajes se suman

**Código clave:**

```typescript
const handleCellPress = (row: number, col: number) => {
  if (board[row][col] !== '' || winner || gameOver) return;
  
  // Turno del jugador
  const newBoard = [...board];
  newBoard[row][col] = 'X';
  setBoard(newBoard);
  
  // Verificar victoria
  const result = checkWinner(newBoard);
  if (result) {
    handleGameEnd('X');
    return;
  }
  
  // Turno de la IA
  setTimeout(() => {
    const aiMove = getAIMove(newBoard);
    // ...
  }, 500);
};

const handleGameEnd = async (winner: string) => {
  let points = 0;
  if (winner === 'X') points = 5;  // Victoria
  else if (winner === 'draw') points = 1;  // Empate
  
  const newTotal = totalScore + points;
  setTotalScore(newTotal);
  
  try {
    await api.submitScore(gameId, newTotal);
    await refreshUser();  // Actualizar XP
  } catch (error) {
    console.error(error);
  }
};
```

### Memory (Juego de Memoria)

**Ubicación:** `app/games/memory.tsx`

**Características:**
- 16 cartas (8 pares)
- Voltea 2 cartas por turno
- Cuenta movimientos y tiempo
- Emojis coloridos como iconos

**Flujo:**
1. Usuario toca carta
2. Carta se voltea
3. Si es la segunda carta:
   - Si hacen pareja: permanecen volteadas
   - Si no: vuelven a ocultarse después de 1s
4. Cuando todas están emparejadas: envía puntaje

**Puntuación:**
```
score = max(1000 - (moves * 10) - timeElapsed, 100)
```
- Menos movimientos = más puntos
- Menos tiempo = más puntos
- Mínimo 100 puntos

### Minesweeper (Buscaminas)

**Ubicación:** `app/games/minesweeper.tsx`

**Características:**
- Tablero 8x8 con 10 minas
- Sistema de banderas (mantener presionado)
- Revelación automática de celdas vacías
- Contador de tiempo

**Flujo:**
1. Usuario toca celda:
   - Si es mina: Game Over
   - Si no: revela celda y adyacentes vacías
2. Usuario mantiene presionado: coloca/quita bandera
3. Revela todas las celdas sin minas: Victoria

**Puntuación:**
```
score = max(10000 - (timeElapsed * 50), 1000)
```
- Más rápido = más puntos
- Mínimo 1000 puntos

## Pantallas Principales

### Home (`app/(tabs)/index.tsx`)

**Funcionalidad:**
- Muestra juegos destacados
- Estadísticas del usuario (nivel, XP, mejores puntajes)
- Acceso rápido a juegos
- Si no está autenticado: pantalla de bienvenida

### Games (`app/(tabs)/games.tsx`)

**Funcionalidad:**
- Catálogo completo de juegos
- Búsqueda por nombre/descripción
- Filtros por categoría
- Información de cada juego (jugadores, mejor puntaje)

### Rankings (`app/(tabs)/rankings.tsx`)

**Funcionalidad:**
- Selector de juego
- Top 3 con podio visual (oro, plata, bronce)
- Lista completa de rankings
- Resalta al usuario actual
- Scroll infinito

### Friends (`app/(tabs)/friends.tsx`)

**Funcionalidad:**
- Lista de amigos con niveles
- Solicitudes pendientes recibidas
- Solicitudes enviadas
- Buscar usuarios
- Agregar/eliminar amigos

### Profile (`app/(tabs)/profile.tsx`)

**Funcionalidad:**
- Info del usuario (avatar, nivel, XP, estadísticas)
- Mejores puntajes en cada juego
- Botón de configuración
- Botón de logout

### Game Detail (`app/game/[id].tsx`)

**Funcionalidad:**
- Descripción e instrucciones del juego
- Rankings del juego específico
- Tabs: Global / Amigos
- Botón "Jugar Ahora"

## Componentes Reutilizables

### GameCard

Tarjeta visual para mostrar un juego.

```typescript
interface GameCardProps {
  game: Game;
  onPress?: () => void;
  variant?: 'default' | 'featured';
}

// Uso
<GameCard 
  game={game}
  variant="featured"
  onPress={() => router.push(`/game/${game.id}`)}
/>
```

**Muestra:**
- Icono del juego
- Título
- Número de jugadores
- Badge si es destacado

### LeaderboardItem

Item de ranking con posición, avatar y puntaje.

```typescript
interface LeaderboardItemProps {
  entry: RankingEntry;
  showMedal?: boolean;  // Medallas para top 3
}

// Uso
<LeaderboardItem 
  entry={rankingEntry}
  showMedal={true}
/>
```

**Muestra:**
- Posición (#1, #2, etc.) o medalla (oro, plata, bronce)
- Avatar del usuario
- Nombre y nivel
- Puntaje
- Fondo destacado si es el usuario actual

### Avatar

Avatar con imagen o iniciales + badge de nivel opcional.

```typescript
interface AvatarProps {
  uri?: string | null;     // URL de imagen
  name: string;            // Para iniciales
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  level?: number;
}

// Uso
<Avatar 
  uri={user.profile.avatar_url}
  name={user.profile.display_name}
  size="lg"
  showLevel={true}
  level={user.profile.current_level}
/>
```

### Button

Botón personalizable con variantes.

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

// Uso
<Button 
  title="Jugar Ahora"
  variant="primary"
  size="lg"
  onPress={handlePlay}
  icon={<Ionicons name="play" size={20} />}
/>
```

## Sistema de Actualización de XP

### Flujo Completo

1. **Usuario completa juego**
   ```typescript
   // En el componente del juego
   const handleGameEnd = async (score: number) => {
     try {
       await api.submitScore(gameId, score);
       await refreshUser();  // ← Actualiza usuario
       Alert.alert('¡Puntaje enviado!', `Ganaste XP!`);
     } catch (error) {
       Alert.alert('Error', error.message);
     }
   };
   ```

2. **Backend procesa**
   ```python
   # views_games.py - ScoreViewSet.submit()
   score = Score.objects.create(user=request.user, game=game, score_value=value)
   request.user.profile.add_xp(game.xp_per_play)  # ← Añade XP
   ```

3. **Frontend actualiza UI**
   ```typescript
   // AuthContext.tsx
   const refreshUser = async () => {
     const userData = await api.getMe();  // ← Obtiene datos actualizados
     setUser(userData);  // ← Actualiza estado
   };
   ```

4. **UI refleja cambios**
   - Perfil muestra nuevo nivel/XP
   - Barra de progreso se actualiza
   - Avatar muestra nuevo nivel

## Dependencias Principales

```json
{
  "dependencies": {
    "expo": "~52.0.30",
    "expo-router": "~4.0.17",
    "react": "18.3.1",
    "react-native": "0.76.6",
    "react-native-safe-area-context": "4.12.0",
    "@react-native-async-storage/async-storage": "2.1.0",
    "@expo/vector-icons": "^14.0.4"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  }
}
```

## Ejecución

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar Expo
npx expo start

# Opciones:
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Escanea QR con Expo Go app
```

### Configuración

**Cambiar URL del backend:**

Editar `services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.100.23:8000/api/v1'  // ← Cambiar IP
  : 'https://tu-backend.com/api/v1';     // Producción
```

### Limpiar Caché

```bash
# Limpiar caché de Expo
npx expo start -c

# Limpiar node_modules
rm -rf node_modules
npm install
```

## Debugging

### Ver Logs

```bash
# Terminal de Expo muestra logs automáticamente
npx expo start

# Para ver solo logs de tu app:
# Presiona 'j' en la terminal de Expo
```

### Debug en Chrome

```bash
# En el menú de desarrollo de la app (shake device):
# - Seleccionar "Debug Remote JS"
# - Abrir Chrome DevTools en http://localhost:19000/debugger-ui
```

### React DevTools

```bash
npm install -g react-devtools
react-devtools
```

## Configuración de TypeScript

**tsconfig.json:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]  // Imports absolutos
    }
  }
}
```

**Uso de paths:**

```typescript
// Bueno
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

// Evitar
import { useAuth } from '../../../contexts/AuthContext';
```

## Plataformas

### iOS

- Requiere Xcode en macOS
- Testear con simulador o device físico
- Bundle ID configurable en `app.json`

### Android

- Testear con emulador o device físico
- Package name configurable en `app.json`
- Requiere Android SDK

### Web (Experimental)

Expo soporta web, pero no es el foco de RankPlay:

```bash
npx expo start --web
```

## Personalización de Tema

Para cambiar la paleta de colores:

1. Editar `constants/theme.ts`
2. Actualizar valores en `Colors`
3. La app usa el tema automáticamente

```typescript
// Ejemplo: Cambiar color primario a verde
export const Colors = {
  primary: {
    50: '#f0fdf4',
    500: '#22c55e',  // Verde
    600: '#16a34a',
    // ...
  },
  // ...
};
```

## Notificaciones (Futuro)

Actualmente no implementadas, pero se puede agregar con:

```bash
npx expo install expo-notifications
```

## Navegación

### Expo Router

Usa navegación basada en archivos (como Next.js):

```
app/
├── (tabs)/          → Tab Navigator
├── auth/            → Stack de Auth
├── game/[id].tsx    → Parámetro dinámico
└── _layout.tsx      → Layout raíz
```

### Navegar entre pantallas

```typescript
import { router } from 'expo-router';

// Navegar a pantalla
router.push('/games');
router.push(`/game/${gameId}`);

// Reemplazar (no volver atrás)
router.replace('/auth/login');

// Volver atrás
router.back();

// Navegar con parámetros
router.push({
  pathname: '/game/[id]',
  params: { id: gameId }
});
```

## Recursos Adicionales

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://expo.github.io/router/)
- [React Navigation](https://reactnavigation.org/)

---

**Frontend desarrollado con React Native + Expo**
