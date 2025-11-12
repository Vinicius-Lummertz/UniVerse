# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Posts, Profile, Reaction, Comment, Conversation, Message,
    Tag, Badge, Community, CommunityMembership, Announcement,
    Notification  
)

# --- SERIALIZER ATUALIZADO: Badge ---
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        # 1. Substitui os booleans pelo JSONField
        fields = ['id', 'name', 'icon', 'color', 'permissions']
        
    # 2. Adiciona a validação sugerida
    def validate_permissions(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a dictionary")
        
        # 3. Garante que as chaves padrão existam ao salvar
        default_keys = [
            'can_access_admin_panel', 'can_send_announcement', 
            'can_moderate_global_posts'
        ]
        for key in default_keys:
            if key not in value:
                value[key] = False # Define o padrão se estiver ausente
                
        return value

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name']

# --- SERIALIZERS DE AUTENTICAÇÃO E PERFIL (User, Profile) ---

class ProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField(read_only=True)
    following_count = serializers.SerializerMethodField(read_only=True)
    is_following = serializers.SerializerMethodField(read_only=True)
    badges = BadgeSerializer(many=True, read_only=True) # Agora usará o BadgeSerializer atualizado
    is_admin = serializers.ReadOnlyField() # Esta propriedade agora lê 'profile.is_admin'

    class Meta:
        model = Profile
        fields = [
            'bio', 'profile_pic', 'cover_photo', 'pronouns',
            'followers_count', 'following_count', 'is_following',
            'universidade', 'curso', 'atletica', 'ano_inicio', 'onboarding_complete',
            'badges', 'saved_posts',
            'is_admin' # 'is_admin' é essencial para o AdminRoute
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(user=request.user).exists()


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True) 

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email']


# --- Serializer do Painel Admin (Atribuição de Badges) ---
class AdminProfileSerializer(serializers.ModelSerializer):
    badges = BadgeSerializer(many=True, read_only=True) # Mostra badges atuais
    badge_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Badge.objects.all(), 
        write_only=True, 
        source='badges' # Ao escrever, usa o campo 'badges'
    )

    class Meta:
        model = Profile
        fields = ['bio', 'profile_pic', 'universidade', 'curso', 'atletica', 'ano_inicio', 'onboarding_complete', 'badges', 'badge_ids']

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer para o Admin ver e editar Usuários.
    Inclui o perfil aninhado.
    """
    profile = AdminProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # O AdminProfileSerializer lida apenas com a *atribuição* de 'badge_ids'
        # Não mexe com o 'permissions' do badge em si.
        profile_serializer = AdminProfileSerializer(instance.profile, data=profile_data, partial=True)
        
        if profile_serializer.is_valid():
            profile_serializer.save()
        else:
            raise serializers.ValidationError(profile_serializer.errors)

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.save()
        
        return instance

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token

# --- (O restante dos serializers Post, Comment, Reaction, etc. permanecem iguais) ---

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'emoji', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    user_profile_pic = serializers.ImageField(source='user.profile.profile_pic', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at', 'updated_at', 'user_profile_pic']


class PostSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_badges = BadgeSerializer(many=True, read_only=True, source='owner.profile.badges')
    comments = CommentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True) 
    reactions_summary = serializers.SerializerMethodField(read_only=True)
    current_user_reaction = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Posts
        fields = [
            'pk', 'owner', 'owner_badges', 'title', 'content', 'image', 'video', 'attachment',
            'community', 'tags', 'createdAt', 'updatedAt',
            'comments', 'reactions_summary', 'current_user_reaction'
        ]

    def get_reactions_summary(self, obj):
        summary = {}
        reactions = obj.reactions.all()
        for reaction in reactions:
            summary[reaction.emoji] = summary.get(reaction.emoji, 0) + 1
        return summary

    def get_current_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                reaction = obj.reactions.get(user=request.user)
                return ReactionSerializer(reaction).data
            except Reaction.DoesNotExist:
                return None
        return None

# --- SERIALIZERS DE COMUNIDADE E ANÚNCIOS ---

class CommunitySerializer(serializers.ModelSerializer):
    admin = serializers.ReadOnlyField(source='admin.username')
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'description', 'privacy', 'related_course', 'admin',
            'community_image', 'cover_image', 'created_at'
        ]

class CommunityMembershipSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    community = serializers.ReadOnlyField(source='community.name')
    
    class Meta:
        model = CommunityMembership
        fields = ['id', 'user', 'community', 'date_joined', 'status']

class AnnouncementSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Announcement
        fields = ['id', 'author', 'content', 'timestamp', 'target_course', 'target_university', 'read_by']

# --- SERIALIZERS DO CHAT ---

class MessageSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Message
        fields = ['id', 'author', 'author_username', 'content', 'timestamp']
        read_only_fields = ['author']


class ConversationSerializer(serializers.ModelSerializer):
    participant_usernames = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participant_usernames', 'last_message', 'updated_at']

    def get_participant_usernames(self, obj):
        return [user.username for user in obj.participants.all()]

    def get_last_message(self, obj):
        last_msg = obj.messages.all().last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

# --- SERIALIZERS DA BUSCA ---

class ProfileSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_pic']


class UserSearchSerializer(serializers.ModelSerializer):
    profile = ProfileSearchSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['username', 'profile']

# --- SERIALIZER FALTANTE (NOTIFICAÇÕES) ---

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializa os dados de uma notificação para a API.
    """
    sender_username = serializers.ReadOnlyField(source='sender.username')
    post_id = serializers.ReadOnlyField(source='post.id')
    community_id = serializers.ReadOnlyField(source='community.id')
    
    class Meta:
        model = Notification
        fields = [
            'id', 
            'sender_username', 
            'verb',         
            'post_id',      
            'community_id', 
            'read',         
            'timestamp'
        ]