"""
URLs para la API de RankPlay.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuthViewSet, UserViewSet, ProfileViewSet, FriendshipViewSet,
    GameViewSet, ScoreViewSet, GameSessionViewSet,
    AchievementViewSet, UserAchievementViewSet, AchievementProgressViewSet
)

router = DefaultRouter()

# Rutas de autenticación y usuarios
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='users')
router.register(r'profiles', ProfileViewSet, basename='profiles')
router.register(r'friendships', FriendshipViewSet, basename='friendships')

# Rutas de juegos y puntajes
router.register(r'games', GameViewSet, basename='games')
router.register(r'scores', ScoreViewSet, basename='scores')
router.register(r'sessions', GameSessionViewSet, basename='sessions')

# Rutas de logros
router.register(r'achievements', AchievementViewSet, basename='achievements')
router.register(r'user-achievements', UserAchievementViewSet, basename='user-achievements')
router.register(r'achievement-progress', AchievementProgressViewSet, basename='achievement-progress')

urlpatterns = [
    path('', include(router.urls)),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
