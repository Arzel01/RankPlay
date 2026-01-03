"""
Views para la API de RankPlay - Módulo de Cuentas.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q

from accounts.models import UserProfile, Friendship
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    UserProfileSerializer, UserProfileUpdateSerializer,
    FriendshipSerializer, FriendRequestSerializer, FriendListSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


class AuthViewSet(viewsets.ViewSet):
    """ViewSet para autenticación."""
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Registro de nuevo usuario."""
        print(f'[REGISTER] Request data: {request.data}')
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': '¡Usuario registrado exitosamente!',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        print(f'[REGISTER] Validation errors: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login de usuario."""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'error': 'Credenciales inválidas.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            user = authenticate(username=email, password=password)
            
            if user is not None:
                if user.is_active:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': '¡Inicio de sesión exitoso!',
                        'user': UserSerializer(user).data,
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    })
                return Response({
                    'error': 'La cuenta está desactivada.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            return Response({
                'error': 'Credenciales inválidas.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout - Invalida el refresh token."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Sesión cerrada exitosamente.'
            })
        except Exception:
            return Response({
                'message': 'Sesión cerrada.'
            })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Cambiar contraseña."""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'La contraseña actual es incorrecta.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({
                'message': 'Contraseña actualizada exitosamente.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para usuarios."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar usuarios activos."""
        return User.objects.filter(is_active=True).select_related('profile')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener perfil del usuario actual."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Buscar usuarios por nombre."""
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response({
                'error': 'La búsqueda debe tener al menos 2 caracteres.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(
            Q(username__icontains=query) | 
            Q(profile__display_name__icontains=query),
            is_active=True
        ).exclude(id=request.user.id)[:20]
        
        serializer = FriendListSerializer(users, many=True)
        return Response(serializer.data)


class ProfileViewSet(viewsets.ModelViewSet):
    """ViewSet para perfiles de usuario."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.select_related('user')

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Obtener o actualizar el perfil propio."""
        profile = request.user.profile
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        
        serializer = UserProfileUpdateSerializer(
            profile, 
            data=request.data, 
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FriendshipViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de amistades."""
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtener amistades relacionadas al usuario actual."""
        return Friendship.objects.filter(
            Q(requester=self.request.user) | Q(receiver=self.request.user)
        ).select_related('requester__profile', 'receiver__profile')

    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Lista de amigos aceptados."""
        friends = request.user.friends
        serializer = FriendListSerializer(friends, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Solicitudes de amistad pendientes recibidas."""
        pending = Friendship.objects.filter(
            receiver=request.user,
            status=Friendship.Status.PENDING
        ).select_related('requester__profile')
        serializer = FriendshipSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        """Solicitudes de amistad enviadas."""
        sent = Friendship.objects.filter(
            requester=request.user,
            status=Friendship.Status.PENDING
        ).select_related('receiver__profile')
        serializer = FriendshipSerializer(sent, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Enviar solicitud de amistad."""
        serializer = FriendRequestSerializer(data=request.data)
        if serializer.is_valid():
            receiver_username = serializer.validated_data['receiver_username']
            receiver = User.objects.get(username=receiver_username)
            
            if receiver == request.user:
                return Response({
                    'error': 'No puedes enviarte una solicitud a ti mismo.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar si ya existe una relación
            existing = Friendship.objects.filter(
                Q(requester=request.user, receiver=receiver) |
                Q(requester=receiver, receiver=request.user)
            ).first()
            
            if existing:
                if existing.status == Friendship.Status.ACCEPTED:
                    return Response({
                        'error': 'Ya son amigos.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif existing.status == Friendship.Status.PENDING:
                    return Response({
                        'error': 'Ya existe una solicitud pendiente.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif existing.status == Friendship.Status.BLOCKED:
                    return Response({
                        'error': 'No se puede enviar la solicitud.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            friendship = Friendship.objects.create(
                requester=request.user,
                receiver=receiver
            )
            return Response({
                'message': 'Solicitud enviada exitosamente.',
                'friendship': FriendshipSerializer(friendship).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Aceptar solicitud de amistad."""
        try:
            friendship = Friendship.objects.get(
                id=pk,
                receiver=request.user,
                status=Friendship.Status.PENDING
            )
            friendship.accept()
            return Response({
                'message': 'Solicitud de amistad aceptada.',
                'friendship': FriendshipSerializer(friendship).data
            })
        except Friendship.DoesNotExist:
            return Response({
                'error': 'Solicitud no encontrada.'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rechazar solicitud de amistad."""
        try:
            friendship = Friendship.objects.get(
                id=pk,
                receiver=request.user,
                status=Friendship.Status.PENDING
            )
            friendship.reject()
            return Response({
                'message': 'Solicitud de amistad rechazada.'
            })
        except Friendship.DoesNotExist:
            return Response({
                'error': 'Solicitud no encontrada.'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        """Bloquear usuario."""
        try:
            friendship = Friendship.objects.get(
                Q(id=pk),
                Q(requester=request.user) | Q(receiver=request.user)
            )
            friendship.block()
            return Response({
                'message': 'Usuario bloqueado.'
            })
        except Friendship.DoesNotExist:
            return Response({
                'error': 'Relación no encontrada.'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'])
    def unfriend(self, request, pk=None):
        """Eliminar amigo."""
        try:
            friendship = Friendship.objects.get(
                Q(id=pk),
                Q(requester=request.user) | Q(receiver=request.user),
                status=Friendship.Status.ACCEPTED
            )
            friendship.delete()
            return Response({
                'message': 'Amigo eliminado.'
            }, status=status.HTTP_204_NO_CONTENT)
        except Friendship.DoesNotExist:
            return Response({
                'error': 'Amistad no encontrada.'
            }, status=status.HTTP_404_NOT_FOUND)
