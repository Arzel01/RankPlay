"""
Señales para crear automáticamente el perfil cuando se crea un usuario.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crea el perfil automáticamente al crear un usuario."""
    if created:
        UserProfile.objects.create(
            user=instance,
            display_name=instance.username
        )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Guarda el perfil cuando se guarda el usuario."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
