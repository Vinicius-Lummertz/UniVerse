from rest_framework import permissions
from rest_framework.permissions import BasePermission
from .models import CommunityMembership

class IsOwnerOrReadOnly(permissions.BasePermission):
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permite escrita se for o dono
        if obj.owner == request.user:
            return True
        
        # Permite escrita se tiver o badge de moderador global
        return request.user.profile.has_permission('can_moderate_global_posts')
    
class IsCommunityAdmin(permissions.BasePermission):
    """
    Permissão para checar se o usuário é o DONO (admin) 
    OU um membro com a flag is_admin=True.
    Usado para aprovar/remover membros.
    """
    def has_object_permission(self, request, view, obj):
        community = None
        # Tenta extrair a comunidade do objeto (seja a própria Comunidade ou um Membership)
        if hasattr(obj, 'community'): # obj é CommunityMembership
            community = obj.community
        elif hasattr(obj, 'admin'): # obj é Community
            community = obj
        else:
            return False 

        if not request.user.is_authenticated:
            return False
        
        # Superusuários sempre têm permissão
        if request.user.is_superuser:
            return True

        # Check 1: É o Dono (criador)?
        if community.admin == request.user:
            return True
        
        # Check 2: É um membro promovido a admin?
        return CommunityMembership.objects.filter(
            community=community, 
            user=request.user, 
            is_admin=True, 
            status='approved'
        ).exists()

# --- NOVA CLASSE DE PERMISSÃO ---
class IsCommunityOwner(BasePermission):
    """
    Permissão para checar se o usuário é o DONO (criador) original.
    Usado para ações destrutivas ou de alta hierarquia (ex: deletar a comunidade,
    promover/rebaixar outros admins).
    """
    def has_object_permission(self, request, view, obj):
        community = None
        if hasattr(obj, 'community'): # obj é CommunityMembership
            community = obj.community
        elif hasattr(obj, 'admin'): # obj é Community
            community = obj
        else:
            return False

        if not request.user.is_authenticated:
            return False

        # Superusuários sempre têm permissão
        if request.user.is_superuser:
            return True
        
        # Apenas o dono original (community.admin) pode
        return community.admin == request.user
    
class IsAdminUser(BasePermission):
    """
    Permite acesso apenas a usuários admin (is_staff=True).
    Isso protege os endpoints da API de admin.
    """
    def has_permission(self, request, view):
        # Apenas usuários logados que são staff (superusers) podem acessar
        return request.user and request.user.is_staff

# (Opcional, mas recomendado para ações perigosas no futuro)
class IsSuperUser(BasePermission):
    """
    Permite acesso apenas ao Superusuário.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser