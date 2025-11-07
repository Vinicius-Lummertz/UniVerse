# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Posts, Profile, Reaction, Comment, Conversation, Message,
    Tag, Badge, Community, CommunityMembership, Announcement,
    Notification  # <- 1. Importe o modelo Notification
)

# --- SERIALIZERS DE ITENS PEQUENOS (Badges, Tags) ---

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['name', 'icon', 'color']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name']

# --- SERIALIZERS DE AUTENTICAÇÃO E PERFIL (User, Profile) ---

class ProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField(read_only=True)
    following_count = serializers.SerializerMethodField(read_only=True)
    is_following = serializers.SerializerMethodField(read_only=True)
    badges = BadgeSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = [
            'bio', 'profile_pic', 'cover_photo', 'pronouns',
            'followers_count', 'following_count', 'is_following',
            'universidade', 'curso', 'atletica', 'ano_inicio', 'onboarding_complete',
            'badges', 'saved_posts'
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
    # Aninha o ProfileSerializer atualizado
    profile = ProfileSerializer(read_only=True) 

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile']
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


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Adiciona dados customizados ao token
        token['username'] = user.username
        token['email'] = user.email
        return token

# --- SERIALIZERS DE POSTS E INTERAÇÕES (Post, Reaction, Comment) ---

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'emoji', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    # Adiciona a foto de perfil do autor do comentário
    user_profile_pic = serializers.ImageField(source='user.profile.profile_pic', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at', 'updated_at', 'user_profile_pic']


class PostSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    # Adiciona os badges do dono do post
    owner_badges = BadgeSerializer(many=True, read_only=True, source='owner.profile.badges')
    
    comments = CommentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True) # Mostra as tags do post
    
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
        fields = ['id', 'author', 'content', 'timestamp', 'target_course', 'target_university']

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
    # Fornece os IDs dos objetos relacionados para que o frontend possa criar links
    post_id = serializers.ReadOnlyField(source='post.id')
    community_id = serializers.ReadOnlyField(source='community.id')
    
    class Meta:
        model = Notification
        fields = [
            'id', 
            'sender_username', 
            'verb',         # "follow", "comment", etc.
            'post_id',      # ID do post (se for notificação de post)
            'community_id', # ID da comunidade (se for de aprovação)
            'read',         # true ou false
            'timestamp'
        ]