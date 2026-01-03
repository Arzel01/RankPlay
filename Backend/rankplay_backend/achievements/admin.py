from django.contrib import admin
from .models import Achievement, UserAchievement, AchievementProgress


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'game', 'achievement_type', 'rarity', 'xp_reward', 'is_active', 'order')
    list_filter = ('achievement_type', 'rarity', 'is_active', 'game')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at')
    ordering = ('order', 'name')

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description', 'icon_url', 'game')
        }),
        ('Configuración del Logro', {
            'fields': ('achievement_type', 'target_value', 'xp_reward', 'rarity')
        }),
        ('Opciones', {
            'fields': ('is_hidden', 'is_active', 'order')
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'unlocked_at', 'is_claimed')
    list_filter = ('achievement__rarity', 'is_claimed', 'unlocked_at')
    search_fields = ('user__username', 'achievement__name')
    readonly_fields = ('id', 'unlocked_at')
    ordering = ('-unlocked_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'achievement')


@admin.register(AchievementProgress)
class AchievementProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'current_value', 'get_target_value', 'get_percentage', 'last_updated')
    list_filter = ('achievement__achievement_type', 'last_updated')
    search_fields = ('user__username', 'achievement__name')
    readonly_fields = ('id', 'last_updated')
    ordering = ('-last_updated',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'achievement')

    def get_target_value(self, obj):
        return obj.achievement.target_value
    get_target_value.short_description = 'Objetivo'

    def get_percentage(self, obj):
        return f"{obj.percentage:.1f}%"
    get_percentage.short_description = 'Progreso'
