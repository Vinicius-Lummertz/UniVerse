# core/routing.py
from django.urls import re_path
# Importaremos nossos consumidores de chat aqui no futuro
from . import consumers 

websocket_urlpatterns = [
    # Esta regex (expressão regular) captura o ID da conversa da URL
    # e o passa para o Consumer como 'conversation_id'
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),

]