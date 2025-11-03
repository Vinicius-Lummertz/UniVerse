from rest_framework import serializers
from .models import Posts
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile, Comment, Reaction


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
    # Aninha os comentários (apenas leitura)
    comments = CommentSerializer(many=True, read_only=True)
    # Campo para contagem de reações e se o usuário atual reagiu
    reactions_summary = serializers.SerializerMethodField(read_only=True)
    current_user_reaction = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Posts
        fields = [
            'pk', 'owner', 'title', 'content', 'image', 'video', 'attachment', 'createdAt', 'updatedAt',
            'comments', 'reactions_summary', 'current_user_reaction'
        ]

    def get_reactions_summary(self, obj):
        # Agrupa reações por emoji e conta
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

class ProfileSerializer(serializers.ModelSerializer):
    
    followers_count = serializers.SerializerMethodField(read_only=True)
    following_count = serializers.SerializerMethodField(read_only=True)
    # Novo campo para saber se o usuário logado segue este perfil
    is_following = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['bio', 'profile_pic', 'followers_count', 'following_count', 'is_following']
    
    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        # Pega o usuário logado (request.user) do "contexto" do serializer
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Checa se o usuário logado está na lista de seguidores do perfil (obj)
        return obj.followers.filter(user=request.user).exists()

class UserSerializer(serializers.ModelSerializer):

    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}


    def create(self, validated_data):
        user = User.objects.create_user(
            username = validated_data['username'],
            email = validated_data['email'],
            password = validated_data['password']
        )

        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Pega o token padrão (com 'access' e 'refresh')
        token = super().get_token(user)

        # Adiciona claims (dados) customizados ao payload do token
        token['username'] = user.username
        token['email'] = user.email
        # ... outros campos do usuário

        return token
    
class ProfileSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_pic']

# NOVO Serializer para a busca de User
class UserSearchSerializer(serializers.ModelSerializer):
    profile = ProfileSearchSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['username', 'profile']

