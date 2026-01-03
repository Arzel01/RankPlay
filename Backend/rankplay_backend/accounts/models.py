"""
Módulo de Identidad y Social (El Núcleo)
Gestiona usuarios, perfiles y relaciones de amistad.
"""
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator


class User(AbstractUser):
    """
    Usuario extendido de Django.
    Rol: Autenticación y credenciales.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID Único'
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Correo Electrónico'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return self.username

    @property
    def friends(self):
        """Retorna los amigos aceptados del usuario."""
        from django.db.models import Q
        friendships = Friendship.objects.filter(
            Q(requester=self, status=Friendship.Status.ACCEPTED) |
            Q(receiver=self, status=Friendship.Status.ACCEPTED)
        )
        friend_ids = []
        for friendship in friendships:
            if friendship.requester == self:
                friend_ids.append(friendship.receiver_id)
            else:
                friend_ids.append(friendship.requester_id)
        return User.objects.filter(id__in=friend_ids)

    @property
    def pending_requests(self):
        """Retorna las solicitudes de amistad pendientes recibidas."""
        return Friendship.objects.filter(
            receiver=self,
            status=Friendship.Status.PENDING
        )

    @property
    def sent_requests(self):
        """Retorna las solicitudes de amistad enviadas pendientes."""
        return Friendship.objects.filter(
            requester=self,
            status=Friendship.Status.PENDING
        )


class UserProfile(models.Model):
    """
    Perfil público del usuario.
    Rol: Datos públicos visibles en la App Móvil.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='profile',
        verbose_name='Usuario'
    )
    display_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Nombre Visible'
    )
    avatar_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del Avatar'
    )
    bio = models.TextField(
        max_length=500,
        blank=True,
        verbose_name='Biografía'
    )
    current_level = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Nivel Actual'
    )
    total_xp = models.PositiveIntegerField(
        default=0,
        verbose_name='XP Total'
    )
    games_played = models.PositiveIntegerField(
        default=0,
        verbose_name='Partidas Jugadas'
    )
    total_playtime_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name='Tiempo Total de Juego (segundos)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'

    def __str__(self):
        return f"Perfil de {self.user.username}"

    def add_xp(self, amount):
        """Añade XP y actualiza el nivel si es necesario."""
        self.total_xp += amount
        # Fórmula de nivel: cada 1000 XP sube un nivel
        new_level = (self.total_xp // 1000) + 1
        if new_level > self.current_level:
            self.current_level = new_level
        self.save()

    @property
    def xp_for_next_level(self):
        """XP necesario para el siguiente nivel."""
        return (self.current_level * 1000) - self.total_xp


class Friendship(models.Model):
    """
    Relación de amistad entre usuarios (Relación Recursiva).
    Rol: Gestiona el grafo social.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        ACCEPTED = 'accepted', 'Aceptada'
        BLOCKED = 'blocked', 'Bloqueada'
        REJECTED = 'rejected', 'Rechazada'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    requester = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friendship_requests_sent',
        verbose_name='Solicitante'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friendship_requests_received',
        verbose_name='Receptor'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Solicitud'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        verbose_name = 'Amistad'
        verbose_name_plural = 'Amistades'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['requester', 'receiver'],
                name='unique_friendship_request'
            ),
            models.CheckConstraint(
                check=~models.Q(requester=models.F('receiver')),
                name='no_self_friendship'
            )
        ]

    def __str__(self):
        return f"{self.requester.username} -> {self.receiver.username} ({self.status})"

    def accept(self):
        """Acepta la solicitud de amistad."""
        self.status = self.Status.ACCEPTED
        self.save()

    def reject(self):
        """Rechaza la solicitud de amistad."""
        self.status = self.Status.REJECTED
        self.save()

    def block(self):
        """Bloquea al usuario."""
        self.status = self.Status.BLOCKED
        self.save()
