"""
Módulo de Gamificación (Retención)
Sistema de logros para mantener el engagement de los usuarios.
"""
import uuid
from django.db import models
from django.conf import settings


class Achievement(models.Model):
    """
    Definición de logros.
    Rol: Definir los logros disponibles (ej: "Juega 10 partidas").
    """
    class AchievementType(models.TextChoices):
        GAMES_PLAYED = 'games_played', 'Partidas Jugadas'
        SCORE_REACHED = 'score_reached', 'Puntaje Alcanzado'
        LEVEL_REACHED = 'level_reached', 'Nivel Alcanzado'
        FRIENDS_ADDED = 'friends_added', 'Amigos Añadidos'
        CONSECUTIVE_DAYS = 'consecutive_days', 'Días Consecutivos'
        FIRST_GAME = 'first_game', 'Primer Juego'
        TOTAL_XP = 'total_xp', 'XP Total'
        TIME_PLAYED = 'time_played', 'Tiempo Jugado'

    class Rarity(models.TextChoices):
        COMMON = 'common', 'Común'
        UNCOMMON = 'uncommon', 'Poco Común'
        RARE = 'rare', 'Raro'
        EPIC = 'epic', 'Épico'
        LEGENDARY = 'legendary', 'Legendario'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    game = models.ForeignKey(
        'games.Game',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='achievements',
        verbose_name='Juego',
        help_text='Dejar vacío para logros globales'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    description = models.TextField(
        verbose_name='Descripción'
    )
    icon_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del Icono'
    )
    achievement_type = models.CharField(
        max_length=30,
        choices=AchievementType.choices,
        default=AchievementType.GAMES_PLAYED,
        verbose_name='Tipo de Logro'
    )
    target_value = models.PositiveIntegerField(
        default=1,
        verbose_name='Valor Objetivo',
        help_text='Valor que debe alcanzarse para desbloquear el logro'
    )
    xp_reward = models.PositiveIntegerField(
        default=50,
        verbose_name='Recompensa XP'
    )
    rarity = models.CharField(
        max_length=20,
        choices=Rarity.choices,
        default=Rarity.COMMON,
        verbose_name='Rareza'
    )
    is_hidden = models.BooleanField(
        default=False,
        verbose_name='Logro Oculto',
        help_text='Los logros ocultos no se muestran hasta ser desbloqueados'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    class Meta:
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'
        ordering = ['order', 'rarity', 'name']

    def __str__(self):
        game_name = self.game.title if self.game else 'Global'
        return f"{self.name} ({game_name})"


class UserAchievement(models.Model):
    """
    Registro de logros desbloqueados por usuarios.
    Rol: Conectar usuarios con los logros que han conseguido.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name='Usuario'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='unlocked_by',
        verbose_name='Logro'
    )
    unlocked_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Desbloqueo'
    )
    progress = models.PositiveIntegerField(
        default=0,
        verbose_name='Progreso Actual'
    )
    is_claimed = models.BooleanField(
        default=False,
        verbose_name='Recompensa Reclamada'
    )

    class Meta:
        verbose_name = 'Logro de Usuario'
        verbose_name_plural = 'Logros de Usuario'
        ordering = ['-unlocked_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'achievement'],
                name='unique_user_achievement'
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"

    def claim_reward(self):
        """Reclamar la recompensa de XP del logro."""
        if not self.is_claimed:
            self.is_claimed = True
            self.save()
            
            # Añadir XP al perfil del usuario
            if hasattr(self.user, 'profile'):
                self.user.profile.add_xp(self.achievement.xp_reward)
            
            return True
        return False


class AchievementProgress(models.Model):
    """
    Seguimiento del progreso hacia logros no desbloqueados.
    Rol: Permitir mostrar barras de progreso en la UI.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievement_progress',
        verbose_name='Usuario'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='progress_tracking',
        verbose_name='Logro'
    )
    current_value = models.PositiveIntegerField(
        default=0,
        verbose_name='Valor Actual'
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        verbose_name = 'Progreso de Logro'
        verbose_name_plural = 'Progresos de Logros'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'achievement'],
                name='unique_achievement_progress'
            )
        ]

    def __str__(self):
        percentage = (self.current_value / self.achievement.target_value) * 100
        return f"{self.user.username} - {self.achievement.name}: {percentage:.1f}%"

    @property
    def percentage(self):
        """Porcentaje de progreso."""
        if self.achievement.target_value == 0:
            return 100
        return min((self.current_value / self.achievement.target_value) * 100, 100)

    @property
    def is_complete(self):
        """Verifica si el logro está completo."""
        return self.current_value >= self.achievement.target_value

    def increment(self, amount=1):
        """Incrementa el progreso y verifica si se completó el logro."""
        self.current_value += amount
        self.save()

        if self.is_complete:
            # Crear el UserAchievement si no existe
            UserAchievement.objects.get_or_create(
                user=self.user,
                achievement=self.achievement,
                defaults={'progress': self.current_value}
            )
            return True
        return False
