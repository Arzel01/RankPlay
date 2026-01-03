# RankPlay 

Plataforma móvil de minijuegos con sistema de rankings, logros y amigos.

## Índice

- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [API Endpoints](#api-endpoints)
- [Juegos Disponibles](#juegos-disponibles)
- [Sistema de XP y Niveles](#sistema-de-xp-y-niveles)

## Descripción

RankPlay es una aplicación móvil desarrollada con React Native Expo que permite a los usuarios:
- Jugar minijuegos casuales
- Competir en rankings globales y con amigos
- Ganar XP y subir de nivel
- Desbloquear logros
- Agregar amigos y comparar puntajes

## Características

### Sistema de Usuarios
- Registro e inicio de sesión con JWT
- Perfiles personalizables (avatar, bio, display name)
- Sistema de niveles basado en XP
- Estadísticas personales

### Juegos
- 3 minijuegos jugables:
  - **Tic-Tac-Toe**: Juego clásico contra IA (5 pts ganar, 1 pt empate)
  - **Memory**: Encuentra parejas de cartas (puntuación: 1000 - movimientos × 10 - tiempo)
  - **Minesweeper**: Buscaminas 8x8 con 10 minas (puntuación: 10000 - tiempo × 50)
- Todos los juegos otorgan XP al completarse

### Rankings
- Rankings globales por juego
- Rankings de amigos
- Sistema de podio (top 3)
- Visualización de posición actual

### Sistema Social
- Agregar/eliminar amigos
- Solicitudes de amistad
- Búsqueda de usuarios
- Comparación de puntajes con amigos

### Logros (Achievements)
- Logros por juego y globales
- Diferentes rarezas (común, raro, épico, legendario)
- Sistema de progreso
- Recompensas de XP al reclamar

## Estructura del Proyecto

```
RankPlay/
├── Backend/
│   └── rankplay_backend/
│       ├── accounts/          # Modelos de Usuario y Perfil
│       ├── games/             # Modelos de Juego, Score, Session
│       ├── achievements/      # Modelos de Logros
│       ├── api/
│       │   ├── views_accounts.py    # Auth, Users, Profiles, Friendships
│       │   ├── views_games.py       # Games, Scores, Sessions
│       │   ├── views_achievements.py # Achievements
│       │   ├── serializers.py       # Todos los serializers
│       │   └── urls.py              # Rutas de la API
│       └── manage.py
│
└── Frontend/
    └── rankplay-mobile/
        ├── app/
        │   ├── (tabs)/           # Navegación principal
        │   │   ├── index.tsx     # Pantalla Home
        │   │   ├── games.tsx     # Catálogo de juegos
        │   │   ├── rankings.tsx  # Rankings globales
        │   │   ├── friends.tsx   # Lista de amigos
        │   │   └── profile.tsx   # Perfil del usuario
        │   ├── auth/             # Login y Registro
        │   ├── games/            # Pantallas de juegos
        │   │   ├── tic-tac-toe.tsx
        │   │   ├── memory.tsx
        │   │   └── minesweeper.tsx
        │   ├── game/             # Detalles de un juego
        │   └── settings/         # Configuración del perfil
        ├── components/           # Componentes reutilizables
        ├── contexts/             # Context API (Auth)
        ├── services/             # API service
        └── constants/            # Temas y constantes
```

## Tecnologías

### Backend
- **Django 5.2.8**: Framework web
- **Django REST Framework**: API REST
- **PostgreSQL**: Base de datos
- **Simple JWT**: Autenticación con tokens
- **Python 3.x**

### Frontend
- **React Native**: Framework móvil
- **Expo**: Herramientas de desarrollo
- **TypeScript**: Tipado estático
- **Expo Router**: Navegación basada en archivos
- **AsyncStorage**: Almacenamiento local

## Instalación

### Backend

1. Instalar dependencias:
```bash
cd Backend/rankplay_backend
pip install -r requirements.txt
```

2. Configurar base de datos:
```bash
python manage.py migrate
```

3. Crear datos de prueba (opcional):
```bash
python manage.py create_test_data
```

4. Iniciar servidor:
```bash
python manage.py runserver 0.0.0.0:8000
```

### Frontend

1. Instalar dependencias:
```bash
cd Frontend/rankplay-mobile
npm install
```

2. Configurar URL del backend en `services/api.ts`:
```typescript
const API_BASE_URL = 'http://TU_IP:8000/api/v1';
```

3. Iniciar app:
```bash
npx expo start
```

## API Endpoints

### Autenticación
- `POST /api/v1/auth/register/` - Registro de usuario
- `POST /api/v1/auth/login/` - Inicio de sesión
- `POST /api/v1/auth/logout/` - Cerrar sesión
- `POST /api/v1/auth/change_password/` - Cambiar contraseña
- `POST /api/v1/token/refresh/` - Refrescar token

### Usuarios y Perfiles
- `GET /api/v1/users/me/` - Obtener usuario actual
- `GET /api/v1/users/search/?q=query` - Buscar usuarios
- `GET /api/v1/profiles/me/` - Obtener perfil actual
- `PATCH /api/v1/profiles/me/` - Actualizar perfil

### Juegos
- `GET /api/v1/games/` - Listar juegos
- `GET /api/v1/games/{id}/` - Detalle de juego
- `GET /api/v1/games/featured/` - Juegos destacados
- `GET /api/v1/games/{id}/leaderboard/` - Ranking global del juego
- `GET /api/v1/games/{id}/friends_leaderboard/` - Ranking de amigos

### Puntajes
- `POST /api/v1/scores/submit/` - Enviar puntaje
  ```json
  {
    "game": "uuid",
    "score_value": 1000,
    "metadata": {}
  }
  ```
- `GET /api/v1/scores/my_scores/` - Mis puntajes
- `GET /api/v1/scores/my_best/` - Mis mejores puntajes

### Amistades
- `GET /api/v1/friendships/friends/` - Lista de amigos
- `GET /api/v1/friendships/pending/` - Solicitudes pendientes
- `POST /api/v1/friendships/send_request/` - Enviar solicitud
- `POST /api/v1/friendships/{id}/accept/` - Aceptar solicitud
- `POST /api/v1/friendships/{id}/reject/` - Rechazar solicitud
- `DELETE /api/v1/friendships/{id}/unfriend/` - Eliminar amigo

### Logros
- `GET /api/v1/achievements/` - Todos los logros
- `GET /api/v1/user-achievements/my_achievements/` - Mis logros
- `GET /api/v1/user-achievements/all_with_progress/` - Logros con progreso
- `POST /api/v1/user-achievements/{id}/claim/` - Reclamar logro
- `POST /api/v1/user-achievements/claim_all/` - Reclamar todos

## Juegos Disponibles

### 1. Tic-Tac-Toe (Tres en Raya)
- Juego clásico 3x3 contra IA
- Sistema de turnos
- Puntuación:
  - Victoria: 5 puntos
  - Empate: 1 punto
  - Derrota: 0 puntos
- Diseño mejorado con líneas claras y símbolos personalizados

### 2. Memory (Juego de Memoria)
- 16 cartas (8 pares)
- Encuentra todas las parejas
- Puntuación: `max(1000 - (movimientos × 10) - tiempo, 100)`
- Contador de movimientos y tiempo

### 3. Minesweeper (Buscaminas)
- Tablero 8x8 con 10 minas
- Revela todas las celdas sin tocar minas
- Puntuación: `max(10000 - (tiempo × 50), 1000)`
- Sistema de banderas y revelación automática

## Sistema de XP y Niveles

### Ganar XP
- Completar juegos: cantidad configurable por juego (típicamente 10-50 XP)
- Desbloquear logros: XP variable según rareza del logro
- El XP se otorga automáticamente al enviar un puntaje

### Niveles
- Fórmula: `nivel = (XP total ÷ 1000) + 1`
- Cada 1000 XP = 1 nivel
- XP para siguiente nivel: `(nivel actual × 1000) - XP total`
- Los niveles se actualizan automáticamente

### Flujo de Actualización
1. Usuario completa juego
2. Frontend envía puntaje vía `api.submitScore(gameId, score)`
3. Backend guarda score y llama a `profile.add_xp()`
4. Backend responde con XP ganado
5. Frontend llama a `refreshUser()` para actualizar perfil
6. UI muestra nuevo nivel y XP

## Modelos de Base de Datos

### User (accounts.User)
- Extensión de AbstractUser de Django
- Campos: id (UUID), email (único), username, created_at

### UserProfile (accounts.UserProfile)
- OneToOne con User
- Campos: display_name, avatar_url, bio, current_level, total_xp, games_played
- Método `add_xp(amount)`: añade XP y actualiza nivel

### Game (games.Game)
- Campos: title, slug, description, category, xp_per_play, is_featured
- Manager personalizado con métodos `active()` y `with_scores()`

### Score (games.Score)
- ForeignKey: user, game
- Campos: score_value, metadata, is_best
- Manager con métodos `global_ranking()` y `friends_ranking()`

### Friendship (accounts.Friendship)
- ForeignKey: requester, receiver
- Status: pending, accepted, rejected, blocked

### Achievement (achievements.Achievement)
- Campos: name, description, icon_url, target_value, xp_reward, rarity
- Tipos: cumulative, milestone, streak, special

## Componentes Principales

### Frontend Components

#### GameCard
Tarjeta visual para mostrar juegos con icono, título y estadísticas.

#### LeaderboardItem
Item de ranking con posición, avatar, nombre y puntaje. Incluye medallas para top 3.

#### Avatar
Componente de avatar con soporte para imagen, iniciales y badge de nivel.

#### Button
Botón personalizable con variantes: primary, secondary, outline, ghost.

#### Card
Contenedor con sombra y padding, soporta onPress para navegación.

## Sistema de Diseño

Los estilos están centralizados en `constants/theme.ts`:

```typescript
Colors: {
  primary: { 50-950 },  // Azul
  secondary: { ... },    // Púrpura
  success: { ... },      // Verde
  error: { ... },        // Rojo
  // ...
}
FontSizes: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl }
Spacing: { 1-20 }
BorderRadius: { sm, base, md, lg, xl, full }
Shadows: { sm, base, md, lg, xl }
```

## Datos de Prueba

El comando `python manage.py create_test_data` crea:
- 8 usuarios de prueba
- 3 juegos (Tic-tac-toe, Memory, Minesweeper)
- 107 puntajes distribuidos entre usuarios
- 8 relaciones de amistad

Usuarios:
- player1@test.com / TestPass123
- player2@test.com / TestPass123
- ... hasta player8

## Notas Técnicas

### Manejo de Errores
- Backend retorna mensajes descriptivos en español
- Frontend captura y muestra errores al usuario
- Logs detallados en consola para debugging

### Autenticación
- Tokens JWT almacenados en AsyncStorage
- Refresh automático de tokens expirados
- Limpieza de tokens al logout

### Performance
- Paginación en listas grandes
- Selección de campos relacionados con `select_related()` y `prefetch_related()`
- Caché de datos del usuario en AsyncStorage

### Seguridad
- Validación de passwords con requisitos mínimos
- Protección CSRF deshabilitada para API (usa tokens JWT)
- CORS configurado para desarrollo

## Debugging

### Backend
```bash
# Ver logs del servidor
python manage.py runserver

# Acceder al shell de Django
python manage.py shell
```

### Frontend
```bash
# Ver logs detallados
npx expo start

# Limpiar caché
npx expo start -c

# Ver logs en tiempo real
# En la terminal de Expo, presiona 'j' para ver logs
```