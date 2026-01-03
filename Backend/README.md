# RankPlay Backend 🚀

Backend API REST desarrollado con Django y Django REST Framework.

## 🏗️ Arquitectura

El proyecto sigue una arquitectura modular dividida en apps de Django:

### Apps Principales

#### 1. **accounts** - Sistema de Usuarios
Gestiona toda la autenticación e identidad de usuarios.

**Modelos:**
- `User`: Usuario extendido de Django con UUID como primary key
- `UserProfile`: Perfil público con stats (nivel, XP, avatar, bio)
- `Friendship`: Relaciones de amistad entre usuarios

**Funcionalidades:**
- Registro e inicio de sesión con JWT
- Perfiles personalizables
- Sistema de amigos con solicitudes pendientes
- Búsqueda de usuarios

#### 2. **games** - Sistema de Juegos
Catálogo de juegos, puntajes y sesiones.

**Modelos:**
- `Game`: Definición de juegos (título, categoría, XP otorgado)
- `Score`: Puntajes de usuarios en juegos
- `GameSession`: Sesiones de juego con duración

**Funcionalidades:**
- CRUD de juegos (solo lectura desde API)
- Submit de scores con ranking automático
- Rankings globales y de amigos optimizados
- Tracking de sesiones de juego

#### 3. **achievements** - Sistema de Logros
Logros desbloqueables y progreso de usuarios.

**Modelos:**
- `Achievement`: Definición de logros (nombre, tipo, objetivo, recompensa)
- `UserAchievement`: Logros desbloqueados por usuario
- `AchievementProgress`: Progreso hacia logros

**Funcionalidades:**
- Logros por juego y globales
- Sistema de rareza (común, raro, épico, legendario)
- Progreso automático basado en eventos
- Reclamar logros para obtener XP

#### 4. **api** - Endpoints REST
Expone toda la funcionalidad vía API REST.

**Archivos:**
- `views_accounts.py`: Auth, Users, Profiles, Friendships
- `views_games.py`: Games, Scores, Sessions
- `views_achievements.py`: Achievements, UserAchievements
- `serializers.py`: Todos los serializers DRF
- `urls.py`: Configuración de rutas con router

## 📊 Modelos Principales

### User & UserProfile

```python
User
├── id (UUID)
├── username (str, unique)
├── email (str, unique)
└── profile (OneToOne) →
    ├── display_name (str)
    ├── avatar_url (URL)
    ├── bio (text)
    ├── current_level (int)
    ├── total_xp (int)
    └── games_played (int)
```

**Método importante:**
```python
def add_xp(self, amount):
    """Añade XP y actualiza el nivel automáticamente."""
    self.total_xp += amount
    new_level = (self.total_xp // 1000) + 1
    if new_level > self.current_level:
        self.current_level = new_level
    self.save()
```

### Game & Score

```python
Game
├── id (UUID)
├── slug (str, unique)
├── title (str)
├── category (choice)
├── xp_per_play (int)
├── is_featured (bool)
└── scores (reverse FK) → Score
    ├── user (FK)
    ├── score_value (int)
    ├── metadata (JSON)
    └── is_best (bool)
```

**Manager personalizado:**
```python
class ScoreManager(models.Manager):
    def global_ranking(self, game, limit=100):
        """Ranking global optimizado con select_related."""
        return self.filter(game=game).select_related(
            'user__profile'
        ).order_by('-score_value')[:limit]
    
    def friends_ranking(self, user, game, limit=50):
        """Ranking entre amigos del usuario."""
        friends_ids = list(user.friends.values_list('id', flat=True)) + [user.id]
        return self.filter(
            game=game, user_id__in=friends_ids
        ).select_related('user__profile').order_by('-score_value')[:limit]
```

### Friendship

```python
Friendship
├── id (auto)
├── requester (FK User)
├── receiver (FK User)
├── status (choice: pending, accepted, rejected, blocked)
└── created_at (datetime)
```

**Estados:**
- `pending`: Solicitud enviada, esperando respuesta
- `accepted`: Amistad confirmada
- `rejected`: Solicitud rechazada
- `blocked`: Usuario bloqueado

## 🔐 Autenticación

Usa `djangorestframework-simplejwt` para tokens JWT.

### Flujo de Autenticación

