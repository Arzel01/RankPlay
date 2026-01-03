"""
Comando para poblar la base de datos con datos iniciales.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from games.models import Game
from achievements.models import Achievement

User = get_user_model()


class Command(BaseCommand):
    help = 'Pobla la base de datos con juegos y logros iniciales'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos iniciales...')
        
        # Crear juegos
        games_data = [
            {
                'slug': 'color-match',
                'title': 'Color Match',
                'description': 'Combina colores lo más rápido posible. ¡Pon a prueba tu velocidad visual!',
                'instructions': 'Toca el color que coincide con el texto mostrado. ¡Cuidado! El color del texto puede confundirte.',
                'category': Game.Category.PUZZLE,
                'xp_per_play': 15,
                'is_featured': True,
            },
            {
                'slug': 'tap-frenzy',
                'title': 'Tap Frenzy',
                'description': '¡Toca la pantalla lo más rápido que puedas en 30 segundos!',
                'instructions': 'Simplemente toca la pantalla tantas veces como puedas antes de que se acabe el tiempo.',
                'category': Game.Category.ARCADE,
                'xp_per_play': 10,
                'is_featured': True,
            },
            {
                'slug': 'memory-cards',
                'title': 'Memory Cards',
                'description': 'El clásico juego de memoria. Encuentra todos los pares de cartas.',
                'instructions': 'Voltea dos cartas por turno. Si coinciden, permanecen visibles. Encuentra todos los pares.',
                'category': Game.Category.PUZZLE,
                'xp_per_play': 20,
                'is_featured': True,
            },
            {
                'slug': 'quick-math',
                'title': 'Quick Math',
                'description': 'Resuelve operaciones matemáticas contra el reloj.',
                'instructions': 'Responde correctamente el mayor número de operaciones en 60 segundos.',
                'category': Game.Category.PUZZLE,
                'xp_per_play': 25,
            },
            {
                'slug': 'snake-classic',
                'title': 'Snake Classic',
                'description': 'El clásico juego de la serpiente. Come y crece sin chocar.',
                'instructions': 'Desliza para mover la serpiente. Come la comida para crecer y ganar puntos.',
                'category': Game.Category.ARCADE,
                'xp_per_play': 15,
                'is_featured': True,
            },
            {
                'slug': 'block-breaker',
                'title': 'Block Breaker',
                'description': 'Destruye todos los bloques con la pelota rebotante.',
                'instructions': 'Mueve la paleta para mantener la pelota en juego. Destruye todos los bloques para ganar.',
                'category': Game.Category.ARCADE,
                'xp_per_play': 15,
            },
            {
                'slug': 'word-scramble',
                'title': 'Word Scramble',
                'description': 'Descifra las palabras mezcladas antes de que se acabe el tiempo.',
                'instructions': 'Ordena las letras para formar la palabra correcta. Entre más rápido, más puntos.',
                'category': Game.Category.PUZZLE,
                'xp_per_play': 20,
            },
            {
                'slug': 'reaction-test',
                'title': 'Reaction Test',
                'description': 'Mide tu tiempo de reacción. ¿Qué tan rápido eres?',
                'instructions': 'Espera a que la pantalla cambie de color y toca lo más rápido posible.',
                'category': Game.Category.CASUAL,
                'xp_per_play': 10,
            },
        ]

        for game_data in games_data:
            game, created = Game.objects.get_or_create(
                slug=game_data['slug'],
                defaults=game_data
            )
            if created:
                self.stdout.write(f'  ✓ Juego creado: {game.title}')
            else:
                self.stdout.write(f'  - Juego existente: {game.title}')

        # Crear logros globales
        global_achievements = [
            {
                'name': 'Primer Paso',
                'description': 'Juega tu primera partida',
                'achievement_type': Achievement.AchievementType.FIRST_GAME,
                'target_value': 1,
                'xp_reward': 50,
                'rarity': Achievement.Rarity.COMMON,
            },
            {
                'name': 'Jugador Dedicado',
                'description': 'Juega 10 partidas',
                'achievement_type': Achievement.AchievementType.GAMES_PLAYED,
                'target_value': 10,
                'xp_reward': 100,
                'rarity': Achievement.Rarity.COMMON,
            },
            {
                'name': 'Veterano',
                'description': 'Juega 100 partidas',
                'achievement_type': Achievement.AchievementType.GAMES_PLAYED,
                'target_value': 100,
                'xp_reward': 500,
                'rarity': Achievement.Rarity.RARE,
            },
            {
                'name': 'Leyenda',
                'description': 'Juega 1000 partidas',
                'achievement_type': Achievement.AchievementType.GAMES_PLAYED,
                'target_value': 1000,
                'xp_reward': 2000,
                'rarity': Achievement.Rarity.LEGENDARY,
            },
            {
                'name': 'Social Butterfly',
                'description': 'Añade 5 amigos',
                'achievement_type': Achievement.AchievementType.FRIENDS_ADDED,
                'target_value': 5,
                'xp_reward': 150,
                'rarity': Achievement.Rarity.UNCOMMON,
            },
            {
                'name': 'Popular',
                'description': 'Añade 25 amigos',
                'achievement_type': Achievement.AchievementType.FRIENDS_ADDED,
                'target_value': 25,
                'xp_reward': 500,
                'rarity': Achievement.Rarity.RARE,
            },
            {
                'name': 'Nivel 5',
                'description': 'Alcanza el nivel 5',
                'achievement_type': Achievement.AchievementType.LEVEL_REACHED,
                'target_value': 5,
                'xp_reward': 200,
                'rarity': Achievement.Rarity.COMMON,
            },
            {
                'name': 'Nivel 10',
                'description': 'Alcanza el nivel 10',
                'achievement_type': Achievement.AchievementType.LEVEL_REACHED,
                'target_value': 10,
                'xp_reward': 500,
                'rarity': Achievement.Rarity.UNCOMMON,
            },
            {
                'name': 'Nivel 25',
                'description': 'Alcanza el nivel 25',
                'achievement_type': Achievement.AchievementType.LEVEL_REACHED,
                'target_value': 25,
                'xp_reward': 1000,
                'rarity': Achievement.Rarity.RARE,
            },
            {
                'name': 'Nivel 50',
                'description': 'Alcanza el nivel 50',
                'achievement_type': Achievement.AchievementType.LEVEL_REACHED,
                'target_value': 50,
                'xp_reward': 2500,
                'rarity': Achievement.Rarity.EPIC,
            },
            {
                'name': 'Coleccionista de XP',
                'description': 'Acumula 10,000 XP',
                'achievement_type': Achievement.AchievementType.TOTAL_XP,
                'target_value': 10000,
                'xp_reward': 500,
                'rarity': Achievement.Rarity.UNCOMMON,
            },
            {
                'name': 'Adicto',
                'description': 'Juega por 10 horas en total',
                'achievement_type': Achievement.AchievementType.TIME_PLAYED,
                'target_value': 36000,  # segundos
                'xp_reward': 750,
                'rarity': Achievement.Rarity.RARE,
            },
        ]

        for i, ach_data in enumerate(global_achievements):
            ach_data['order'] = i
            ach, created = Achievement.objects.get_or_create(
                name=ach_data['name'],
                game=None,
                defaults=ach_data
            )
            if created:
                self.stdout.write(f'  ✓ Logro global creado: {ach.name}')
            else:
                self.stdout.write(f'  - Logro existente: {ach.name}')

        # Crear logros específicos por juego
        for game in Game.objects.all():
            game_achievements = [
                {
                    'game': game,
                    'name': f'Novato en {game.title}',
                    'description': f'Juega 5 partidas de {game.title}',
                    'achievement_type': Achievement.AchievementType.GAMES_PLAYED,
                    'target_value': 5,
                    'xp_reward': 75,
                    'rarity': Achievement.Rarity.COMMON,
                    'order': 0,
                },
                {
                    'game': game,
                    'name': f'Experto en {game.title}',
                    'description': f'Juega 50 partidas de {game.title}',
                    'achievement_type': Achievement.AchievementType.GAMES_PLAYED,
                    'target_value': 50,
                    'xp_reward': 300,
                    'rarity': Achievement.Rarity.UNCOMMON,
                    'order': 1,
                },
                {
                    'game': game,
                    'name': f'Maestro de {game.title}',
                    'description': f'Alcanza 1000 puntos en {game.title}',
                    'achievement_type': Achievement.AchievementType.SCORE_REACHED,
                    'target_value': 1000,
                    'xp_reward': 200,
                    'rarity': Achievement.Rarity.UNCOMMON,
                    'order': 2,
                },
                {
                    'game': game,
                    'name': f'Leyenda de {game.title}',
                    'description': f'Alcanza 5000 puntos en {game.title}',
                    'achievement_type': Achievement.AchievementType.SCORE_REACHED,
                    'target_value': 5000,
                    'xp_reward': 750,
                    'rarity': Achievement.Rarity.EPIC,
                    'order': 3,
                },
            ]

            for ach_data in game_achievements:
                ach, created = Achievement.objects.get_or_create(
                    name=ach_data['name'],
                    game=game,
                    defaults=ach_data
                )
                if created:
                    self.stdout.write(f'  ✓ Logro creado: {ach.name}')

        self.stdout.write(self.style.SUCCESS('\n¡Datos iniciales creados exitosamente!'))
        self.stdout.write(f'  Total juegos: {Game.objects.count()}')
        self.stdout.write(f'  Total logros: {Achievement.objects.count()}')
