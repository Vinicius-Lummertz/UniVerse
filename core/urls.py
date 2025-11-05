from django.urls import path
from .views import PostListAPIView, PostDetailsAPIView, UserCreateAPIView, UserDetailView, ProfileUpdateView, FollowUserView, FollowingPostsFeedView, UserDeleteView, UserSearchView, CommentListCreateView, ReactionCreateDeleteView, StartConversationView, ConversationListView, MessageListView


urlpatterns = [

    path('api/posts/', PostListAPIView.as_view(), name='posts_list_api'),
    path('api/posts/<int:pk>/', PostDetailsAPIView.as_view(), name='posts_details_api'),
    path('api/posts/<int:post_pk>/comments/', CommentListCreateView.as_view(), name='post-comments'),
    path('api/posts/<int:post_pk>/react/', ReactionCreateDeleteView.as_view(), name='post-react'),

    path('api/register/', UserCreateAPIView.as_view(), name='user_register'),

    path('api/users/search/', UserSearchView.as_view(), name='user-search'),
    path('api/users/<str:username>/follow/', FollowUserView.as_view(), name='follow-user'),
    path('api/users/<str:username>/', UserDetailView.as_view(), name='user_detail'),
    
    path('api/profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('api/profile/delete/', UserDeleteView.as_view(), name='user-delete'),
    path('api/feed/following/', FollowingPostsFeedView.as_view(), name='following-feed'),

    path('api/chat/start/<str:username>/', StartConversationView.as_view(), name='start-chat'),
    path('api/chat/conversations/', ConversationListView.as_view(), name='chat-list'),
    path('api/chat/conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='chat-messages'),
]   