1. **Registro:**
   - POST `/api/v1/auth/register/`
   - Crea User y UserProfile
   - Retorna tokens + datos del usuario

2. **Login:**
   - POST `/api/v1/auth/login/`
   - Valida credenciales
   - Retorna tokens + datos del usuario

3. **Uso:**
   - Header: `Authorization: Bearer <access_token>`
   - Token expira en 1 hora (configurable)

4. **Refresh:**
   - POST `/api/v1/token/refresh/`
   - Body: `{"refresh": "<refresh_token>"}`
   - Retorna nuevo access token

### Configuración de Tokens

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## 📡 API Endpoints Detallados

### Autenticación (`/api/v1/auth/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register/` | Registrar nuevo usuario | No |
| POST | `/login/` | Iniciar sesión | No |
| POST | `/logout/` | Cerrar sesión | Sí |
| POST | `/change_password/` | Cambiar contraseña | Sí |

**Ejemplo Registro:**
```json
POST /api/v1/auth/register/
{
  "username": "jugador1",
  "email": "jugador1@example.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "display_name": "Jugador Uno"
}
```

**Respuesta:**
```json
{
  "message": "¡Usuario registrado exitosamente!",
  "user": {
    "id": "uuid",
    "username": "jugador1",
    "email": "jugador1@example.com",
    "profile": {
      "display_name": "Jugador Uno",
      "current_level": 1,
      "total_xp": 0,
      ...
    }
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhb...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhb..."
  }
}
```

### Juegos (`/api/v1/games/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar todos los juegos | No |
| GET | `/{id}/` | Detalle de un juego | No |
| GET | `/featured/` | Juegos destacados | No |
| GET | `/popular/` | Juegos más jugados | No |
| GET | `/categories/` | Lista de categorías | No |
| GET | `/{id}/leaderboard/` | Ranking global del juego | Opcional |
| GET | `/{id}/friends_leaderboard/` | Ranking de amigos | Sí |

### Puntajes (`/api/v1/scores/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/submit/` | Enviar puntaje | Sí |
| GET | `/my_scores/` | Mis puntajes | Sí |
| GET | `/my_best/` | Mis mejores puntajes por juego | Sí |

**Ejemplo Submit Score:**
```json
POST /api/v1/scores/submit/
Authorization: Bearer <token>
{
  "game": "uuid-del-juego",
  "score_value": 1500,
  "metadata": {
    "time": 45,
    "moves": 20
  }
}
```

**Respuesta:**
```json
{
  "message": "¡Puntaje registrado!",
  "score": {
    "id": "uuid",
    "score_value": 1500,
    "is_best": true,
    ...
  },
  "rank": 12,
  "is_new_best": true,
  "xp_earned": 10
}
```

### Amigos (`/api/v1/friendships/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/friends/` | Lista de amigos | Sí |
| GET | `/pending/` | Solicitudes recibidas | Sí |
| GET | `/sent/` | Solicitudes enviadas | Sí |
| POST | `/send_request/` | Enviar solicitud | Sí |
| POST | `/{id}/accept/` | Aceptar solicitud | Sí |
| POST | `/{id}/reject/` | Rechazar solicitud | Sí |
| DELETE | `/{id}/unfriend/` | Eliminar amigo | Sí |

### Logros (`/api/v1/achievements/` y `/api/v1/user-achievements/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/achievements/` | Todos los logros | No |
| GET | `/user-achievements/my_achievements/` | Mis logros desbloqueados | Sí |
| GET | `/user-achievements/all_with_progress/` | Todos los logros + mi progreso | Sí |
| GET | `/user-achievements/unclaimed/` | Logros sin reclamar | Sí |
| POST | `/user-achievements/{id}/claim/` | Reclamar logro | Sí |
| POST | `/user-achievements/claim_all/` | Reclamar todos | Sí |
| GET | `/user-achievements/stats/` | Estadísticas de logros | Sí |

## ⚙️ Configuración

### settings.py - Principales Configuraciones

```python
# Base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'rankplay',
        'USER': 'postgres',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS - Permitir frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "exp://192.168.x.x:8081",  # Para Expo
]

# Hosts permitidos
ALLOWED_HOSTS = ['*']  # En producción usar dominio específico

# Apps instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'accounts',
    'games',
    'achievements',
    'api',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Usuario personalizado
AUTH_USER_MODEL = 'accounts.User'
```

