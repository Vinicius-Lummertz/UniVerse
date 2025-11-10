from django.db import models
from django.contrib.auth.models import User 
from django.db.models import Max, Q # 1. Importar Q

# --- NOVO MODELO: Tag (para #hashtags) ---
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

# --- MODELO ATUALIZADO: Posts ---
class Posts(models.Model):
    owner = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True) 
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    attachment = models.FileField(upload_to='posts/attachments/', blank=True, null=True)

    community = models.ForeignKey('Community', 
                                  related_name='community_posts', 
                                  on_delete=models.SET_NULL, 
                                  null=True, 
                                  blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")

    def __str__(self):
        return self.title

# --- MODELO ATUALIZADO: Badge (Com JSONField de Permissão) ---
class Badge(models.Model):
    name = models.CharField(max_length=50, unique=True) 
    icon = models.CharField(max_length=50, blank=True) 
    color = models.CharField(max_length=20, default='default') 

    # --- CAMPO DE PERMISSÃO ATUALIZADO ---
    # Substitui os BooleanFields individuais por um JSONField
    permissions = models.JSONField(default=dict, blank=True)

    # 2. Adiciona o método save sugerido para popular defaults
    def save(self, *args, **kwargs):
        # Define um schema padrão se estiver vazio
        default_perms = {
            'can_access_admin_panel': False,
            'can_send_announcement': False,
            'can_moderate_global_posts': False
        }
        
        # Garante que o dict 'permissions' exista e tenha as chaves padrão
        if not self.permissions:
             self.permissions = default_perms
        else:
            # Garante que novas chaves sejam adicionadas se faltarem
            for key, value in default_perms.items():
                self.permissions.setdefault(key, value)
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# --- MODELO ATUALIZADO: Profile (Com Métodos de Permissão) ---
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    following = models.ManyToManyField("self", 
                                       related_name="followers", 
                                       symmetrical=False, 
                                       blank=True)
    badges = models.ManyToManyField(Badge, blank=True)

    universidade = models.CharField(max_length=200, blank=True)
    curso = models.CharField(max_length=200, blank=True)
    atletica = models.CharField(max_length=100, blank=True)
    ano_inicio = models.IntegerField(null=True, blank=True) 
    onboarding_complete = models.BooleanField(default=False) 

    cover_photo = models.ImageField(upload_to='cover_photos/', null=True, blank=True)
    pronouns = models.CharField(max_length=20, blank=True) 
    saved_posts = models.ManyToManyField(Posts, blank=True, related_name="saved_by_profiles")

    def __str__(self):
        return f'{self.user.username} Profile'

    # --- MÉTODO DE PERMISSÃO ATUALIZADO ---
    def has_permission(self, permission_name):
        """
        Verifica se o usuário tem uma permissão específica com base em QUALQUER
        um de seus badges, consultando o JSONField.
        Ex: profile.has_permission('can_send_announcement')
        """
        # 3. Superusuários (staff) sempre têm permissão
        if self.user.is_staff:
            return True
            
        # 4. Constroem a query para o JSONField
        # Ex: permissions__can_send_announcement=True
        query_filter = {f'permissions__{permission_name}': True}
        
        # 5. Verifica se *algum* badge associado tem essa flag ativada
        return self.badges.filter(**query_filter).exists()
    
    @property
    def is_admin(self):
        """
        Propriedade para checar se tem acesso ao painel de admin.
        """
        # 6. Usa o novo método has_permission
        return self.has_permission('can_access_admin_panel')
    

# --- MODELO ATUALIZADO: Announcement ---
class Announcement(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # 7. Ambos são blank=True para permitir segmentação
    target_university = models.CharField(max_length=200, blank=True)
    target_course = models.CharField(max_length=200, blank=True) 

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Anúncio de {self.author.username} para {self.target_course or self.target_university or 'Global'}"
    
# --- (Restante dos modelos Reaction, Comment, Community, etc. permanecem iguais) ---

class Reaction(models.Model):
    post = models.ForeignKey(Posts, related_name='reactions', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reactions', on_delete=models.CASCADE) 
    emoji = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('post', 'user')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.username} reacted {self.emoji} to post {self.post.pk}'

class Comment(models.Model):
    post = models.ForeignKey(Posts, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='comments', on_delete=models.CASCADE) 
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at'] 

    def __str__(self):
        return f'Comment by {self.user.username} on post {self.post.pk}'
    
    
class Community(models.Model):
    admin = models.ForeignKey(User, related_name='owned_communities', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    PRIVACY_CHOICES = [
        ('public', 'Pública'), 
        ('private', 'Privada'),
    ]
    privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')
    
    related_course = models.CharField(max_length=200, blank=True) 

    community_image = models.ImageField(upload_to='community_images/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='community_covers/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class CommunityMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="members")
    date_joined = models.DateTimeField(auto_now_add=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('approved', 'Aprovado'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='approved')
    
    class Meta:
        unique_together = ('user', 'community')

    def __str__(self):
        return f'{self.user.username} - {self.community.name} ({self.status})'

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    
    VERB_CHOICES = [
        ('follow', 'começou a te seguir.'),
        ('reaction', 'reagiu ao seu post:'),
        ('comment', 'comentou no seu post:'),
        ('membership_approved', 'aprovou sua entrada na comunidade:'),
    ]
    verb = models.CharField(max_length=50, choices=VERB_CHOICES)
    
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, null=True, blank=True)

    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.sender.username} {self.verb} -> {self.recipient.username}'

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversa entre {', '.join([user.username for user in self.participants.all()])}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    author = models.ForeignKey(User, related_name='messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp'] 

    def __str__(self):
        return f"Mensagem de {self.author.username} em {self.timestamp.strftime('%Y-%m-%d %H:%M')}"