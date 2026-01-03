"""
URL configuration for rankplay_backend project.
RankPlay - Centro de minijuegos con rankings y sistema de amigos
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Punto de entrada de la API de RankPlay.
    """
    return Response({
        'name': 'RankPlay API',
        'version': '1.0.0',
        'description': 'Centro de minijuegos con rankings y sistema de amigos',
        'endpoints': {
            'auth': {
                'register': '/api/v1/auth/register/',
                'login': '/api/v1/auth/login/',
                'logout': '/api/v1/auth/logout/',
                'change_password': '/api/v1/auth/change_password/',
                'token_refresh': '/api/v1/token/refresh/',
            },
            'users': {
                'list': '/api/v1/users/',
                'me': '/api/v1/users/me/',
                'search': '/api/v1/users/search/?q=<query>',
            },
            'profiles': {
                'me': '/api/v1/profiles/me/',
            },
            'friendships': {
                'list': '/api/v1/friendships/',
                'friends': '/api/v1/friendships/friends/',
                'pending': '/api/v1/friendships/pending/',
                'sent': '/api/v1/friendships/sent/',
                'send_request': '/api/v1/friendships/send_request/',
                'accept': '/api/v1/friendships/<id>/accept/',
                'reject': '/api/v1/friendships/<id>/reject/',
            },
            'games': {
                'list': '/api/v1/games/',
                'detail': '/api/v1/games/<id>/',
                'featured': '/api/v1/games/featured/',
                'popular': '/api/v1/games/popular/',
                'categories': '/api/v1/games/categories/',
                'leaderboard': '/api/v1/games/<id>/leaderboard/',
                'friends_leaderboard': '/api/v1/games/<id>/friends_leaderboard/',
            },
            'scores': {
                'list': '/api/v1/scores/',
                'submit': '/api/v1/scores/submit/',
                'my_scores': '/api/v1/scores/my_scores/',
                'my_best': '/api/v1/scores/my_best/',
            },
            'sessions': {
                'start': '/api/v1/sessions/start/',
                'end': '/api/v1/sessions/end/',
                'history': '/api/v1/sessions/history/',
                'stats': '/api/v1/sessions/stats/',
            },
            'achievements': {
                'list': '/api/v1/achievements/',
                'global': '/api/v1/achievements/global_achievements/',
                'by_rarity': '/api/v1/achievements/by_rarity/',
            },
            'user_achievements': {
                'my_achievements': '/api/v1/user-achievements/my_achievements/',
                'unclaimed': '/api/v1/user-achievements/unclaimed/',
                'claim': '/api/v1/user-achievements/<id>/claim/',
                'claim_all': '/api/v1/user-achievements/claim_all/',
                'stats': '/api/v1/user-achievements/stats/',
            },
            'achievement_progress': {
                'list': '/api/v1/achievement-progress/',
                'in_progress': '/api/v1/achievement-progress/in_progress/',
                'almost_complete': '/api/v1/achievement-progress/almost_complete/',
            },
        },
        'documentation': '/api/v1/',
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),
    path('', api_root, name='api-root'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# Admin site customization
admin.site.site_header = 'RankPlay Admin'
admin.site.site_title = 'RankPlay'
admin.site.index_title = 'Panel de Administración'
