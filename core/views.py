from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User 
from django_filters.rest_framework import DjangoFilterBackend 

# Importação de todos os modelos e serializers necessários
from .models import (
    Posts, Profile, Comment, Reaction, Conversation, Message,
    Community, CommunityMembership, Announcement, Tag, Notification, Badge
)
from .serializers import (
    PostSerializer, UserSerializer, MyTokenObtainPairSerializer, ProfileSerializer, 
    UserSearchSerializer, CommentSerializer, ReactionSerializer, 
    ConversationSerializer, MessageSerializer, UserUpdateSerializer,
    CommunitySerializer, CommunityMembershipSerializer, AnnouncementSerializer,
    TagSerializer, NotificationSerializer, AdminUserSerializer, BadgeSerializer, 
)
# Importação de todas as permissões
from .permissions import IsOwnerOrReadOnly, IsCommunityAdmin, IsAdminUser

# ==============================================================================
# VIEWS DE POSTS E INTERAÇÕES (Existentes)
# ==============================================================================

class PostListAPIView(generics.ListCreateAPIView):
    """
    Lista todos os posts (para o feed global) ou cria um novo post.
    O feed global é público (AllowAny).
    """
    # queryset = Posts.objects.all().order_by('-createdAt') # Movido para get_queryset
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Permite leitura anônima
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['owner__username']

    def get_queryset(self):
        # Filtra posts para mostrar apenas posts "globais" (não de comunidade)
        return Posts.objects.filter(community__isnull=True).order_by('-createdAt')

    def perform_create(self, serializer):
        # Associa o post ao usuário logado
        serializer.save(owner=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class PostDetailsAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vê, atualiza ou deleta um post específico.
    Protegido por: (Dono do Post) ou (Admin Global/Staff)
    """
    queryset = Posts.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}


class ReactionCreateDeleteView(APIView):
    """
    Cria, atualiza ou deleta uma reação a um post.
    Se o usuário clica no mesmo emoji, a reação é removida.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_pk):
        post = get_object_or_404(Posts, pk=post_pk)
        emoji = request.data.get('emoji')

        if not emoji:
            return Response({"error": "Emoji é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        reaction, created = Reaction.objects.get_or_create(
            post=post,
            user=request.user,
            defaults={'emoji': emoji}
        )

        if not created and reaction.emoji != emoji:
             reaction.emoji = emoji
             reaction.save()
        elif not created and reaction.emoji == emoji:
             reaction.delete()
             return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = ReactionSerializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CommentListCreateView(generics.ListCreateAPIView):
    """
    Lista todos os comentários de um post ou cria um novo comentário.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_pk = self.kwargs['post_pk']
        return Comment.objects.filter(post_id=post_pk)

    def perform_create(self, serializer):
        post_pk = self.kwargs['post_pk']
        post = get_object_or_404(Posts, pk=post_pk)
        serializer.save(user=self.request.user, post=post)

# ==============================================================================
# VIEWS DE USUÁRIO E PERFIL (Existentes + Novas)
# ==============================================================================

class UserCreateAPIView(generics.CreateAPIView):
    """
    Registra um novo usuário.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] # Permite registro anônimo


class MyTokenObtainPairView(TokenObtainPairView):
    """
    View de Login (Obtenção de Token JWT).
    """
    serializer_class = MyTokenObtainPairSerializer


class UserDetailView(generics.RetrieveAPIView):
    """
    Vê os detalhes de um perfil de usuário (pelo username).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    permission_classes = [permissions.AllowAny] # Permite ver perfis publicamente

    def get_serializer_context(self):
        return {'request': self.request}


class UserUpdateView(generics.RetrieveUpdateAPIView):
    """
    Permite ao usuário logado atualizar seus dados básicos (nome, email).
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """
    Permite ao usuário logado atualizar seu perfil (bio, foto, universidade, etc.).
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class UserDeleteView(generics.DestroyAPIView):
    """
    Permite ao usuário logado deletar sua própria conta.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserSearchView(generics.ListAPIView):
    """
    Busca usuários pelo username.
    """
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [] # Desabilita o filtro global do DRF

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        if query and len(query) >= 1:
            return User.objects.filter(username__icontains=query).exclude(id=self.request.user.id)
        return User.objects.none()

# ==============================================================================
# VIEWS DE FEED E SEGUIR (Existentes + Novas)
# ==============================================================================

