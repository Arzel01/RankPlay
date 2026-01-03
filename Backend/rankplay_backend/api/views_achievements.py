"""
Views para la API de RankPlay - Módulo de Logros.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count

from achievements.models import Achievement, UserAchievement, AchievementProgress
from .serializers import (
    AchievementSerializer, UserAchievementSerializer, AchievementProgressSerializer
)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logros (solo lectura)."""
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Achievement.objects.filter(is_active=True)
        
        # Filtros opcionales
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        elif self.request.query_params.get('global') == 'true':
            queryset = queryset.filter(game__isnull=True)
        
        rarity = self.request.query_params.get('rarity')
        if rarity:
            queryset = queryset.filter(rarity=rarity)
        
        # Ocultar logros hidden si el usuario no está autenticado
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_hidden=False)
        
        return queryset.select_related('game')

    @action(detail=False, methods=['get'])
    def global_achievements(self, request):
        """Obtener logros globales (no asociados a un juego)."""
        achievements = Achievement.objects.filter(
            is_active=True,
            game__isnull=True
        )
        
        if not request.user.is_authenticated:
            achievements = achievements.filter(is_hidden=False)
        
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_rarity(self, request):
        """Obtener logros agrupados por rareza."""
        result = {}
        for rarity_value, rarity_label in Achievement.Rarity.choices:
            achievements = Achievement.objects.filter(
                is_active=True,
                rarity=rarity_value
            )
            if not request.user.is_authenticated:
                achievements = achievements.filter(is_hidden=False)
            
            result[rarity_value] = {
                'label': rarity_label,
                'achievements': AchievementSerializer(achievements, many=True).data
            }
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas generales de logros."""
        total = Achievement.objects.filter(is_active=True).count()
        by_rarity = Achievement.objects.filter(is_active=True).values('rarity').annotate(
            count=Count('id')
        )
        
        rarity_stats = {item['rarity']: item['count'] for item in by_rarity}
        
        return Response({
            'total_achievements': total,
            'by_rarity': rarity_stats
        })


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logros del usuario."""
    queryset = UserAchievement.objects.all()
    serializer_class = UserAchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAchievement.objects.filter(
            user=self.request.user
        ).select_related('achievement__game').order_by('-unlocked_at')

    @action(detail=False, methods=['get'])
    def my_achievements(self, request):
        """Obtener todos mis logros desbloqueados."""
        game_id = request.query_params.get('game')
        
        queryset = UserAchievement.objects.filter(user=request.user)
        if game_id:
            queryset = queryset.filter(achievement__game_id=game_id)
        
        queryset = queryset.select_related('achievement__game').order_by('-unlocked_at')
        serializer = UserAchievementSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def all_with_progress(self, request):
        """Obtener todos los logros con progreso del usuario."""
        game_id = request.query_params.get('game')
        
        # Obtener todos los logros disponibles
        all_achievements = Achievement.objects.all()
        if game_id:
            all_achievements = all_achievements.filter(game_id=game_id)
        
        # Obtener logros desbloqueados del usuario
        user_achievements = UserAchievement.objects.filter(
            user=request.user
        ).select_related('achievement')
        
        # Crear diccionario de logros del usuario
        user_ach_dict = {ua.achievement_id: ua for ua in user_achievements}
        
        # Combinar información
        result = []
        for achievement in all_achievements:
            user_ach = user_ach_dict.get(str(achievement.id))
            
            data = {
                'id': str(achievement.id),
                'title': achievement.title,
                'description': achievement.description,
                'icon': achievement.icon,
                'xp_reward': achievement.xp_reward,
                'rarity': achievement.rarity,
                'achievement_type': achievement.achievement_type,
                'threshold': achievement.threshold,
                'is_unlocked': user_ach is not None,
                'unlocked_at': user_ach.unlocked_at if user_ach else None,
                'progress': user_ach.progress if user_ach else 0,
                'can_claim': user_ach and not user_ach.is_claimed if user_ach else False,
            }
            result.append(data)
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def unclaimed(self, request):
        """Obtener logros con recompensa sin reclamar."""
        unclaimed = UserAchievement.objects.filter(
            user=request.user,
            is_claimed=False
        ).select_related('achievement__game')
        
        serializer = UserAchievementSerializer(unclaimed, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """Reclamar la recompensa de un logro."""
        try:
            user_achievement = UserAchievement.objects.get(
                id=pk,
                user=request.user
            )
        except UserAchievement.DoesNotExist:
            return Response({
                'error': 'Logro no encontrado.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user_achievement.is_claimed:
            return Response({
                'error': 'La recompensa ya fue reclamada.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_achievement.claim_reward()
        
        return Response({
            'message': f'¡Recompensa de {user_achievement.achievement.xp_reward} XP reclamada!',
            'xp_earned': user_achievement.achievement.xp_reward,
            'new_total_xp': request.user.profile.total_xp,
            'new_level': request.user.profile.current_level
        })

    @action(detail=False, methods=['post'])
    def claim_all(self, request):
        """Reclamar todas las recompensas pendientes."""
        unclaimed = UserAchievement.objects.filter(
            user=request.user,
            is_claimed=False
        ).select_related('achievement')
        
        total_xp = 0
        count = 0
        
        for ua in unclaimed:
            ua.claim_reward()
            total_xp += ua.achievement.xp_reward
            count += 1
        
        return Response({
            'message': f'¡{count} recompensas reclamadas!',
            'total_xp_earned': total_xp,
            'new_total_xp': request.user.profile.total_xp,
            'new_level': request.user.profile.current_level
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de logros del usuario."""
        total_achievements = Achievement.objects.filter(is_active=True).count()
        unlocked = UserAchievement.objects.filter(user=request.user).count()
        
        # Por rareza
        by_rarity = UserAchievement.objects.filter(
            user=request.user
        ).values('achievement__rarity').annotate(count=Count('id'))
        
        rarity_stats = {item['achievement__rarity']: item['count'] for item in by_rarity}
        
        # XP total ganado por logros
        total_xp_from_achievements = sum(
            ua.achievement.xp_reward 
            for ua in UserAchievement.objects.filter(
                user=request.user, 
                is_claimed=True
            ).select_related('achievement')
        )
        
        return Response({
            'total_achievements': total_achievements,
            'unlocked': unlocked,
            'locked': total_achievements - unlocked,
            'completion_percentage': round((unlocked / total_achievements) * 100, 2) if total_achievements > 0 else 0,
            'by_rarity': rarity_stats,
            'total_xp_earned': total_xp_from_achievements
        })


class AchievementProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para progreso de logros."""
    queryset = AchievementProgress.objects.all()
    serializer_class = AchievementProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AchievementProgress.objects.filter(
            user=self.request.user
        ).select_related('achievement__game').order_by('-last_updated')

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """Obtener logros en progreso."""
        # Excluir logros ya completados
        completed_ids = UserAchievement.objects.filter(
            user=request.user
        ).values_list('achievement_id', flat=True)
        
        progress = AchievementProgress.objects.filter(
            user=request.user
        ).exclude(
            achievement_id__in=completed_ids
        ).select_related('achievement__game').order_by('-last_updated')
        
        serializer = AchievementProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def almost_complete(self, request):
        """Obtener logros casi completados (>75%)."""
        completed_ids = UserAchievement.objects.filter(
            user=request.user
        ).values_list('achievement_id', flat=True)
        
        progress = AchievementProgress.objects.filter(
            user=request.user
        ).exclude(
            achievement_id__in=completed_ids
        ).select_related('achievement__game')
        
        almost_done = [p for p in progress if p.percentage >= 75]
        serializer = AchievementProgressSerializer(almost_done, many=True)
        return Response(serializer.data)
