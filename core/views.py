# core/views.py
from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count, Q # 1. IMPORTAR Q
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
from .permissions import IsOwnerOrReadOnly, IsCommunityAdmin, IsCommunityOwner, IsAdminUser

# ==============================================================================
# VIEWS DE POSTS E INTERAÇÕES (Existentes)
# ==============================================================================

class PostListAPIView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['owner__username']

    def get_queryset(self):
        return Posts.objects.filter(community__isnull=True).order_by('-createdAt')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class PostDetailsAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Posts.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}


class ReactionCreateDeleteView(APIView):
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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] 


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    permission_classes = [permissions.AllowAny] 

    def get_serializer_context(self):
        return {'request': self.request}


class UserUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


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
            return User.objects.filter(username__icontains=query).exclude(id=self.request.user.id)
        return User.objects.none()

# ==============================================================================
# VIEWS DE FEED E SEGUIR (Existentes + Novas)
# ==============================================================================

class FollowUserView(APIView):
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
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_profiles = user.profile.following.all()
        return Posts.objects.filter(
            owner__profile__in=following_profiles, 
            community__isnull=True
        ).order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class ToggleSavePostView(APIView):
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
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.profile.saved_posts.all().order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class HashtagPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        tag_name = self.kwargs['tag_name']
        tag = get_object_or_404(Tag, name__iexact=tag_name) 
        return tag.posts.filter(community__isnull=True).order_by('-createdAt')
    
    def get_serializer_context(self):
        return {'request': self.request}

# ==============================================================================
# VIEWS DE COMUNIDADES (Novas)
# ==============================================================================

class CommunityCreateView(generics.CreateAPIView):
    """
    Cria uma nova comunidade.
    Limitado a 1 por usuário (a menos que seja staff).
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    # --- LÓGICA ATUALIZADA (Fase 1) ---
    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Verifica o limite de 1 comunidade (regra de negócio)
        if not user.is_staff:
            if Community.objects.filter(admin=user).exists():
                raise serializers.ValidationError("Você já atingiu o limite de 1 comunidade. Exclua sua comunidade existente para criar uma nova.")
        
        # 2. Salva a comunidade
        community = serializer.save(admin=user)
        
        # 3. Cria automaticamente o membership para o dono (regra de negócio)
        CommunityMembership.objects.create(
            user=user,
            community=community,
            status='approved',
            is_admin=True # O criador é o primeiro admin
        )


class CommunityListView(generics.ListAPIView):
    queryset = Community.objects.all().order_by('name')
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]


class CommunityDetailView(generics.RetrieveAPIView):
    """
    Vê os detalhes de uma comunidade.
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]
    
    # Diz à view para usar o argumento 'community_id' da URL, em vez do padrão 'pk'
    lookup_url_kwarg = 'community_id'

    # Adiciona o 'request' ao contexto para o SerializerMethodField funcionar
    def get_serializer_context(self):
        return {'request': self.request}


class JoinCommunityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        community = get_object_or_404(Community, id=community_id)
        user = request.user

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
    (Admin da Comunidade) Aprova uma solicitação pendente.
    """
    permission_classes = [permissions.IsAuthenticated, IsCommunityAdmin]

    # --- CORREÇÃO: Alterado de 'membership_id' para 'pk' para bater com a URL ---
    def post(self, request, pk): 
        membership = get_object_or_404(CommunityMembership, id=pk)
        
        # Checa se o request.user é admin da community do membership
        self.check_object_permissions(request, membership) 
        
        if membership.status == 'pending':
            membership.status = 'approved'
            membership.save()
            return Response({"status": "approved"}, status=status.HTTP_200_OK)
        return Response({"error": "Membro já estava aprovado."}, status=status.HTTP_400_BAD_REQUEST)


class RemoveMemberView(generics.DestroyAPIView):
    """
    (Admin da Comunidade OU o próprio usuário) Remove um membro ou sai.
    """
    queryset = CommunityMembership.objects.all()
    serializer_class = CommunityMembershipSerializer
    # --- Permissão Atualizada (Fase 4) ---
    # Usamos IsCommunityAdmin (que checa se é dono OU admin promovido)
    permission_classes = [permissions.IsAuthenticated]

    # --- Lógica de Permissão Atualizada (Fase 4) ---
    def check_object_permission(self, request, obj):
        # Permite se: 
        # 1. Você é o próprio usuário (saindo da comunidade)
        if obj.user == request.user:
            # 1a. Não pode sair se for o DONO original (deve deletar a comunidade)
            if obj.community.admin == request.user:
                raise serializers.ValidationError("Você é o Dono da comunidade. Você não pode sair, apenas excluir a comunidade.")
            return True # É um membro normal saindo

        # 2. Você é um Admin (Dono OU is_admin=True)
        # Usamos o check do IsCommunityAdmin
        is_admin_check = IsCommunityAdmin()
        if is_admin_check.has_object_permission(request, self, obj):
            # 2a. Admins não podem remover o Dono original
            if obj.community.admin == obj.user:
                 raise serializers.ValidationError("Administradores não podem remover o Dono da comunidade.")
            return True
        
        # Se não for nenhum dos casos acima, nega
        self.permission_denied(request)

class CommunityMemberListView(generics.ListAPIView):
    """
    Lista todos os membros (e pendentes) de uma comunidade específica.
    Protegido por: IsAuthenticated (qualquer membro pode ver quem está)
    """
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        community_id = self.kwargs['community_id']
        # Garante que o usuário é membro aprovado para ver a lista
        if not CommunityMembership.objects.filter(
            community_id=community_id, 
            user=self.request.user, 
            status='approved'
        ).exists():
            raise serializers.ValidationError("Você deve ser membro para ver a lista de participantes.")
            
        return CommunityMembership.objects.filter(community_id=community_id).order_by('status', 'user__username')

class CommunityFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        community_id = self.kwargs['community_id']
        community = get_object_or_404(Community, id=community_id)
        
        if not community.members.filter(user=self.request.user, status='approved').exists():
            raise serializers.ValidationError("Você não é membro desta comunidade.")
            
        return community.community_posts.all().order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}


class CommunityPostCreateView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        community_id = self.kwargs['community_id']
        community = get_object_or_404(Community, id=community_id)
        
        if not community.members.filter(user=self.request.user, status='approved').exists():
            raise serializers.ValidationError("Você não é membro desta comunidade.")
        
        serializer.save(owner=self.request.user, community=community)


class FindCommunityByCourseView(generics.ListAPIView):
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        course = self.request.query_params.get('course', None)
        if course:
            return Community.objects.filter(related_course__icontains=course)
        return Community.objects.none()

class PromoteCommunityAdminView(APIView):
    """
    (Dono da Comunidade) Promove ou Rebaixa um membro para Admin.
    """
    permission_classes = [permissions.IsAuthenticated, IsCommunityOwner] # Apenas o Dono

    def post(self, request, pk): # pk é o ID do Membership
        membership = get_object_or_404(CommunityMembership, pk=pk)
        
        # Checa se o request.user é o DONO da comunidade
        self.check_object_permission(request, membership) 
        
        # Não pode alterar o status do Dono
        if membership.user == membership.community.admin:
            return Response({"error": "Não é possível alterar o status de Dono."}, status=status.HTTP_400_BAD_REQUEST)

        # Alterna o status de admin
        membership.is_admin = not membership.is_admin
        membership.save()
        
        return Response(CommunityMembershipSerializer(membership).data, status=status.HTTP_200_OK)

# ==============================================================================
# VIEWS DE ANÚNCIOS E NOTIFICAÇÕES (ATUALIZADAS)
# ==============================================================================

class AnnouncementListView(generics.ListAPIView):
    """
    (Alunos) Lista recados globais, da universidade ou do curso.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 2. LÓGICA DE FILTRAGEM ATUALIZADA
    def get_queryset(self):
        profile = self.request.user.profile
        
        if not profile.onboarding_complete:
            return Announcement.objects.none()
        
        # 1. Global (sem universidade E sem curso)
        global_ann = Q(target_university="", target_course="")
        
        # 2. Universidade Específica (sem curso)
        uni_ann = Q(target_university=profile.universidade, target_course="")
        
        # 3. Curso Específico
        course_ann = Q(target_university=profile.universidade, target_course=profile.curso)

        # Retorna a união (OR) dos três filtros
        return Announcement.objects.filter(
            global_ann | uni_ann | course_ann
        ).distinct().order_by('-timestamp')