class FollowUserView(APIView):
    """
    Adiciona ou remove um usuário da lista de "seguindo".
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        user_to_follow = get_object_or_404(User, username=username)
        current_user_profile = request.user.profile
        if current_user_profile.user == user_to_follow:
            return Response({"error": "Você não pode seguir a si mesmo."}, status=status.HTTP_400_BAD_REQUEST)
        current_user_profile.following.add(user_to_follow.profile)
        return Response({"status": "seguindo"}, status=status.HTTP_200_OK)

    def delete(self, request, username):
        user_to_unfollow = get_object_or_404(User, username=username)
        request.user.profile.following.remove(user_to_unfollow.profile)
        return Response({"status": "deixou de seguir"}, status=status.HTTP_200_OK)


class FollowingPostsFeedView(generics.ListAPIView):
    """
    Retorna o feed de posts dos usuários que você segue.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_profiles = user.profile.following.all()
        # Filtra posts "globais" (sem comunidade) dos perfis que o usuário segue
        return Posts.objects.filter(
            owner__profile__in=following_profiles, 
            community__isnull=True
        ).order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class ToggleSavePostView(APIView):
    """
    NOVA VIEW: Adiciona ou remove um post da lista de "Salvos" do usuário.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_pk):
        post = get_object_or_404(Posts, pk=post_pk)
        profile = request.user.profile

        if post in profile.saved_posts.all():
            profile.saved_posts.remove(post)
            return Response({"status": "removido dos salvos"}, status=status.HTTP_200_OK)
        else:
            profile.saved_posts.add(post)
            return Response({"status": "adicionado aos salvos"}, status=status.HTTP_200_OK)


class SavedPostListView(generics.ListAPIView):
    """
    NOVA VIEW: Retorna a lista de posts salvos (bookmarks) do usuário logado.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.profile.saved_posts.all().order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class HashtagPostListView(generics.ListAPIView):
    """
    NOVA VIEW: Retorna posts (globais) que contêm uma #hashtag específica.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        tag_name = self.kwargs['tag_name']
        tag = get_object_or_404(Tag, name__iexact=tag_name) # __iexact ignora case
        return tag.posts.filter(community__isnull=True).order_by('-createdAt')
    
    def get_serializer_context(self):
        return {'request': self.request}

# ==============================================================================
# VIEWS DE COMUNIDADES (Novas)
# ==============================================================================

class CommunityCreateView(generics.CreateAPIView):
    """
    NOVA VIEW: Cria uma nova comunidade (define o usuário como admin).
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)


class CommunityListView(generics.ListAPIView):
    """
    NOVA VIEW: Lista todas as comunidades (para a página "Explorar").
    """
    queryset = Community.objects.all().order_by('name')
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]


class CommunityDetailView(generics.RetrieveAPIView):
    """
    NOVA VIEW: Vê os detalhes de uma comunidade.
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]


class JoinCommunityView(APIView):
    """
    NOVA VIEW: Permite ao usuário logado "entrar" ou "solicitar entrada" em uma comunidade.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        community = get_object_or_404(Community, id=community_id)
        user = request.user

        # Verifica se já é membro ou se a solicitação está pendente
        if CommunityMembership.objects.filter(user=user, community=community).exists():
            return Response({"error": "Você já é membro ou sua solicitação está pendente."}, status=status.HTTP_400_BAD_REQUEST)

        if community.privacy == 'public':
            membership = CommunityMembership.objects.create(user=user, community=community, status='approved')
            return Response({"status": "approved", "membership_id": membership.id}, status=status.HTTP_201_CREATED)
        else: # 'private'
            membership = CommunityMembership.objects.create(user=user, community=community, status='pending')
            return Response({"status": "pending", "membership_id": membership.id}, status=status.HTTP_201_CREATED)


class ApproveMemberView(APIView):
    """
    NOVA VIEW: (Admin da Comunidade) Aprova uma solicitação pendente.
    """
    permission_classes = [permissions.IsAuthenticated, IsCommunityAdmin]

    def post(self, request, membership_id):
        membership = get_object_or_404(CommunityMembership, id=membership_id)
        # Checagem de permissão (extra)
        self.check_object_permission(request, membership) 
        
        if membership.status == 'pending':
            membership.status = 'approved'
            membership.save()
            # Criar notificação para o usuário (lógica futura)
            return Response({"status": "approved"}, status=status.HTTP_200_OK)
        return Response({"error": "Membro já estava aprovado."}, status=status.HTTP_400_BAD_REQUEST)


class RemoveMemberView(generics.DestroyAPIView):
    """
    NOVA VIEW: (Admin da Comunidade OU o próprio usuário) Remove um membro.
    """
    queryset = CommunityMembership.objects.all()
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def check_object_permission(self, request, obj):
        # Permite se: 1. Você é o Admin da Comunidade OU 2. Você está tentando sair (é o seu próprio membership)
        if not (obj.community.admin == request.user or obj.user == request.user):
            self.permission_denied(request)


class CommunityFeedView(generics.ListAPIView):
    """
    NOVA VIEW: Retorna o feed de posts de uma comunidade específica.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        community_id = self.kwargs['community_id']
        community = get_object_or_404(Community, id=community_id)
        
        # Verifica se o usuário é membro aprovado
        if not community.members.filter(user=self.request.user, status='approved').exists():
            raise serializers.ValidationError("Você não é membro desta comunidade.")
            
        return community.community_posts.all().order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class CommunityPostCreateView(generics.CreateAPIView):
    """
    NOVA VIEW: Cria um post dentro de uma comunidade específica.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        community_id = self.kwargs['community_id']
        community = get_object_or_404(Community, id=community_id)
        
        # Verifica se o usuário é membro aprovado
        if not community.members.filter(user=self.request.user, status='approved').exists():
            raise serializers.ValidationError("Você não é membro desta comunidade.")
        
        serializer.save(owner=self.request.user, community=community)


