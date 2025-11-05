# config/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
# Remova o AuthMiddlewareStack padrão do Django
# from channels.auth import AuthMiddlewareStack 
import core.routing 
# Importe nosso novo middleware
from core.middleware import TokenAuthMiddleware 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware( # 1. Use nosso middleware
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})