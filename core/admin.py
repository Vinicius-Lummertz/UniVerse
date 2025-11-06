# core/admin.py
from django.contrib import admin
from .models import (
    Posts, Profile, Reaction, Comment, Conversation, Message,
    Tag, Badge, Community, CommunityMembership, Announcement, Notification
)

# --- Registros Simples ---
# A maioria dos modelos só precisa ser registrada
admin.site.register(Posts)
admin.site.register(Reaction)
admin.site.register(Comment)
admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(Tag)
admin.site.register(Badge)
admin.site.register(Announcement)
admin.site.register(Notification)

# --- Registros Customizados (para melhor usabilidade) ---

# Define quais campos do Profile aparecem na lista de usuários
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Perfis'
    fk_name = 'user'
    # Mostra os novos campos de onboarding
    fields = ('profile_pic', 'bio', 'universidade', 'curso', 'atletica', 'ano_inicio', 'onboarding_complete', 'badges')
    filter_horizontal = ('badges', 'saved_posts',) # Facilita a seleção de M2M

# Desregistra o User padrão para adicionar o Profile
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline, )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    list_select_related = ('profile', )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super(CustomUserAdmin, self).get_inline_instances(request, obj)

# Re-registra o User com o Profile "embutido"
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# Customiza a visualização da Comunidade
@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'privacy', 'related_course', 'created_at')
    list_filter = ('privacy', 'related_course')
    search_fields = ('name', 'admin__username')

# Customiza a visualização das Inscrições (Memberships)
@admin.register(CommunityMembership)
class CommunityMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'status', 'date_joined')
    list_filter = ('status', 'community')
    search_fields = ('user__username', 'community__name')