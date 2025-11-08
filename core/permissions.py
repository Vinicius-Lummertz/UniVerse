from rest_framework import permissions
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(permissions.BasePermission):
    
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para qualquer requisição (GET, HEAD, OPTIONS).
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissões de escrita (PUT, DELETE) só são permitidas para o dono do post.
        return obj.owner == request.user
    
class IsCommunityAdmin(permissions.BasePermission):
    """
    Permissão para checar se o usuário é o admin da comunidade.
    """
    def has_object_permission(self, request, view, obj):
        # O 'obj' aqui será a 'Community' ou 'CommunityMembership'
        # Se o obj for a Comunidade:
        if hasattr(obj, 'admin'):
            return obj.admin == request.user
        # Se o obj for a Inscrição (Membership):
        if hasattr(obj, 'community'):
            return obj.community.admin == request.user
        
        return False
    
class IsAdminUser(BasePermission):
    """
    Permite acesso apenas a usuários admin (is_staff=True).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff