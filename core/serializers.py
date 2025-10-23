from rest_framework import serializers
from .models import Posts
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class PostSerializer(serializers.ModelSerializer):
    
    owner = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = Posts
        fields = ['pk', 'owner', 'title', 'content', 'createdAt', 'updatedAt']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
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