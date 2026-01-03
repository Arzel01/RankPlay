"""
Views principales de la API combinando todos los módulos.
"""
from .views_accounts import AuthViewSet, UserViewSet, ProfileViewSet, FriendshipViewSet
from .views_games import GameViewSet, ScoreViewSet, GameSessionViewSet
from .views_achievements import AchievementViewSet, UserAchievementViewSet, AchievementProgressViewSet

__all__ = [
    'AuthViewSet',
    'UserViewSet', 
    'ProfileViewSet',
    'FriendshipViewSet',
    'GameViewSet',
    'ScoreViewSet',
    'GameSessionViewSet',
    'AchievementViewSet',
    'UserAchievementViewSet',
    'AchievementProgressViewSet',
]
