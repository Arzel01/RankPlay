"""
Serializadores para la API de RankPlay.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from accounts.models import UserProfile, Friendship
from games.models import Game, Score, GameSession
from achievements.models import Achievement, UserAchievement, AchievementProgress

User = get_user_model()


# ============== ACCOUNTS SERIALIZERS ==============

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para el perfil público del usuario."""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user_id', 'username', 'display_name', 'avatar_url', 'bio',
            'current_level', 'total_xp', 'games_played', 
            'total_playtime_seconds', 'xp_for_next_level'
        ]
        read_only_fields = ['user_id', 'current_level', 'total_xp', 'games_played', 'total_playtime_seconds']


class UserSerializer(serializers.ModelSerializer):
    """Serializer completo del usuario con perfil."""
    profile = UserProfileSerializer(read_only=True)
    friends_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_active', 
            'created_at', 'profile', 'friends_count'
        ]
        read_only_fields = ['id', 'is_active', 'created_at']

    def get_friends_count(self, obj):
        return obj.friends.count()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios."""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        min_length=8,
        validators=[validate_password],
        style={'input_type': 'password'},
        help_text='Mínimo 8 caracteres'
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    display_name = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'display_name']

    def validate_username(self, value):
        """Validar username."""
        if len(value) < 3:
            raise serializers.ValidationError('El nombre de usuario debe tener al menos 3 caracteres.')
        if not value.isalnum() and '_' not in value:
            raise serializers.ValidationError('Solo se permiten letras, números y guiones bajos.')
        return value

    def validate_password(self, value):
        """Validaciones adicionales de contraseña."""
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres.')
        if value.isdigit():
            raise serializers.ValidationError('La contraseña no puede ser solo números.')
        if value.isalpha():
            raise serializers.ValidationError('La contraseña debe incluir números o símbolos.')
        if value.lower() == value:
            raise serializers.ValidationError('La contraseña debe incluir al menos una mayúscula.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        display_name = validated_data.pop('display_name', '').strip()
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Asignar display_name solo si se proporcionó y no está vacío
        if display_name and hasattr(user, 'profile'):
            user.profile.display_name = display_name
            user.profile.save()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer para login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar el perfil."""
    class Meta:
        model = UserProfile
        fields = ['display_name', 'avatar_url', 'bio']


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer para relaciones de amistad."""
    requester_username = serializers.CharField(source='requester.username', read_only=True)
    requester_avatar = serializers.URLField(source='requester.profile.avatar_url', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    receiver_avatar = serializers.URLField(source='receiver.profile.avatar_url', read_only=True)

    class Meta:
        model = Friendship
        fields = [
            'id', 'requester', 'requester_username', 'requester_avatar',
            'receiver', 'receiver_username', 'receiver_avatar',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'requester', 'status', 'created_at']


class FriendRequestSerializer(serializers.Serializer):
    """Serializer para enviar solicitud de amistad."""
    receiver_username = serializers.CharField()

    def validate_receiver_username(self, value):
        try:
            User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Usuario no encontrado.')
        return value


class FriendListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de amigos."""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'profile']


# ============== GAMES SERIALIZERS ==============

class GameSerializer(serializers.ModelSerializer):
    """Serializer para juegos."""
    total_players = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'slug', 'title', 'description', 'instructions',
            'category', 'icon_url', 'banner_url', 'bundle_url',
            'min_score', 'max_score', 'xp_per_play', 
            'is_featured', 'play_count', 'total_players', 'best_score'
        ]
        read_only_fields = ['id', 'play_count']

    def get_total_players(self, obj):
        return obj.scores.values('user').distinct().count()

    def get_best_score(self, obj):
        best = obj.scores.order_by('-score_value').first()
        return best.score_value if best else 0


class GameDetailSerializer(GameSerializer):
    """Serializer detallado para un juego específico."""
    top_scores = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()

    class Meta(GameSerializer.Meta):
        fields = GameSerializer.Meta.fields + ['top_scores', 'achievements']

    def get_top_scores(self, obj):
        top = Score.objects.global_ranking(obj, limit=10)
        return ScoreSerializer(top, many=True).data

    def get_achievements(self, obj):
        achievements = obj.achievements.filter(is_active=True)
        return AchievementSerializer(achievements, many=True).data