class AnnouncementCreateView(generics.CreateAPIView):
    """
    (Professores/Staff) Cria um novo recado.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 3. LÓGICA DE CRIAÇÃO ATUALIZADA
    def perform_create(self, serializer):
        profile = self.request.user.profile
        
        # 3a. Checa permissão geral
        if not profile.has_permission('can_send_announcement'):
            raise serializers.ValidationError("Você não tem permissão para enviar anúncios.")
        
        # 3b. Se for Staff/Superuser, eles podem enviar o que quiserem do payload
        if self.request.user.is_staff:
            # O serializer usará 'target_university' e 'target_course' vindos do request
            serializer.save(author=self.request.user)
        else:
            # 3c. Se for Professor (não-staff), força o target para o perfil dele
            serializer.save(
                author=self.request.user,
                target_university=profile.universidade,
                target_course=profile.curso
            )


class NotificationListView(generics.ListAPIView):
    """
    Lista as notificações sociais (likes, comments) do usuário logado.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all() 


class MarkNotificationReadView(APIView):
    """
    Marca notificações sociais (like/comment) como lidas.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Marca todas as sociais como lidas
        request.user.notifications.filter(read=False).update(read=True)
        return Response(status=status.HTTP_200_OK)
    
# --- NOVAS VIEWS PARA O ÍCONE DE SINO ---

class NotificationStatusView(APIView):
    """
    Retorna a contagem de notificações sociais E recados não lidos
    para o ícone da "bolinha" priorizada.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile

        # 1. Contagem de Recados (Alta Prioridade - Vermelha)
        unread_announcements_count = 0
        if profile.onboarding_complete:
            global_ann = Q(target_university="", target_course="")
            uni_ann = Q(target_university=profile.universidade, target_course="")
            course_ann = Q(target_university=profile.universidade, target_course=profile.curso)
            
            unread_announcements_count = Announcement.objects.filter(
                global_ann | uni_ann | course_ann
            ).exclude(
                read_by=user # Exclui os que o usuário já leu
            ).distinct().count()

        # 2. Contagem Social (Baixa Prioridade - Roxa)
        unread_social_count = user.notifications.filter(read=False).count()

        return Response({
            'unread_announcements_count': unread_announcements_count,
            'unread_social_count': unread_social_count
        })

class MarkAnnouncementReadView(APIView):
    """
    Marca um recado (ou vários) como lido pelo usuário logado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ids_to_mark = request.data.get('ids', None)
        
        if ids_to_mark and isinstance(ids_to_mark, list):
            # Filtra apenas os recados que o usuário pode ver
            profile = request.user.profile
            global_ann = Q(target_university="", target_course="")
            uni_ann = Q(target_university=profile.universidade, target_course="")
            course_ann = Q(target_university=profile.universidade, target_course=profile.curso)
            
            announcements = Announcement.objects.filter(
                (global_ann | uni_ann | course_ann) & Q(id__in=ids_to_mark)
            ).distinct()
            
            # Adiciona o usuário ao M2M 'read_by'
            request.user.read_announcements.add(*announcements)
            return Response(status=status.HTTP_200_OK)
        
        return Response({"error": "Lista de 'ids' inválida."}, status=status.HTTP_400_BAD_REQUEST)

# ==============================================================================
# VIEWS DE CHAT (Existentes)
# ==============================================================================
    
class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        try:
            other_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if other_user == request.user:
            return Response({"error": "Você não pode iniciar uma conversa consigo mesmo."}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=2,
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
        
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all().order_by('-updated_at')

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        try:
            conversation = self.request.user.conversations.get(id=conversation_id)
            return conversation.messages.all()
        except Conversation.DoesNotExist:
            return Message.objects.none()

# ==============================================================================
# VIEWS DO PAINEL ADMIN (Existentes e Novas)
# ==============================================================================
        
class AdminUserListView(generics.ListAPIView):
    """
    (ADMIN) Lista todos os usuários para o painel de admin.
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser] 

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    (ADMIN) Vê ou Atualiza um usuário específico.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser] 
    lookup_field = 'id' 

class BadgeListView(generics.ListAPIView):
    """
    (ADMIN) Lista todos os Badges disponíveis (para Atribuição).
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
    permission_classes = [IsAdminUser] 

# --- CRUD DE BADGES ---

class BadgeListCreateAPIView(generics.ListCreateAPIView):
    """
    (ADMIN) Lista todos os Badges ou cria um novo Badge.
    Protegido por: IsAdminUser (is_staff=True)
    """
    queryset = Badge.objects.all().order_by('name')
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser] 

class BadgeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    (ADMIN) Vê, atualiza ou deleta um Badge específico.
    Protegido por: IsAdminUser (is_staff=True)
    """
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser]


class StatusCheckView(APIView):
    """
    Endpoint super leve usado pelo frontend para 'acordar' o servidor
    do Render (contornando o cold start) e verificar se está online.
    Não usa banco de dados nem autenticação.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, format=None):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)