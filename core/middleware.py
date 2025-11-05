# core/middleware.py
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token_key):
    try:
        # Valida o token de acesso
        token = AccessToken(token_key)
        # Pega o ID do usuário do token
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception as e:
        print(f"Erro ao autenticar token: {e}")
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Middleware de autenticação por Token para WebSockets.
    Pega o token da string de query da URL.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Pega a string de query da conexão
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        
        # Pega o token (pega o primeiro item da lista de 'token')
        token = query_params.get('token', [None])[0]

        if token:
            # Se tiver token, busca o usuário no banco
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await self.app(scope, receive, send)