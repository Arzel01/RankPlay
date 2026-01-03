"""
Views para la API de RankPlay - Módulo de Juegos y Rankings.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Avg, Max, F
from django.utils import timezone

from games.models import Game, Score, GameSession
from .serializers import (
    GameSerializer, GameDetailSerializer, ScoreSerializer, ScoreCreateSerializer,
    GameSessionSerializer, GameSessionStartSerializer, GameSessionEndSerializer,
    RankingEntrySerializer
)


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para juegos (solo lectura)."""
    queryset = Game.objects.active()
    permission_classes = [AllowAny]
    pagination_class = None  # Desactivar paginación para juegos

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GameDetailSerializer
        return GameSerializer

    def get_queryset(self):
        queryset = Game.objects.active()
        
        # Filtros opcionales
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        return queryset

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener juegos destacados."""
        featured_games = Game.objects.filter(is_active=True, is_featured=True)[:10]
        serializer = GameSerializer(featured_games, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Obtener juegos más populares."""
        popular_games = Game.objects.active().order_by('-play_count')[:10]
        serializer = GameSerializer(popular_games, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Obtener lista de categorías."""
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Game.Category.choices
        ]
        return Response(categories)

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Ranking global de un juego."""
        game = self.get_object()
        limit = int(request.query_params.get('limit', 100))
        
        scores = Score.objects.global_ranking(game, limit=limit)
        
        rankings = []
        for i, score in enumerate(scores, 1):
            is_current = request.user.is_authenticated and score.user_id == request.user.id
            rankings.append({
                'rank': i,
                'user_id': score.user_id,
                'username': score.user.username,
                'display_name': score.user.profile.display_name if hasattr(score.user, 'profile') else score.user.username,
                'avatar_url': score.user.profile.avatar_url if hasattr(score.user, 'profile') else None,
                'level': score.user.profile.current_level if hasattr(score.user, 'profile') else 1,
                'score': score.score_value,
                'is_current_user': is_current
            })
        
        # Obtener ranking del usuario actual si está autenticado
        current_user_rank = None
        if request.user.is_authenticated:
            user_best = Score.objects.filter(
                game=game, 
                user=request.user
            ).order_by('-score_value').first()
            
            if user_best:
                current_user_rank = Score.objects.filter(
                    game=game,
                    score_value__gt=user_best.score_value
                ).count() + 1
        
        return Response({
            'game': GameSerializer(game).data,
            'rankings': rankings,
            'total_players': game.scores.values('user').distinct().count(),
            'current_user_rank': current_user_rank
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def friends_leaderboard(self, request, pk=None):
        """Ranking de amigos para un juego."""
        game = self.get_object()
        
        scores = Score.objects.friends_ranking(request.user, game, limit=50)
        
        rankings = []
        for i, score in enumerate(scores, 1):
            rankings.append({
                'rank': i,
                'user_id': score.user_id,
                'username': score.user.username,
                'display_name': score.user.profile.display_name if hasattr(score.user, 'profile') else score.user.username,
                'avatar_url': score.user.profile.avatar_url if hasattr(score.user, 'profile') else None,
                'level': score.user.profile.current_level if hasattr(score.user, 'profile') else 1,
                'score': score.score_value,
                'is_current_user': score.user_id == request.user.id
            })
        
        # Obtener ranking del usuario entre amigos
        current_user_rank = None
        for rank in rankings:
            if rank['is_current_user']:
                current_user_rank = rank['rank']
                break
        
        return Response({
            'game': GameSerializer(game).data,
            'rankings': rankings,
            'current_user_rank': current_user_rank
        })


class ScoreViewSet(viewsets.ModelViewSet):
    """ViewSet para puntajes."""
    queryset = Score.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ScoreCreateSerializer
        return ScoreSerializer

    def get_queryset(self):
        return Score.objects.filter(
            user=self.request.user
        ).select_related('game', 'user__profile').order_by('-created_at')

    def perform_create(self, serializer):
        score = serializer.save(user=self.request.user)
        
        # Incrementar contador del juego
        score.game.increment_play_count()
        
        # Añadir XP al perfil
        if hasattr(self.request.user, 'profile'):
            self.request.user.profile.add_xp(score.game.xp_per_play)

    @action(detail=False, methods=['get'])
    def my_scores(self, request):
        """Obtener todos mis puntajes."""
        game_id = request.query_params.get('game')
        
        queryset = Score.objects.filter(user=request.user)
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        
        queryset = queryset.select_related('game').order_by('-created_at')[:50]
        serializer = ScoreSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_best(self, request):
        """Obtener mis mejores puntajes por juego."""
        best_scores = Score.objects.filter(
            user=request.user,
            is_best=True
        ).select_related('game').order_by('-score_value')
        
        serializer = ScoreSerializer(best_scores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def submit(self, request):
        """Enviar un nuevo puntaje (alias de create)."""
        serializer = ScoreCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            score = serializer.save(user=request.user)
            
            # Incrementar contador del juego
            score.game.increment_play_count()
            
            # Añadir XP al perfil
            if hasattr(request.user, 'profile'):
                request.user.profile.add_xp(score.game.xp_per_play)
            
            # Obtener el ranking del usuario
            user_rank = Score.objects.filter(
                game=score.game,
                score_value__gt=score.score_value
            ).count() + 1
            
            return Response({
                'message': '¡Puntaje registrado!',
                'score': ScoreSerializer(score).data,
                'rank': user_rank,
                'is_new_best': score.is_best,
                'xp_earned': score.game.xp_per_play
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GameSessionViewSet(viewsets.ModelViewSet):
    """ViewSet para sesiones de juego."""
    queryset = GameSession.objects.all()
    serializer_class = GameSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GameSession.objects.filter(
            user=self.request.user
        ).select_related('game').order_by('-start_time')

    @action(detail=False, methods=['post'])
    def start(self, request):
        """Iniciar una nueva sesión de juego."""
        serializer = GameSessionStartSerializer(data=request.data)
        if serializer.is_valid():
            try:
                game = Game.objects.get(id=serializer.validated_data['game_id'])
            except Game.DoesNotExist:
                return Response({
                    'error': 'Juego no encontrado.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            session = GameSession.objects.create(
                user=request.user,
                game=game,
                start_time=timezone.now(),
                device_info=serializer.validated_data.get('device_info', {})
            )
            
            return Response({
                'message': 'Sesión iniciada.',
                'session': GameSessionSerializer(session).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def end(self, request):
        """Finalizar una sesión de juego y opcionalmente registrar puntaje."""
        serializer = GameSessionEndSerializer(data=request.data)
        if serializer.is_valid():
            try:
                session = GameSession.objects.get(
                    id=serializer.validated_data['session_id'],
                    user=request.user,
                    is_completed=False
                )
            except GameSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no encontrada o ya finalizada.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Finalizar sesión
            session.end_session()
            
            response_data = {
                'message': 'Sesión finalizada.',
                'session': GameSessionSerializer(session).data,
            }
            
            # Registrar puntaje si se proporciona
            score_value = serializer.validated_data.get('score_value')
            if score_value is not None:
                score = Score.objects.create(
                    user=request.user,
                    game=session.game,
                    score_value=score_value,
                    metadata=serializer.validated_data.get('metadata', {})
                )
                session.score = score
                session.save()
                
                # Añadir XP
                if hasattr(request.user, 'profile'):
                    request.user.profile.add_xp(session.game.xp_per_play)
                
                # Obtener ranking
                user_rank = Score.objects.filter(
                    game=session.game,
                    score_value__gt=score.score_value
                ).count() + 1
                
                response_data['score'] = ScoreSerializer(score).data
                response_data['rank'] = user_rank
                response_data['xp_earned'] = session.game.xp_per_play
            
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Historial de sesiones de juego."""
        game_id = request.query_params.get('game')
        limit = int(request.query_params.get('limit', 20))
        
        queryset = GameSession.objects.filter(
            user=request.user,
            is_completed=True
        )
        
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        
        queryset = queryset.select_related('game', 'score').order_by('-start_time')[:limit]
        serializer = GameSessionSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de sesiones del usuario."""
        from django.db.models import Sum
        
        stats = GameSession.objects.filter(
            user=request.user,
            is_completed=True
        ).aggregate(
            total_sessions=Count('id'),
            total_time=Sum('duration_seconds'),
            avg_duration=Avg('duration_seconds')
        )
        
        # Juego más jugado
        most_played = GameSession.objects.filter(
            user=request.user,
            is_completed=True
        ).values('game').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        favorite_game = None
        if most_played:
            favorite_game = Game.objects.filter(id=most_played['game']).first()
        
        return Response({
            'total_sessions': stats['total_sessions'] or 0,
            'total_time_seconds': stats['total_time'] or 0,
            'total_time_hours': round((stats['total_time'] or 0) / 3600, 2),
            'avg_duration_seconds': round(stats['avg_duration'] or 0, 2),
            'favorite_game': GameSerializer(favorite_game).data if favorite_game else None
        })
