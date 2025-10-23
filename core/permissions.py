from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para qualquer requisição (GET, HEAD, OPTIONS).
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissões de escrita (PUT, DELETE) só são permitidas para o dono do post.
        return obj.owner == request.user