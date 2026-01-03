"""
Módulo de Gameplay (El Contenido)
Gestiona juegos, puntajes y sesiones de juego.
"""
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class GameManager(models.Manager):
    """Manager personalizado para consultas de juegos."""
    
    def active(self):
        """Retorna solo los juegos activos."""
        return self.filter(is_active=True)

    def with_scores(self):
        """Retorna juegos con sus puntajes relacionados."""
        return self.prefetch_related('scores')


class Game(models.Model):
    """
    Catálogo de minijuegos.
    Rol: Definir los juegos disponibles en la plataforma.
    """
    class Category(models.TextChoices):
        ARCADE = 'arcade', 'Arcade'
        PUZZLE = 'puzzle', 'Puzzle'
        ACTION = 'action', 'Acción'
        STRATEGY = 'strategy', 'Estrategia'
        CASUAL = 'casual', 'Casual'
        SPORTS = 'sports', 'Deportes'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    slug = models.SlugField(
        unique=True,
        max_length=100,
        verbose_name='Identificador URL'
    )
    title = models.CharField(
        max_length=100,
        verbose_name='Título'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    instructions = models.TextField(
        blank=True,
        verbose_name='Instrucciones de Juego'
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.CASUAL,
        verbose_name='Categoría'
    )
    icon_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del Icono'
    )
    banner_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del Banner'
    )
    bundle_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del Bundle (para descarga)'
    )
    min_score = models.IntegerField(
        default=0,
        verbose_name='Puntaje Mínimo'
    )
    max_score = models.IntegerField(
        default=999999,
        verbose_name='Puntaje Máximo'
    )
    xp_per_play = models.PositiveIntegerField(
        default=10,
        verbose_name='XP por Partida'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name='Destacado'
    )
    play_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Veces Jugado'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    objects = GameManager()

    class Meta:
        verbose_name = 'Juego'
        verbose_name_plural = 'Juegos'
        ordering = ['-is_featured', '-play_count', 'title']

    def __str__(self):
        return self.title

    def increment_play_count(self):
        """Incrementa el contador de partidas."""
        self.play_count += 1
        self.save(update_fields=['play_count'])


class ScoreManager(models.Manager):
    """Manager personalizado para consultas optimizadas de rankings."""

    def global_ranking(self, game, limit=100):
        """
        Ranking global de un juego.
        Optimizado con índices para ordenamiento rápido.
        """
        return self.filter(
            game=game
        ).select_related('user__profile').order_by('-score_value')[:limit]

    def friends_ranking(self, user, game, limit=50):
        """
        Ranking de amigos para un juego específico.
        Consulta optimizada usando el ORM de Django.
        """
        friends_ids = user.friends.values_list('id', flat=True)
        # Incluir al usuario actual en el ranking
        all_ids = list(friends_ids) + [user.id]
        
        return self.filter(
            game=game,
            user__id__in=all_ids
        ).select_related('user__profile').order_by('-score_value')[:limit]

    def user_best_scores(self, user, limit=10):
        """Mejores puntajes de un usuario en todos los juegos."""
        return self.filter(
            user=user
        ).select_related('game').order_by('-score_value')[:limit]

    def user_game_history(self, user, game, limit=20):
        """Historial de puntajes de un usuario en un juego."""
        return self.filter(
            user=user,
            game=game
        ).order_by('-created_at')[:limit]


class Score(models.Model):
    """
    Historial de puntajes.
    Rol: Registrar los resultados de las partidas.
    
    Nota: El campo metadata (JSONB en PostgreSQL) permite guardar
    detalles específicos del juego sin cambiar la estructura.
    """
    id = models.BigAutoField(
        primary_key=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scores',
        verbose_name='Usuario'
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name='scores',
        verbose_name='Juego'
    )
    score_value = models.IntegerField(
        validators=[MinValueValidator(0)],
        db_index=True,  # CRÍTICO: Índice para ordenamiento rápido
        verbose_name='Puntaje'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos',
        help_text='Datos adicionales específicos del juego (ej: personaje usado, tiempo, etc.)'
    )
    is_best = models.BooleanField(
        default=False,
        verbose_name='Es Mejor Puntaje',
        help_text='Indica si es el mejor puntaje del usuario en este juego'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de Registro'
    )

    objects = ScoreManager()

    class Meta:
        verbose_name = 'Puntaje'
        verbose_name_plural = 'Puntajes'
        ordering = ['-score_value', '-created_at']
        indexes = [
            models.Index(fields=['game', '-score_value']),
            models.Index(fields=['user', 'game', '-score_value']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.game.title}: {self.score_value}"

    def save(self, *args, **kwargs):
        """Al guardar, verificar si es el mejor puntaje del usuario."""
        super().save(*args, **kwargs)
        self._update_best_score()

    def _update_best_score(self):
        """Actualiza el flag is_best para el usuario en este juego."""
        best_score = Score.objects.filter(
            user=self.user,
            game=self.game
        ).order_by('-score_value').first()

        if best_score:
            # Resetear todos los is_best del usuario en este juego
            Score.objects.filter(
                user=self.user,
                game=self.game,
                is_best=True
            ).exclude(id=best_score.id).update(is_best=False)
            
            # Marcar el mejor puntaje
            if best_score.id == self.id and not self.is_best:
                Score.objects.filter(id=self.id).update(is_best=True)


class GameSession(models.Model):
    """
    Sesiones de juego para analítica.
    Rol: Auditoría - Saber cuánto juegan los usuarios.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='game_sessions',
        verbose_name='Usuario'
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='Juego'
    )
    score = models.ForeignKey(
        Score,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='session',
        verbose_name='Puntaje Asociado'
    )
    start_time = models.DateTimeField(
        verbose_name='Hora de Inicio'
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Hora de Fin'
    )
    duration_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name='Duración (segundos)'
    )
    is_completed = models.BooleanField(
        default=False,
        verbose_name='Sesión Completada'
    )
    device_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Información del Dispositivo'
    )

    class Meta:
        verbose_name = 'Sesión de Juego'
        verbose_name_plural = 'Sesiones de Juego'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['user', '-start_time']),
            models.Index(fields=['game', '-start_time']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.game.title} ({self.start_time})"

    def end_session(self, end_time=None):
        """Finaliza la sesión y calcula la duración."""
        from django.utils import timezone
        self.end_time = end_time or timezone.now()
        self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        self.is_completed = True
        self.save()

        # Actualizar tiempo total de juego del usuario
        if hasattr(self.user, 'profile'):
            self.user.profile.total_playtime_seconds += self.duration_seconds
            self.user.profile.games_played += 1
            self.user.profile.save()
