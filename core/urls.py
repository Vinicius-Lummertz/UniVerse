from django.urls import path
from .views import PostListAPIView, PostDetailsAPIView, UserCreateAPIView, UserDetailView, ProfileUpdateView


urlpatterns = [

    path('api/posts/', PostListAPIView.as_view(), name='posts_list_api'),
    path('api/posts/<int:pk>/', PostDetailsAPIView.as_view(), name='posts_details_api'),

    path('api/register/', UserCreateAPIView.as_view(), name='user_register'),

    path('api/users/<str:username>/', UserDetailView.as_view(), name='user_detail'),
    path('api/profile/', ProfileUpdateView.as_view(), name='profile-update'),

]