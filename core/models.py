from django.db import models
from django.contrib.auth.models import User 
from django.db.models import Max # 1. Importar Max

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
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True) # Mudei o upload_to
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    attachment = models.FileField(upload_to='posts/attachments/', blank=True, null=True)

    # --- NOVO CAMPO: LIGAÇÃO COM COMUNIDADE (Feature Solicitada) ---
    community = models.ForeignKey('Community', 
                                  related_name='community_posts', 
                                  on_delete=models.SET_NULL,
                                  null=True, 
                                  blank=True)

    # --- NOVO CAMPO: Tags (Feature Surpresa) ---
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")

    def __str__(self):
        return self.title

# --- MODELO ATUALIZADO: Badge (Com Flags de Permissão) ---
class Badge(models.Model):
    name = models.CharField(max_length=50, unique=True) # "Professor", "Staff UniVerse", "Líder Atlética"
    icon = models.CharField(max_length=50, blank=True) # Opcional: um nome de ícone (ex: 'academic-cap') ou emoji '🧑‍🏫'
    color = models.CharField(max_length=20, default='default') # Cor do badge no DaisyUI (ex: 'primary', 'secondary')

    # --- NOVAS FLAGS DE PERMISSÃO ---
    # Controla o acesso ao painel de /admin no frontend
    can_access_admin_panel = models.BooleanField(default=False) 
    
    # Controla a criação de anúncios
    can_send_announcement = models.BooleanField(default=False)
    
    # Controla a moderação global (deletar post de outros)
    can_moderate_global_posts = models.BooleanField(default=False)
    
    # (Futuro) Controla moderação de posts apenas em comunidades
    # can_moderate_community_posts = models.BooleanField(default=False) 

    permissions = models.JSONField(default=dict)

    def save(self, *args, **kwargs):
        if not self.permissions:
            self.permissions = {
                'can_create_posts': False,
                'can_edit_any_post': False,
                'can_delete_any_post': False,
                'can_comment': False,
                'can_react': False,
                'can_create_community': False,
                'can_join_community': False,
                'can_send_announcement': False,  # Added for professors
                'max_communities': 0,
                'can_be_admin': False,
                'is_professor': False,
                'is_student': False
            }
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

    # --- NOVOS CAMPOS: ONBOARDING UNIVERSITÁRIO (Feature Solicitada) ---
    universidade = models.CharField(max_length=200, blank=True)
    curso = models.CharField(max_length=200, blank=True)
    atletica = models.CharField(max_length=100, blank=True)
    ano_inicio = models.IntegerField(null=True, blank=True) # Sugestão: "ano de início"
    onboarding_complete = models.BooleanField(default=False) # Para controlar o pop-up

    # --- NOVOS CAMPOS: FEATURES SURPRESA ---
    cover_photo = models.ImageField(upload_to='cover_photos/', null=True, blank=True)
    pronouns = models.CharField(max_length=20, blank=True) # ex: "Ela/Dela"
    
    saved_posts = models.ManyToManyField(Posts, blank=True, related_name="saved_by_profiles")

    def __str__(self):
        return f'{self.user.username} Profile'

    # --- NOVOS MÉTODOS DE PERMISSÃO ---
    def has_permission(self, permission_name):
        """Check if user has permission through any of their badges"""
        return any(
            badge.permissions.get(permission_name, False)
            for badge in self.badges.all()
        ) or self.user.is_staff
    
    @property
    def is_admin(self):
        """
        Propriedade para checar se tem acesso ao painel de admin.
        Usado pelo AdminRoute no frontend.
        """
        return self.has_permission('can_access_admin_panel')
    

class Announcement(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    target_university = models.CharField(max_length=200, blank=True)
    target_course = models.CharField(max_length=200, blank=True) 

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Anúncio de {self.author.username} para {self.target_course or self.target_university or 'Global'}"
    
# ... (Reaction, Comment, Community, CommunityMembership, Notification, Conversation, Message) ...
# (O restante dos modelos permanece o mesmo)
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