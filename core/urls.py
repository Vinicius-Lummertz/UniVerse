# core/urls.py
from django.urls import path
from .views import (
    # Posts e Interações
    PostListAPIView, 
    PostDetailsAPIView,
    CommentListCreateView, 
    ReactionCreateDeleteView,
    ToggleSavePostView,
    HashtagPostListView,

    # Usuário e Perfil
    UserCreateAPIView,
    UserSearchView,
    UserDetailView, 
    UserUpdateView,
    ProfileUpdateView, 
    UserDeleteView,

    # Feeds e Seguir
    FollowUserView, 
    FollowingPostsFeedView,
    SavedPostListView,

    # Chat
    StartConversationView, 
    ConversationListView, 
    MessageListView,

    # Comunidades
    CommunityCreateView,
    CommunityListView,
    CommunityDetailView,
    JoinCommunityView,
    ApproveMemberView,
    RemoveMemberView,
    CommunityFeedView,
    CommunityPostCreateView,
    FindCommunityByCourseView,

    # Anúncios e Notificações
    AnnouncementListView,
    AnnouncementCreateView,
    NotificationListView,
    MarkNotificationReadView,
)

# A ordem dos paths está organizada por recurso e respeita
# a regra de "específico antes de genérico"

urlpatterns = [

    # --- Posts, Comentários, Reações ---
    path('api/posts/', PostListAPIView.as_view(), name='posts_list_api'),
    path('api/posts/tags/<str:tag_name>/', HashtagPostListView.as_view(), name='post-hashtag-list'),
    path('api/posts/<int:pk>/', PostDetailsAPIView.as_view(), name='posts_details_api'),
    path('api/posts/<int:post_pk>/comments/', CommentListCreateView.as_view(), name='post-comments'),
    path('api/posts/<int:post_pk>/react/', ReactionCreateDeleteView.as_view(), name='post-react'),
    path('api/posts/<int:post_pk>/save/', ToggleSavePostView.as_view(), name='post-save'),

    # --- Usuário, Perfil e Busca ---
    path('api/register/', UserCreateAPIView.as_view(), name='user_register'),
    path('api/users/search/', UserSearchView.as_view(), name='user-search'), # Específico
    path('api/users/<str:username>/follow/', FollowUserView.as_view(), name='follow-user'), # Genérico
    path('api/users/<str:username>/', UserDetailView.as_view(), name='user_detail'), # Genérico
    path('api/user/update/', UserUpdateView.as_view(), name='user-update'),
    path('api/profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('api/profile/delete/', UserDeleteView.as_view(), name='user-delete'),

    # --- Feeds ---
    path('api/feed/following/', FollowingPostsFeedView.as_view(), name='following-feed'),
    path('api/feed/saved/', SavedPostListView.as_view(), name='feed-saved'),

    # --- Chat ---
    path('api/chat/start/<str:username>/', StartConversationView.as_view(), name='start-chat'),
    path('api/chat/conversations/', ConversationListView.as_view(), name='chat-list'),
    path('api/chat/conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='chat-messages'),

    # --- Comunidades ---
    path('api/communities/', CommunityListView.as_view(), name='community-list'),
    path('api/communities/create/', CommunityCreateView.as_view(), name='community-create'),
    path('api/communities/find-by-course/', FindCommunityByCourseView.as_view(), name='community-find-by-course'),
    path('api/communities/<int:community_id>/', CommunityDetailView.as_view(), name='community-detail'),
    path('api/communities/<int:community_id>/join/', JoinCommunityView.as_view(), name='community-join'),
    path('api/communities/<int:community_id>/feed/', CommunityFeedView.as_view(), name='community-feed'),
    path('api/communities/<int:community_id>/post/', CommunityPostCreateView.as_view(), name='community-post-create'),
    path('api/communities/members/<int:pk>/approve/', ApproveMemberView.as_view(), name='community-approve-member'), # 'pk' é o ID da Inscrição (Membership)
    path('api/communities/members/<int:pk>/remove/', RemoveMemberView.as_view(), name='community-remove-member'), # 'pk' é o ID da Inscrição (Membership)

    # --- Anúncios (Professores) ---
    path('api/announcements/', AnnouncementListView.as_view(), name='announcement-list'),
    path('api/announcements/create/', AnnouncementCreateView.as_view(), name='announcement-create'),
    
    # --- Notificações (Like, Follow, etc) ---
    path('api/notifications/', NotificationListView.as_view(), name='notification-list'),
    path('api/notifications/mark-read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]