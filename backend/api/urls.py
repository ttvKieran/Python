from rest_framework_simplejwt.views import TokenRefreshView
from django.urls import path
from api import views

urlpatterns = [
    path("token/", views.MyTokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("register/", views.RegisterView.as_view()),
    path('test/', views.testEndPoint, name='test'),
    path('', views.getRoutes),
    
    # Chat Message
    path('message/<user_id>/', views.Inbox.as_view()),
    path('message-detail/<sender_id>/<receiver_id>/', views.GetMessages.as_view()),
    path('send-message/', views.SendMessages.as_view()),
    
    # Get / Filter Data
    path('profile/<int:pk>/', views.ProfileDetail.as_view()),
    path('search/<username>/', views.SearchUser.as_view()),
]
