from django.contrib import admin
from .models import Game, Score, GameSession


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'category', 'is_active', 'is_featured', 'play_count', 'created_at')
    list_filter = ('category', 'is_active', 'is_featured')
    search_fields = ('title', 'slug', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('id', 'play_count', 'created_at', 'updated_at')
    ordering = ('-created_at',)

    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'slug', 'description', 'instructions', 'category')
        }),
        ('Multimedia', {
            'fields': ('icon_url', 'banner_url', 'bundle_url')
        }),
        ('Configuración', {
            'fields': ('min_score', 'max_score', 'xp_per_play', 'is_active', 'is_featured')
        }),
        ('Estadísticas', {
            'fields': ('play_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score_value', 'is_best', 'created_at')
    list_filter = ('game', 'is_best', 'created_at')
    search_fields = ('user__username', 'game__title')
    readonly_fields = ('id', 'created_at')
    ordering = ('-score_value', '-created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'game')


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'start_time', 'duration_seconds', 'is_completed')
    list_filter = ('game', 'is_completed', 'start_time')
    search_fields = ('user__username', 'game__title')
    readonly_fields = ('id', 'duration_seconds')
    ordering = ('-start_time',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'game')
