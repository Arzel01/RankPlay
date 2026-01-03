# 🚀 Guía de Despliegue a Railway - RankPlay Backend

## 📋 Pre-requisitos
- Cuenta en [Railway](https://railway.app) (puedes usar GitHub para login)
- Git instalado en tu computadora
- Tu código en un repositorio de GitHub

---

## 📁 Paso 1: Preparar tu Repositorio

Si aún no tienes tu proyecto en GitHub:

```bash
cd c:\Users\Adrian\Desktop\RankPlay\Backend\rankplay_backend

# Inicializar git (si no lo has hecho)
git init

# Crear .gitignore
# (ya debería existir, pero asegúrate de que tenga lo siguiente)
```

### Contenido recomendado para `.gitignore`:
```
*.pyc
__pycache__/
db.sqlite3
.env
*.env
venv/
.vscode/
staticfiles/
media/
*.log
```

```bash
# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - RankPlay Backend"

# Conectar con GitHub (crea el repo en GitHub primero)
git remote add origin https://github.com/TU_USUARIO/rankplay-backend.git
git branch -M main
git push -u origin main
```

---

## 🚂 Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tus repositorios
5. Selecciona tu repositorio `rankplay-backend`

---

## 🐘 Paso 3: Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se conectará automáticamente

---

## ⚙️ Paso 4: Configurar Variables de Entorno

En Railway, ve a tu servicio → **"Variables"** y agrega:

| Variable | Valor |
|----------|-------|
| `DJANGO_SECRET_KEY` | `genera-una-clave-secreta-larga-y-aleatoria` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `*.railway.app,*.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `*` |

### Para generar una SECRET_KEY segura:
```python
# Ejecuta esto en Python
import secrets
print(secrets.token_urlsafe(50))
```

---

## 🔧 Paso 5: Configurar el Root Directory

Railway detectará automáticamente que es un proyecto Django, pero necesitas especificar el directorio raíz:

1. Ve a **Settings** de tu servicio
2. En **"Root Directory"** pon: `Backend/rankplay_backend` (si subiste todo el proyecto RankPlay)
   - O dejalo vacío si solo subiste la carpeta `rankplay_backend`

---

## 🚀 Paso 6: Desplegar

1. Railway desplegará automáticamente cuando detecte cambios en GitHub
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. Una vez completado, obtendrás una URL como: `https://rankplay-backend-production.up.railway.app`

---

## 📱 Paso 7: Actualizar la URL en el Frontend

Una vez que tengas tu URL de Railway, actualiza el archivo `services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.100.23:8000/api/v1'  // Desarrollo local
  : 'https://TU-APP.up.railway.app/api/v1';  // Tu URL real de Railway
```

---

## 🎮 Paso 8: Inicializar Datos en Producción

Después del deploy, necesitas crear los juegos. Ve a Railway → tu servicio → **"Shell"** y ejecuta:

```bash
python manage.py shell
```

Luego pega este código:

```python
from games.models import Game

games_data = [
    {
        'name': 'Tres en Raya',
        'slug': 'tic-tac-toe',
        'description': 'El clásico juego de tres en raya contra la IA.',
        'instructions': 'Coloca tres marcas en línea para ganar.',
        'difficulty': 'easy',
        'min_players': 1,
        'max_players': 1,
        'xp_per_play': 5,
        'is_active': True
    },
    {
        'name': 'Memory',
        'slug': 'memory',
        'description': 'Encuentra los pares de cartas iguales.',
        'instructions': 'Voltea las cartas y encuentra los pares.',
        'difficulty': 'medium',
        'min_players': 1,
        'max_players': 1,
        'xp_per_play': 20,
        'is_active': True
    },
    {
        'name': 'Buscaminas',
        'slug': 'minesweeper',
        'description': 'El clásico juego de buscaminas.',
        'instructions': 'Revela todas las casillas sin tocar una mina.',
        'difficulty': 'hard',
        'min_players': 1,
        'max_players': 1,
        'xp_per_play': 10,
        'is_active': True
    },
]

for game_data in games_data:
    game, created = Game.objects.get_or_create(
        slug=game_data['slug'],
        defaults=game_data
    )
    status = 'Creado' if created else 'Ya existía'
    print(f"{game.name}: {status}")

print("¡Juegos inicializados!")
```

---

## 📦 Paso 9: Exportar APK

Una vez el backend esté funcionando en Railway:

### Opción A: Build de Desarrollo (más rápido)
```bash
cd c:\Users\Adrian\Desktop\RankPlay\Frontend\rankplay-mobile

# Instalar EAS CLI si no lo tienes
npm install -g eas-cli

# Login en Expo
eas login

# Build APK de desarrollo
eas build -p android --profile preview
```

### Opción B: Build de Producción
```bash
# Build APK de producción
eas build -p android --profile production
```

### Configuración EAS (si no tienes eas.json):
Crea el archivo `eas.json` en la raíz del proyecto frontend:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## ✅ Verificación Final

1. **Backend**: Visita `https://TU-APP.up.railway.app/api/v1/games/` - debería mostrar los juegos
2. **APK**: Instala el APK en tu teléfono Android
3. **Test**: Regístrate, juega un juego y verifica que el puntaje se guarde

---

## 🔧 Troubleshooting

### Error: "No module named 'X'"
```bash
# En Railway Shell
pip install nombre-del-modulo
```

### Error de CORS
Asegúrate de que `CORS_ALLOWED_ORIGINS` incluya tu dominio o usa `CORS_ALLOW_ALL_ORIGINS=True` temporalmente.

### Base de datos vacía
Ejecuta las migraciones manualmente:
```bash
python manage.py migrate
```

### Archivos estáticos no cargan
```bash
python manage.py collectstatic --noinput
```

---

## 📞 URLs Útiles de tu API

- **Admin**: `https://TU-APP.up.railway.app/admin/`
- **API Root**: `https://TU-APP.up.railway.app/api/v1/`
- **Games**: `https://TU-APP.up.railway.app/api/v1/games/`
- **Rankings**: `https://TU-APP.up.railway.app/api/v1/rankings/`

---

¡Listo! Tu backend estará corriendo en la nube y podrás usar tu APK desde cualquier lugar. 🎮
