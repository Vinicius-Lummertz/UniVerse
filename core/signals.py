# core/signals.py
from django.db.models.signals import post_save, m2m_changed
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile, Comment, CommunityMembership, Notification

# ==============================================================================
# SINAIS DE CRIAÇÃO DE PERFIL (Existentes)
# ==============================================================================

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    """
    Cria um objeto Profile automaticamente sempre que um novo User é criado.
    """
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    """
    Salva o Profile associado sempre que o User é salvo.
    """
    instance.profile.save()

# ==============================================================================
# SINAIS DE NOTIFICAÇÃO (Novos)
# ==============================================================================

@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    """
    Cria uma notificação quando um novo comentário é feito em um post.
    """
    if created:
        recipient = instance.post.owner # O dono do post
        sender = instance.user          # O autor do comentário
        
        # Não envie notificação se você comentar no seu próprio post
        if recipient != sender:
            Notification.objects.create(
                recipient=recipient,
                sender=sender,
                verb='comment',
                post=instance.post,
                comment=instance
            )

@receiver(post_save, sender=CommunityMembership)
def create_membership_approval_notification(sender, instance, created, **kwargs):
    """
    Cria uma notificação quando a entrada de um usuário em uma
    comunidade privada é 'aprovada' pelo admin.
    """
    # Nós só nos importamos com ATUALIZAÇÕES (não criação)
    # E apenas se o status for 'approved'
    if not created and instance.status == 'approved':
        # 'update_fields' nos diz quais campos foram salvos.
        # Se 'status' foi um dos campos atualizados, criamos a notificação.
        update_fields = kwargs.get('update_fields') or set()
        if 'status' in update_fields:
            recipient = instance.user                # O usuário que foi aprovado
            sender = instance.community.admin      # O admin que aprovou
            
            if recipient != sender:
                Notification.objects.get_or_create(
                    recipient=recipient,
                    sender=sender,
                    verb='membership_approved',
                    community=instance.community
                )

@receiver(m2m_changed, sender=Profile.following.through)
def create_follow_notification(sender, instance, action, pk_set, **kwargs):
    """
    Cria uma notificação quando um usuário começa a seguir outro.
    
    'instance' é o Perfil (Profile) do usuário que CLICOU EM "SEGUIR".
    'pk_set' é um conjunto de IDs dos perfis que COMEÇARAM A SER SEGUIDOS.
    """
    # 'post_add' significa que uma nova relação foi adicionada
    if action == 'post_add':
        sender_user = instance.user # O usuário que está seguindo
        
        # 'pk_set' pode ter múltiplos IDs, então iteramos sobre ele
        for pk in pk_set:
            recipient_profile = Profile.objects.get(pk=pk)
            recipient_user = recipient_profile.user # O usuário que FOI seguido
            
            if recipient_user != sender_user:
                Notification.objects.get_or_create(
                    recipient=recipient_user,
                    sender=sender_user,
                    verb='follow'
                )

# NOTA: O sinal para 'reaction' (curtida) é muito "barulhento" e
# pode sobrecarregar o sistema. É comum implementar reações
# sem notificações, ou agrupá-las (ex: "Fulano e outros 3 reagiram...").
# Por isso, deixei de fora por enquanto para manter a performance.