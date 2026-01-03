"""
Script para crear datos de prueba: usuarios, puntajes y amistades
"""
from django.contrib.auth import get_user_model
from accounts.models import UserProfile, Friendship
from games.models import Game, Score
from random import randint, choice

User = get_user_model()

# Crear usuarios de prueba
usuarios_data = [
    {'username': 'carlos_gamer', 'email': 'carlos@test.com', 'display_name': 'Carlos Pro'},
    {'username': 'maria_snake', 'email': 'maria@test.com', 'display_name': 'Maria Snake'},
    {'username': 'juan_master', 'email': 'juan@test.com', 'display_name': 'Juan Master'},
    {'username': 'sofia_puzzle', 'email': 'sofia@test.com', 'display_name': 'Sofia Puzzle'},
    {'username': 'diego_wins', 'email': 'diego@test.com', 'display_name': 'Diego Wins'},
    {'username': 'laura_pro', 'email': 'laura@test.com', 'display_name': 'Laura Pro'},
    {'username': 'pedro_gamer', 'email': 'pedro@test.com', 'display_name': 'Pedro Gamer'},
    {'username': 'ana_legend', 'email': 'ana@test.com', 'display_name': 'Ana Legend'},
]

print("=== CREANDO USUARIOS ===")
usuarios_creados = []
for data in usuarios_data:
    user, created = User.objects.get_or_create(
        username=data['username'],
        email=data['email'],
        defaults={'password': 'pbkdf2_sha256$870000$test$hash'}  # Password hasheado
    )
    if created:
        profile = user.profile
        profile.display_name = data['display_name']
        profile.total_xp = randint(100, 5000)
        profile.games_played = randint(5, 100)
        profile.save()
        print(f"✓ Creado: {user.username}")
    else:
        print(f"- Ya existe: {user.username}")
    usuarios_creados.append(user)

# Obtener juegos
print("\n=== CREANDO PUNTAJES ===")
games = list(Game.objects.all())
if not games:
    print("ERROR: No hay juegos en la BD")
else:
    for game in games:
        print(f"\nJuego: {game.title}")
        # Crear 10-15 puntajes por juego
        for _ in range(randint(10, 15)):
            user = choice(usuarios_creados)
            score_value = randint(game.min_score, min(game.max_score, 10000))
            
            Score.objects.get_or_create(
                user=user,
                game=game,
                score=score_value,
                defaults={
                    'time_played': randint(30, 600),
                    'moves_count': randint(10, 200),
                }
            )
        print(f"  ✓ {Score.objects.filter(game=game).count()} puntajes totales")

# Crear solicitudes de amistad
print("\n=== CREANDO SOLICITUDES DE AMISTAD ===")
usuario_principal = User.objects.get(username='arzel')  # Tu usuario
print(f"Usuario principal: {usuario_principal.username}")

# Crear algunas amistades aceptadas
for i in range(3):
    amigo = usuarios_creados[i]
    friendship, created = Friendship.objects.get_or_create(
        from_user=usuario_principal,
        to_user=amigo,
        defaults={'status': 'accepted'}
    )
    if created:
        print(f"  ✓ Amistad aceptada con {amigo.username}")

# Crear solicitudes pendientes (otros te enviaron)
for i in range(3, 6):
    solicitante = usuarios_creados[i]
    friendship, created = Friendship.objects.get_or_create(
        from_user=solicitante,
        to_user=usuario_principal,
        defaults={'status': 'pending'}
    )
    if created:
        print(f"  ✓ Solicitud pendiente de {solicitante.username}")

# Crear solicitudes que enviaste
for i in range(6, 8):
    destinatario = usuarios_creados[i]
    friendship, created = Friendship.objects.get_or_create(
        from_user=usuario_principal,
        to_user=destinatario,
        defaults={'status': 'pending'}
    )
    if created:
        print(f"  ✓ Solicitud enviada a {destinatario.username}")

print("\n=== RESUMEN ===")
print(f"Usuarios creados/verificados: {len(usuarios_creados)}")
print(f"Total de puntajes: {Score.objects.count()}")
print(f"Amistades del usuario principal: {Friendship.objects.filter(from_user=usuario_principal, status='accepted').count()}")
print(f"Solicitudes pendientes recibidas: {Friendship.objects.filter(to_user=usuario_principal, status='pending').count()}")
print(f"Solicitudes pendientes enviadas: {Friendship.objects.filter(from_user=usuario_principal, status='pending').count()}")

print("\n✓ DATOS CREADOS EXITOSAMENTE")
