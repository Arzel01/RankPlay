from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Friendship
from games.models import Game, Score
from random import randint, choice

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea datos de prueba: usuarios, puntajes y amistades'

    def handle(self, *args, **options):
        # Crear usuarios de prueba
        usuarios_data = [
            {'username': 'carlos_gamer', 'email': 'carlos@test.com', 'display_name': 'Carlos Pro'},
            {'username': 'maria_games', 'email': 'maria@test.com', 'display_name': 'Maria Games'},
            {'username': 'juan_master', 'email': 'juan@test.com', 'display_name': 'Juan Master'},
            {'username': 'sofia_puzzle', 'email': 'sofia@test.com', 'display_name': 'Sofia Puzzle'},
            {'username': 'diego_wins', 'email': 'diego@test.com', 'display_name': 'Diego Wins'},
            {'username': 'laura_pro', 'email': 'laura@test.com', 'display_name': 'Laura Pro'},
            {'username': 'pedro_gamer', 'email': 'pedro@test.com', 'display_name': 'Pedro Gamer'},
            {'username': 'ana_legend', 'email': 'ana@test.com', 'display_name': 'Ana Legend'},
        ]

        self.stdout.write("=== CREANDO USUARIOS ===")
        usuarios_creados = []
        for data in usuarios_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                profile = user.profile
                profile.display_name = data['display_name']
                profile.total_xp = randint(100, 5000)
                profile.games_played = randint(5, 100)
                profile.save()
                self.stdout.write(self.style.SUCCESS(f"✓ Creado: {user.username}"))
            else:
                self.stdout.write(f"- Ya existe: {user.username}")
            usuarios_creados.append(user)

        # Obtener juegos
        self.stdout.write("\n=== CREANDO PUNTAJES ===")
        games = list(Game.objects.all())
        if not games:
            self.stdout.write(self.style.ERROR("ERROR: No hay juegos en la BD"))
        else:
            for game in games:
                self.stdout.write(f"\nJuego: {game.title}")
                # Crear 10-15 puntajes por juego
                for _ in range(randint(10, 15)):
                    user = choice(usuarios_creados)
                    score_value = randint(game.min_score, min(game.max_score, 10000))
                    
                    Score.objects.create(
                        user=user,
                        game=game,
                        score_value=score_value,
                        metadata={
                            'time_played': randint(30, 600),
                            'moves': randint(10, 200),
                        }
                    )
                count = Score.objects.filter(game=game).count()
                self.stdout.write(self.style.SUCCESS(f"  ✓ {count} puntajes totales"))

        # Crear solicitudes de amistad
        self.stdout.write("\n=== CREANDO SOLICITUDES DE AMISTAD ===")
        try:
            usuario_principal = User.objects.get(username='arzel')
            self.stdout.write(f"Usuario principal: {usuario_principal.username}")

            # Crear algunas amistades aceptadas
            for i in range(3):
                amigo = usuarios_creados[i]
                friendship, created = Friendship.objects.get_or_create(
                    requester=usuario_principal,
                    receiver=amigo,
                    defaults={'status': 'accepted'}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Amistad aceptada con {amigo.username}"))

            # Crear solicitudes pendientes (otros te enviaron)
            for i in range(3, 6):
                solicitante = usuarios_creados[i]
                friendship, created = Friendship.objects.get_or_create(
                    requester=solicitante,
                    receiver=usuario_principal,
                    defaults={'status': 'pending'}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Solicitud pendiente de {solicitante.username}"))

            # Crear solicitudes que enviaste
            for i in range(6, min(8, len(usuarios_creados))):
                destinatario = usuarios_creados[i]
                friendship, created = Friendship.objects.get_or_create(
                    requester=usuario_principal,
                    receiver=destinatario,
                    defaults={'status': 'pending'}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Solicitud enviada a {destinatario.username}"))

        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("Usuario 'arzel' no encontrado, saltando amistades"))

        self.stdout.write("\n=== RESUMEN ===")
        self.stdout.write(f"Usuarios creados/verificados: {len(usuarios_creados)}")
        self.stdout.write(f"Total de puntajes: {Score.objects.count()}")
        
        try:
            usuario_principal = User.objects.get(username='arzel')
            amigos = Friendship.objects.filter(requester=usuario_principal, status='accepted').count()
            pendientes_recibidas = Friendship.objects.filter(receiver=usuario_principal, status='pending').count()
            pendientes_enviadas = Friendship.objects.filter(requester=usuario_principal, status='pending').count()
            self.stdout.write(f"Amistades del usuario principal: {amigos}")
            self.stdout.write(f"Solicitudes pendientes recibidas: {pendientes_recibidas}")
            self.stdout.write(f"Solicitudes pendientes enviadas: {pendientes_enviadas}")
        except:
            pass

        self.stdout.write(self.style.SUCCESS("\n✓ DATOS CREADOS EXITOSAMENTE"))
