# core/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Conversation, User
from .serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        print("\n--- [WebSocket] Nova Conexão ---")
        
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        self.user = self.scope['user']
        
        print(f"[WebSocket] Usuário: {self.user} (Autenticado: {self.user.is_authenticated})")
        print(f"[WebSocket] Tentando entrar na sala: {self.room_group_name}")

        if not self.user.is_authenticated:
            print("[WebSocket] FALHA: Usuário não autenticado. Fechando conexão.")
            await self.close()
            return

        is_participant = await self.is_user_participant(self.conversation_id, self.user)
        if not is_participant:
            print(f"[WebSocket] FALHA: Usuário {self.user} não é participante da conversa {self.conversation_id}. Fechando conexão.")
            await self.close()
            return
            
        print("[WebSocket] SUCESSO: Usuário é participante.")
        self.conversation = await self.get_conversation(self.conversation_id)

        try:
            # 4. Adiciona o canal do usuário ao grupo do Redis
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print(f"[WebSocket] SUCESSO: Adicionado ao grupo Redis '{self.room_group_name}'")
        except Exception as e:
            print(f"[WebSocket] FALHA AO CONECTAR AO REDIS: {e}")
            await self.close()
            return

        # 5. Aceita a conexão WebSocket
        await self.accept()
        print("[WebSocket] Conexão aceita.")

    async def disconnect(self, close_code):
        print(f"[WebSocket] Desconectado da sala: {self.room_group_name}")
        # Remove o canal do grupo do Redis ao desconectar
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            print("[WebSocket] Removido do grupo Redis.")
        except Exception as e:
             print(f"[WebSocket] Erro ao remover do grupo Redis: {e}")

    # Chamado quando o servidor recebe uma mensagem do WebSocket (do frontend)
    async def receive(self, text_data):
        print(f"[WebSocket] Mensagem recebida: {text_data}")
        data = json.loads(text_data)
        message_content = data['message']

        new_message = await self.create_message(self.conversation, self.user, message_content)
        serializer = MessageSerializer(new_message)
        message_data = serializer.data
        print("[WebSocket] Mensagem salva no DB.")

        try:
            # Envia a mensagem para o grupo do Redis (broadcast)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message', 
                    'message': message_data
                }
            )
            print("[WebSocket] Mensagem enviada ao grupo Redis.")
        except Exception as e:
            print(f"[WebSocket] FALHA AO ENVIAR PARA O REDIS: {e}")

    # Chamado quando o Consumer recebe uma mensagem do grupo do Redis
    async def chat_message(self, event):
        message = event['message']
        print(f"[WebSocket] Recebida mensagem do grupo para enviar ao cliente: {message['content']}")
        
        # Envia a mensagem pelo WebSocket de volta para o navegador do cliente
        await self.send(text_data=json.dumps(message))

    # --- Funções Auxiliares de Banco de Dados ---
    @database_sync_to_async
    def is_user_participant(self, conversation_id, user):
        print(f"[DB Check] Verificando se {user} está em {conversation_id}...")
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            is_member = user in conversation.participants.all()
            print(f"[DB Check] É participante: {is_member}")
            return is_member
        except Conversation.DoesNotExist:
            print("[DB Check] Conversa não existe.")
            return False
            
    @database_sync_to_async
    def get_conversation(self, conversation_id):
        return Conversation.objects.get(id=conversation_id)

    @database_sync_to_async
    def create_message(self, conversation, user, content):
        return Message.objects.create(
            conversation=conversation,
            author=user,
            content=content
        )