from django.db import models
from django.contrib.auth.models import User 

class Posts(models.Model):
    owner = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    attachment = models.FileField(upload_to='posts/attachments/', blank=True, null=True)

    def __str__(self):
        return self.title
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    following = models.ManyToManyField("self", 
                                       related_name="followers", 
                                       symmetrical=False, 
                                       blank=True)
    
    def __str__(self):
        return f'{self.user.username} Profile'

class Reaction(models.Model):
    post = models.ForeignKey(Posts, related_name='reactions', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=5) # Armazena o caractere emoji
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Garante que um usuário só pode reagir uma vez por post
        unique_together = ('post', 'user')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.username} reacted {self.emoji} to post {self.post.pk}'

class Comment(models.Model):
    post = models.ForeignKey(Posts, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at'] # Comentários mais antigos primeiro

    def __str__(self):
        return f'Comment by {self.user.username} on post {self.post.pk}'
    
class Conversation(models.Model):
    # Relaciona os participantes (usuários) da conversa
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
        ordering = ['timestamp'] # Ordena as mensagens da mais antiga para a mais nova

    def __str__(self):
        return f"Mensagem de {self.author.username} em {self.timestamp.strftime('%Y-%m-%d %H:%M')}"