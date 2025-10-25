from rest_framework import serializers
from .models import Posts
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile 

class PostSerializer(serializers.ModelSerializer):
    
    owner = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = Posts
        fields = ['pk', 'owner', 'title', 'image', 'content', 'createdAt', 'updatedAt']

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