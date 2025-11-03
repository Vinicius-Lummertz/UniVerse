# core/views.py

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Posts, Profile, Comment, Reaction
from .serializers import PostSerializer, UserSerializer, MyTokenObtainPairSerializer, ProfileSerializer, UserSearchSerializer, CommentSerializer, ReactionSerializer
from django.contrib.auth.models import User 
from .permissions import IsOwnerOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend 



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

    def get_serializer_context(self): # Adicione este método
        return {'request': self.request}

# --- VIEW DE DETALHES, EDIÇÃO E EXCLUSÃO ---
class PostDetailsAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Posts.objects.all()
    serializer_class = PostSerializer
    # CORREÇÃO: É AQUI que precisamos checar se o usuário é o dono do post
    # para poder EDITAR ou DELETAR.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_context(self): # Adicione este método
        return {'request': self.request}

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


    

class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        try:
            user_to_follow = User.objects.get(username=username)
            profile_to_follow = user_to_follow.profile
            current_user_profile = request.user.profile

            if current_user_profile == profile_to_follow:
                return Response({"error": "Você não pode seguir a si mesmo."}, status=status.HTTP_400_BAD_REQUEST)

            current_user_profile.following.add(profile_to_follow)
            return Response({"status": "seguindo"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, username):
        try:
            user_to_unfollow = User.objects.get(username=username)
            profile_to_unfollow = user_to_unfollow.profile
            current_user_profile = request.user.profile

            current_user_profile.following.remove(profile_to_unfollow)
            return Response({"status": "deixou de seguir"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

# NOVA VIEW para a timeline de quem você segue
class FollowingPostsFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Filtra perfis que o usuário logado segue
        following_profiles = user.profile.following.all()
        # Filtra posts onde o 'owner' (User) tem um 'profile' que está na lista de 'following_profiles'
        return Posts.objects.filter(owner__profile__in=following_profiles).order_by('-createdAt')
    
class UserDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):

        return self.request.user
    
class UserSearchView(generics.ListAPIView):
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [] 

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        if query and len(query) >= 1:
            results = User.objects.filter(username__icontains=query).exclude(id=self.request.user.id)
            return results
        return User.objects.none()
    
class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'

    def get_serializer_context(self):
        # Passa o 'request' para o ProfileSerializer
        return {'request': self.request}
    
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Filtra comentários pelo 'pk' do post na URL
        post_pk = self.kwargs['post_pk']
        return Comment.objects.filter(post_id=post_pk)

    def perform_create(self, serializer):
        # Associa o comentário ao post e ao usuário logado
        post_pk = self.kwargs['post_pk']
        post = generics.get_object_or_404(Posts, pk=post_pk)
        serializer.save(user=self.request.user, post=post)

# NOVA VIEW para Reações
class ReactionCreateDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_pk):
        post = generics.get_object_or_404(Posts, pk=post_pk)
        emoji = request.data.get('emoji')

        if not emoji:
            return Response({"error": "Emoji é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        # Tenta criar, se já existir (unique_together), ignora silenciosamente ou atualiza (aqui criamos ou falhamos)
        reaction, created = Reaction.objects.get_or_create(
            post=post,
            user=request.user,
            defaults={'emoji': emoji} # Só usa o emoji se for criar
        )

        # Se não foi criado (já existia), e o emoji for diferente, atualiza
        if not created and reaction.emoji != emoji:
             reaction.emoji = emoji
             reaction.save()
        elif not created and reaction.emoji == emoji:
             # Se clicou no mesmo emoji, remove a reação (DELETE logic)
             reaction.delete()
             return Response(status=status.HTTP_204_NO_CONTENT)


        serializer = ReactionSerializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)