class ScoreSerializer(serializers.ModelSerializer):
    """Serializer para puntajes."""
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.CharField(source='user.profile.display_name', read_only=True)
    avatar_url = serializers.URLField(source='user.profile.avatar_url', read_only=True)
    user_level = serializers.IntegerField(source='user.profile.current_level', read_only=True)
    game_title = serializers.CharField(source='game.title', read_only=True)

    class Meta:
        model = Score
        fields = [
            'id', 'user', 'username', 'display_name', 'avatar_url', 'user_level',
            'game', 'game_title', 'score_value', 'metadata', 'is_best', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_best', 'created_at']


class ScoreCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevos puntajes."""
    class Meta:
        model = Score
        fields = ['game', 'score_value', 'metadata']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class GameSessionSerializer(serializers.ModelSerializer):
    """Serializer para sesiones de juego."""
    game_title = serializers.CharField(source='game.title', read_only=True)

    class Meta:
        model = GameSession
        fields = [
            'id', 'game', 'game_title', 'start_time', 'end_time',
            'duration_seconds', 'is_completed', 'device_info'
        ]
        read_only_fields = ['id', 'duration_seconds', 'is_completed']


class GameSessionStartSerializer(serializers.Serializer):
    """Serializer para iniciar una sesión de juego."""
    game_id = serializers.UUIDField()
    device_info = serializers.JSONField(required=False, default=dict)


class GameSessionEndSerializer(serializers.Serializer):
    """Serializer para finalizar una sesión de juego."""
    session_id = serializers.UUIDField()
    score_value = serializers.IntegerField(required=False, min_value=0)
    metadata = serializers.JSONField(required=False, default=dict)


# ============== RANKINGS SERIALIZERS ==============

class RankingEntrySerializer(serializers.Serializer):
    """Serializer para una entrada de ranking."""
    rank = serializers.IntegerField()
    user_id = serializers.UUIDField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    avatar_url = serializers.URLField(allow_null=True)
    level = serializers.IntegerField()
    score = serializers.IntegerField()
    is_current_user = serializers.BooleanField()


class GlobalRankingSerializer(serializers.Serializer):
    """Serializer para ranking global."""
    game = GameSerializer()
    rankings = RankingEntrySerializer(many=True)
    total_players = serializers.IntegerField()
    current_user_rank = serializers.IntegerField(allow_null=True)


class FriendsRankingSerializer(serializers.Serializer):
    """Serializer para ranking de amigos."""
    game = GameSerializer()
    rankings = RankingEntrySerializer(many=True)
    current_user_rank = serializers.IntegerField(allow_null=True)


# ============== ACHIEVEMENTS SERIALIZERS ==============

class AchievementSerializer(serializers.ModelSerializer):
    """Serializer para logros."""
    game_title = serializers.CharField(source='game.title', read_only=True, allow_null=True)
    unlocked_count = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            'id', 'name', 'description', 'icon_url', 'game', 'game_title',
            'achievement_type', 'target_value', 'xp_reward', 'rarity',
            'is_hidden', 'unlocked_count'
        ]

    def get_unlocked_count(self, obj):
        return obj.unlocked_by.count()


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer para logros del usuario."""
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'unlocked_at', 'progress', 'is_claimed']


class AchievementProgressSerializer(serializers.ModelSerializer):
    """Serializer para progreso de logros."""
    achievement = AchievementSerializer(read_only=True)
    percentage = serializers.FloatField(read_only=True)
    is_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = AchievementProgress
        fields = ['id', 'achievement', 'current_value', 'percentage', 'is_complete', 'last_updated']


# ============== STATISTICS SERIALIZERS ==============

class UserStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas del usuario."""
    total_games_played = serializers.IntegerField()
    total_playtime_hours = serializers.FloatField()
    favorite_game = GameSerializer(allow_null=True)
    total_achievements = serializers.IntegerField()
    total_xp = serializers.IntegerField()
    current_level = serializers.IntegerField()
    global_rank = serializers.IntegerField(allow_null=True)
    friends_count = serializers.IntegerField()
    best_scores = ScoreSerializer(many=True)


class LeaderboardStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas del leaderboard."""
    game = GameSerializer()
    total_scores = serializers.IntegerField()
    unique_players = serializers.IntegerField()
    average_score = serializers.FloatField()
    highest_score = serializers.IntegerField()
    most_active_player = UserSerializer(allow_null=True)
