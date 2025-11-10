from rest_framework import permissions
from rest_framework.permissions import BasePermission

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
    Permissão para checar se o usuário é o admin da comunidade.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'admin'):
            # Permite se for o admin da comunidade OU superuser
            return obj.admin == request.user or request.user.is_superuser
        if hasattr(obj, 'community'):
            # Permite se for o admin da comunidade OU superuser
            return obj.community.admin == request.user or request.user.is_superuser
        
        return False
    
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