# api/socket_server.py
import socketio
from api.models import ChatMessage, User, Profile
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from django.core.files.base import ContentFile
import base64

domain = "http://localhost:8000/"

def create_socketio_server():
    sio = socketio.Server(cors_allowed_origins='*')

    @sio.event
    def connect(sid, environ):
        print(f'Client connected: {sid}')

    @sio.event
    def disconnect(sid):
        print(f'Client disconnected: {sid}')

    @sio.event
    def chat_message(sid, data):
        content = data.get("message")
        sender_id = data.get("sender_id")
        receiver_id = data.get("receiver_id")
        sender = User.objects.get(id=sender_id)
        profile_sender = Profile.objects.get(user=sender)
        receiver = User.objects.get(id=receiver_id)
        profile_receiver = Profile.objects.get(user=receiver)
        image_data = data.get("image")
        # Tạo và lưu tin nhắn mới
        message = ChatMessage.objects.create(
            user=sender,
            sender=sender,
            receiver=receiver,
            content=content,
            timestamp=timezone.now()
        )
        if image_data:
            # Xử lý dữ liệu ảnh base64
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            image_content = ContentFile(base64.b64decode(imgstr), name=f'temp.{ext}')
            message.image.save(f'message_image_{message.id}.{ext}', image_content)
        # Gửi tin nhắn về cho client
        sio.emit('chat_message', {
            'id': message.id,
            'content': content,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'sender_image': domain + settings.MEDIA_URL + str(profile_sender.image),
            'receiver_image': domain + settings.MEDIA_URL + str(profile_receiver.image),
            'sender_fullname': profile_sender.fullname,
            'receiver_fullname': profile_receiver.fullname,
            'image_url': message.image.url if message.image else None,
            'timestamp': message.timestamp.isoformat()
        })
        
    @sio.event
    def get_message_all(sid, data):
        sender_id = data.get("sender_id")
        receiver_id = data.get("receiver_id")
        messages = ChatMessage.objects.filter(
            Q(sender=sender_id, receiver=receiver_id) |
            Q(sender=receiver_id, receiver=sender_id)
        ).order_by('timestamp')
        messages_data = [
            {
                'id': msg.id,
                'content': msg.content,
                'sender_id': msg.sender.id,
                'receiver_id': msg.receiver.id,
                'sender_image': domain + settings.MEDIA_URL + str(msg.sender_profile.image),
                'receiver_image': domain + settings.MEDIA_URL + str(msg.receiver_profile.image),
                'sender_fullname': msg.sender_profile.fullname,
                'receiver_fullname': msg.receiver_profile.fullname,
                'image_url': msg.image.url if msg.image else None,
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in messages
        ]
        sio.emit('get_message_all', messages_data)
        
    @sio.event
    def get_user_all(sid, data):
        user_id = data.get("user_id")
        users = User.objects.all()
        userCurrent = User.objects.get(id=user_id)
        friend_list = userCurrent.friends.all()  # Lấy tất cả bạn bè của user
        user_sent = userCurrent.friend_requests_sent.all()
        user_data = [
            {   
                'id': user.id,
                'fullname': Profile.objects.get(user=user.id).fullname,
                'is_sent': (user in user_sent),
                'is_friend': (user in friend_list),
                'userCurrent': user_id,
            }
            for user in users
        ]
        sio.emit('get_user_all', {
            'userCurrent': user_id,
            'user_data': user_data,
        })
        
    @sio.event
    def send_add_friend(sid, data):
        user_id = data.get("user_id")
        receiver_id = data.get("receiver_id")
        user_1 = User.objects.get(id=user_id)
        user_2 = User.objects.get(id=receiver_id)
        user_1.friend_requests_sent.add(user_2)
        
        sio.emit('server_return_add_friend', {
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'user_data': {
                'id': user_id,
                'fullname': Profile.objects.get(user=user_id).fullname,
            }
        })
    
    @sio.event
    def send_cancel_add_friend(sid, data):
        user_id = data.get("user_id")
        receiver_id = data.get("receiver_id")
        user_1 = User.objects.get(id=user_id)
        user_2 = User.objects.get(id=receiver_id)
        user_1.friend_requests_sent.remove(user_2)
        
        sio.emit('server_return_cancel_add_friend', user_id)
        
        
    @sio.event
    def get_friend_request(sid, data):
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        users = user.friend_requests_received.all()
        user_data = [
            {
                'id': user.id,
                'fullname': Profile.objects.get(user=user.id).fullname,
            }
            for user in users
        ]
        sio.emit('get_friend_request', {
            'userCurrent': user_id,
            'user_data': user_data,
        })
  
    @sio.event
    def accept_friend(sid, data):
        user_id = data.get("user_id")
        receiver_id = data.get("receiver_id")
        user_1 = User.objects.get(id=user_id)
        user_2 = User.objects.get(id=receiver_id)
        user_1.friend_requests_sent.remove(user_2) # Xóa khỏi danh sách gửi yêu cầu kết bạn
        user_2.friend_requests_sent.remove(user_1)
        user_1.friends.add(user_2) # Thêm vào danh sách bạn
        
        sio.emit('server_return_accept_friend', {
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'user_data': {
                'id': user_id,
                'fullname': Profile.objects.get(user=user_id).fullname,
                'status_online': user_1.status_online,
            }
        })
    
    @sio.event
    def get_friend(sid, data):
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        users = user.friends.all()
        user_data = [
            {
                'id': user.id,
                'fullname': Profile.objects.get(user=user.id).fullname,
                'status_online': user.status_online,
            }
            for user in users
        ]
        sio.emit('get_friend', {
            'userCurrent': user_id,
            'user_data': user_data,
        })
    
    @sio.event
    def cancel_friend(sid, data):
        user_id = data.get("user_id")
        receiver_id = data.get("receiver_id")
        user_1 = User.objects.get(id=user_id)
        user_2 = User.objects.get(id=receiver_id)
        user_1.friends.remove(user_2)
        
        sio.emit('server_return_cancel_friend', {
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'user_data': {
                'id': user_id,
                'fullname': Profile.objects.get(user=user_id).fullname,
            }
        })
        
    @sio.event
    def login_user(sid, data):
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        user.status_online = "online"
        user.save()
        
        sio.emit('sever_return_login_user', user_id)
    
    @sio.event
    def logout_user(sid, data):
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        user.status_online = "offline"
        user.save()
        
        sio.emit('sever_return_logout_user', user_id)
    
    
    return sio

        