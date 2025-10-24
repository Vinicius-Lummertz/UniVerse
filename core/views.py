# core/views.py

from rest_framework import generics, permissions
from .models import Posts
from .serializers import PostSerializer, UserSerializer, MyTokenObtainPairSerializer
from django.contrib.auth.models import User 
from .permissions import IsOwnerOrReadOnly
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend 
from .models import Profile
from .serializers import ProfileSerializer


# --- VIEW DE LISTA E CRIAÇÃO ---
class PostListAPIView(generics.ListCreateAPIView):
    queryset = Posts.objects.all().order_by('-createdAt')
    serializer_class = PostSerializer
    # CORREÇÃO: A permissão aqui deve ser apenas para checar se o usuário está logado
    # para poder CRIAR. Qualquer um pode LER a lista.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['owner__username']

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# --- VIEW DE DETALHES, EDIÇÃO E EXCLUSÃO ---
class PostDetailsAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Posts.objects.all()
    serializer_class = PostSerializer
    # CORREÇÃO: É AQUI que precisamos checar se o usuário é o dono do post
    # para poder EDITAR ou DELETAR.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Retorna o perfil do usuário que está fazendo a requisição
        return self.request.user.profile

# --- VIEW DE REGISTRO DE USUÁRIO (sem alteração) ---
class UserCreateAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# --- VIEW DE LOGIN/TOKEN (sem alteração) ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'