from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import OuterRef, Subquery
from django.db.models import Q
from django.conf import settings

from api.models import User, Profile, ChatMessage
from api.serializer import UserSerializer, MyTokenObtainPairSerializer, RegisterSerializer, ChatMessageSerializer, ProfileSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = ([AllowAny])
    serializer_class = RegisterSerializer

# Get All Routes
@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token/',
        '/api/register/',
        '/api/token/refresh/'
    ]
    return Response(routes)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
    if request.method == "GET":
        response = f"{request.user}, You are seeing a GET response"
        return Response({'response': response}, status=status.HTTP_200_OK)
    elif request.method == "POST":
        text = request.POST.get("text")
        response = f"{request.user}, Your text is {text}"
        return Response({'response': response}, status=status.HTTP_200_OK)
    return Response({}, status=status.HTTP_400_BAD_REQUEST)

# Chat API
class Inbox(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    # queryset = Profile.objects.all()
    # permission_classes = [IsAuthenticated]  

    # def get_queryset(self):
    #     user_id = self.kwargs['user_id'] # Lấy user_id từ URL

    #     # Lấy ID tin nhắn cuối cùng cho mỗi conversation
    #     last_messages = ChatMessage.objects.filter(
    #         # OuterRef('id') đang tham chiếu đến trường id của User từ truy vấn bên ngoài
    #         # Q objects được dùng để tạo các điều kiện phức tạp trong filter
    #         Q(sender=OuterRef('id'), receiver=user_id) | Q(receiver=OuterRef('id'), sender=user_id)
    #     ).order_by('-timestamp').values('id')[:1]

    #     # Lấy users có tương tác
    #     users_with_chat = User.objects.filter(
    #         Q(sender__receiver=user_id) |
    #         Q(receiver__sender=user_id)
    #     ).distinct().annotate(
    #         last_message_id = Subquery(last_messages)
    #     )

    #     # Lấy tin nhắn cuối cùng
    #     return ChatMessage.objects.filter(
    #         id__in=users_with_chat.values('last_message_id')
    #     ).order_by('-timestamp')
    def get_queryset(self):
        user_id = self.kwargs['user_id']

        messages = ChatMessage.objects.filter(
            id__in =  Subquery(
                User.objects.filter(
                    Q(sender__receiver=user_id) |
                    Q(receiver__sender=user_id)
                ).distinct().annotate(
                    last_msg=Subquery(
                        ChatMessage.objects.filter(
                            Q(sender=OuterRef('id'),receiver=user_id) |
                            Q(receiver=OuterRef('id'),sender=user_id)
                        ).order_by('-id')[:1].values_list('id',flat=True) 
                    )
                ).values_list('last_msg', flat=True).order_by("-id")
            )
        ).order_by("-id")
            
        return messages
        
class GetMessages(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    # permission_classes = [IsAuthenticated]  
    
    def get_queryset(self):
        sender_id = self.kwargs['sender_id']
        receiver_id = self.kwargs['receiver_id']
        return ChatMessage.objects.filter(sender__in=[sender_id, receiver_id], receiver__in=[sender_id, receiver_id])

class SendMessages(generics.CreateAPIView):
    serializer_class = ChatMessageSerializer
    
class ProfileDetail(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    # permission_classes = [IsAuthenticated]  # Yêu cầu user phải đăng nhập
    
class SearchUser(generics.ListAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    # permission_classes = [IsAuthenticated]  

    def list(self, request, *args, **kwargs):
        username = self.kwargs['username']
        logged_in_user = self.request.user
        users = Profile.objects.filter(Q(user__username__icontains=username) | 
                                       Q(fullname__icontains=username) | 
                                       Q(user__email__icontains=username) 
                                    #    & ~Q(user=logged_in_user)
                                        )

        if not users.exists():
            return Response(
                {"detail": "Không tìm thấy người dùng."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    