class FindCommunityByCourseView(generics.ListAPIView):
    """
    NOVA VIEW: Encontra comunidades pelo nome do curso (para onboarding).
    """
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        course = self.request.query_params.get('course', None)
        if course:
            # Retorna comunidades que batem (parcialmente, sem case) com o nome do curso
            return Community.objects.filter(related_course__icontains=course)
        return Community.objects.none()

# ==============================================================================
# VIEWS DE ANÚNCIOS E NOTIFICAÇÕES (Novas)
# ==============================================================================

class AnnouncementListView(generics.ListAPIView):
    """
    NOVA VIEW: (Alunos) Lista recados do curso/universidade.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile
        if not profile.onboarding_complete:
            return Announcement.objects.none()
        
        return Announcement.objects.filter(
            target_university=profile.universidade,
            target_course=profile.curso
        ).order_by('-timestamp')


class AnnouncementCreateView(generics.CreateAPIView):
    """
    (Professores/Staff) Cria um novo recado.
    Staff pode enviar recados globais/segmentados.
    Professores só podem enviar para seu próprio curso.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 3. LÓGICA DE CRIAÇÃO ATUALIZADA
    def perform_create(self, serializer):
        profile = self.request.user.profile
        
        if not (profile.has_permission('can_send_announcement') or self.request.user.is_staff):
            raise serializers.ValidationError(
                "Você não tem permissão para enviar anúncios."
            )
        
        if self.request.user.is_staff:
            serializer.save(author=self.request.user,)
        else:
            serializer.save(
                author=self.request.user,
                target_university=profile.universidade,
                target_course=profile.curso
            )


class NotificationListView(generics.ListAPIView):
    """
    NOVA VIEW: Lista as notificações do usuário logado.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all() # .all() já usa o ordering do Meta


class MarkNotificationReadView(APIView):
    """
    NOVA VIEW: Marca notificações específicas (ou todas) como lidas.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', None) # Recebe uma lista de IDs
        mark_all = request.data.get('all', False)
        user = request.user

        if mark_all:
            user.notifications.filter(read=False).update(read=True)
            return Response({"status": "all marked as read"}, status=status.HTTP_200_OK)
        
        if ids and isinstance(ids, list):
            user.notifications.filter(id__in=ids, read=False).update(read=True)
            return Response({"status": "selected marked as read"}, status=status.HTTP_200_OK)
        
        return Response({"error": "Nenhum ID fornecido ou 'all:true' não foi setado."}, status=status.HTTP_400_BAD_REQUEST)
    
class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        try:
            # Encontra o usuário com quem se quer conversar
            other_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if other_user == request.user:
            return Response({"error": "Você não pode iniciar uma conversa consigo mesmo."}, status=status.HTTP_400_BAD_REQUEST)

        # Tenta encontrar uma conversa 1-para-1 que já exista
        # Filtra conversas que têm EXATAMENTE 2 participantes
        # E que contenham o usuário logado E o outro usuário
        conversation = Conversation.objects.annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=2,
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        # Se a conversa não existir, cria uma nova
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
        
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtra as conversas onde o usuário logado é um participante
        return self.request.user.conversations.all().order_by('-updated_at')

# NOVA VIEW: Listar todas as mensagens de uma conversa (histórico)
class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Pega o ID da conversa da URL
        conversation_id = self.kwargs['conversation_id']
        try:
            # Garante que o usuário logado é participante desta conversa
            conversation = self.request.user.conversations.get(id=conversation_id)
            return conversation.messages.all()
        except Conversation.DoesNotExist:
            # Se não for participante, não retorna nada
            return Message.objects.none()
        
class AdminUserListView(generics.ListAPIView):
    """
    (ADMIN) Lista todos os usuários para o painel de admin.
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser] # Protegido!

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    (ADMIN) Vê ou Atualiza um usuário específico.
    É aqui que você vai dar o badge de "Professor".
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser] # Protegido!
    lookup_field = 'id' # Vamos buscar por ID para ser mais fácil

class BadgeListCreateAPIView(generics.ListCreateAPIView):
    """
    (ADMIN) Lista todos os Badges ou cria um novo Badge.
    Protegido por: IsAdminUser (is_staff=True)
    """
    queryset = Badge.objects.all().order_by('name')
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser]

class BadgeListView(generics.ListAPIView):
    """
    (ADMIN) Lista todos os Badges disponíveis.
    (Usado para popular o "select" no painel de admin).
    """
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser] # Protegido!

class BadgeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    (ADMIN) Vê, atualiza ou deleta um Badge específico.
    Protegido por: IsAdminUser (is_staff=True)
    """
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser]


class AdminPostListView(generics.ListAPIView):
    """
    (ADMIN) Lista TODOS os posts para gerenciamento.
    """
    queryset = Posts.objects.all().order_by('createdAt')
    serializer_class = PostSerializer
    permission_classes = [IsAdminUser] # Protegido!