## 🗃️ Migraciones

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ver estado de migraciones
python manage.py showmigrations

# Deshacer última migración
python manage.py migrate <app> <migration_anterior>
```

## 🌱 Seeders - Datos de Prueba

### create_test_data
Management command para poblar la BD con datos de prueba.

```bash
python manage.py create_test_data
```

**Crea:**
- 8 usuarios (player1-8@test.com, password: TestPass123)
- 3 juegos (Tic-tac-toe, Memory, Minesweeper)
- 107 puntajes aleatorios
- 8 relaciones de amistad

**Ubicación:** `api/management/commands/create_test_data.py`

## 🧪 Testing

### Probar endpoints con curl

```bash
# Registro
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@test.com", "password": "Test1234", "password_confirm": "Test1234"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "Test1234"}'

# Obtener juegos (sin auth)
curl http://localhost:8000/api/v1/games/

# Obtener perfil (con auth)
curl http://localhost:8000/api/v1/users/me/ \
  -H "Authorization: Bearer <tu_token>"
```

## 🐛 Debugging

### Django Shell

```bash
python manage.py shell
```

```python
from accounts.models import User, UserProfile
from games.models import Game, Score

# Ver todos los usuarios
User.objects.all()

# Ver perfil de un usuario
user = User.objects.get(email='test@test.com')
user.profile.total_xp
user.profile.current_level

# Ver ranking de un juego
game = Game.objects.get(slug='tic-tac-toe')
Score.objects.global_ranking(game, limit=10)

# Agregar XP a un usuario
user.profile.add_xp(500)
```

### Logs

Django muestra logs en la consola por defecto:
```
[15/Dec/2024 10:30:45] "POST /api/v1/auth/login/ HTTP/1.1" 200 1024
```

Para logs personalizados:
```python
import logging
logger = logging.getLogger(__name__)

logger.info('Usuario registrado: %s', user.username)
logger.error('Error al procesar score: %s', error)
```

## 📈 Optimizaciones

### Query Optimization

```python
# ❌ Malo - N+1 queries
scores = Score.objects.filter(game=game)
for score in scores:
    print(score.user.profile.display_name)  # Query por cada score

# ✅ Bueno - 1 query
scores = Score.objects.filter(game=game).select_related('user__profile')
for score in scores:
    print(score.user.profile.display_name)  # Sin queries adicionales
```

### Índices de Base de Datos

Definidos en los modelos:
```python
class Score(models.Model):
    # ...
    class Meta:
        indexes = [
            models.Index(fields=['game', '-score_value']),  # Para rankings
            models.Index(fields=['user', 'game']),  # Para búsquedas de usuario
        ]
```

## 📦 Dependencias Principales

```
Django==5.2.8
djangorestframework==3.15.2
djangorestframework-simplejwt==5.4.2
django-cors-headers==4.7.0
psycopg2-binary==2.9.10  # PostgreSQL
```

## 🔒 Seguridad

### Validaciones Implementadas

- **Passwords:** Mínimo 8 caracteres, debe incluir mayúsculas y números
- **Display name:** Máximo 50 caracteres, puede estar vacío
- **Bio:** Máximo 500 caracteres
- **Username:** Alfanumérico + guión bajo, mínimo 3 caracteres

### Protecciones

- CSRF deshabilitado para API (usa JWT)
- Autenticación requerida en endpoints sensibles
- Validación de ownership (usuarios solo pueden modificar sus propios datos)

## 🚀 Deployment

### Variables de Entorno

Crear `.env` para producción:
```
SECRET_KEY=tu_secret_key_segura
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

### Checklist de Deployment

- [ ] `DEBUG = False`
- [ ] Configurar `ALLOWED_HOSTS`
- [ ] Usar PostgreSQL en producción
- [ ] Configurar `STATIC_ROOT` y `MEDIA_ROOT`
- [ ] Ejecutar `python manage.py collectstatic`
- [ ] Configurar CORS correctamente
- [ ] Usar variables de entorno para secrets
- [ ] Configurar Gunicorn/uWSGI
- [ ] Configurar Nginx como reverse proxy

---

**Backend desarrollado con ❤️ usando Django**
