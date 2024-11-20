import socketio
from api.models import ChatMessage, User, Profile, Friendship, RoomChat, RoomMembership, MessageTranslation
from funtions import add_friend, remove_friend, translate_message, get_latest_message_per_room
from django.utils import timezone
from django.conf import settings
from django.db.models import Q, Max, Subquery, OuterRef
from django.core.files.base import ContentFile
from datetime import datetime
import base64
from django.utils.dateformat import format
from langdetect import detect, LangDetectException
domain = "http://localhost:8000/"

def create_socketio_server():
    sio = socketio.Server(cors_allowed_origins='*')
    @sio.event
    def connect(sid, environ):
        print(f'Client connected: {sid}')

    @sio.event
    def join_room(sid, data):
        room_chat_id = data.get("room_chat_id")
        sio.enter_room(sid, room_chat_id) 
        print(f"User {sid} joined room {room_chat_id}")
        sio.emit("join_room_success", {"message": f"Joined room {room_chat_id}"}, room=sid)

    @sio.event
    def disconnect(sid):
        print(f'Client disconnected: {sid}')
   
    @sio.event
    def send_message(sid, data):
        sender_id = data.get("sender_id")
        room_chat_id = data.get("room_chat_id")
        content = data.get("content", "")
        translations_map = {}
        sender = User.objects.get(id=sender_id)
        sender_profile = Profile.objects.get(user=sender)
        room_chat = RoomChat.objects.get(id=room_chat_id)
        
        image_data = data.get("image")
        
        if room_chat.type_room == "private":
            receiver = room_chat.users.exclude(id=sender_id).first() 
            chat_message = ChatMessage.objects.create(
                user=sender,
                sender=sender,
                receiver=receiver,
                room_chat_id=room_chat_id,
                content=content,
                timestamp=timezone.now(),
                is_read=False,
                is_deleted=False
            )
            if image_data:
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
                image_content = ContentFile(base64.b64decode(imgstr), name=f'temp.{ext}')
                chat_message.image.save(f'message_image_{chat_message.id}.{ext}', image_content)

            receiver_language = receiver.user_language
            translated_content = content
            if content.strip():
                try:
                    translated_content = translate_message(content, receiver_language)
                except LangDetectException:
                    print("Cannot detect language of the content:", content)
            MessageTranslation.objects.create(
                chat_message=chat_message,
                user=receiver,
                language=receiver_language,
                translated_content=translated_content
            )
            translations_map[receiver.id] = translated_content
            sio.emit('new_message',{
                    "sender_id": sender_id,
                    "sender_username": sender.username,
                    "room_chat_id": room_chat_id,
                    "content": content,
                    'image_url': (domain + settings.MEDIA_URL + str(chat_message.image)) if chat_message.image else None,
                    'sender_image': domain + settings.MEDIA_URL + str(sender_profile.image),
                    "timestamp": chat_message.timestamp.isoformat(),
                    "message_translated": translated_content,
                    'message_translations': translations_map,
                },
                room=room_chat_id 
            )

        elif room_chat.type_room == "group":
            chat_message = ChatMessage.objects.create(
                user=sender,
                sender=sender,
                room_chat_id=room_chat_id,
                content=content,
                timestamp=timezone.now(),
                is_read=False,
                is_deleted=False
            )
            if image_data:
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
                image_content = ContentFile(base64.b64decode(imgstr), name=f'temp.{ext}')
                chat_message.image.save(f'message_image_{chat_message.id}.{ext}', image_content)
            # Duyệt qua tất cả các thành viên trong nhóm
            
            for member in room_chat.users.exclude(id=sender_id):
                member_language = member.user_language
                translated_content = content
                if content.strip():
                    try:
                        translated_content = translate_message(content, member_language)
                    except LangDetectException:
                        print("Cannot detect language of the content:", content)
            # Lưu bản dịch cho từng thành viên vào bảng MessageTranslation
                MessageTranslation.objects.create(
                    chat_message=chat_message,
                    user=member,
                    language=member_language,
                    translated_content=translated_content
                )
                translations_map[member.id] = translated_content
            sio.emit('new_message',{
                    "sender_id": sender_id,
                    "sender_username": sender.username,
                    "room_chat_id": room_chat_id,
                    "content": content,
                    'image_url': (domain + settings.MEDIA_URL + str(chat_message.image)) if chat_message.image else None,
                    'sender_image': domain + settings.MEDIA_URL + str(sender_profile.image),
                    "timestamp": chat_message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    'message_translations': translations_map,
                    'message_translated': content,
                },
                room=room_chat_id
            )
        chat_message.save()
            
    @sio.event
    def get_messages(sid, data):
        room_chat_id = data.get('room_chat_id')
        user_id = data.get('user_id')
        user = User.objects.get(id=user_id)
        room = RoomChat.objects.get(id=room_chat_id)
        is_private = room.type_room == 'private'
    # Lấy tất cả các tin nhắn trong room
        messages = ChatMessage.objects.filter(
            Q(room_chat_id=room_chat_id)
        ).order_by('timestamp')
        
        message_list = []
        for message in messages:
            translations = MessageTranslation.objects.filter(chat_message=message)
            user_translation = translations.filter(user=user).first()
            translated_content = user_translation.translated_content if user_translation else message.content
            sender_profile = message.sender_profile
            message_list.append({
                'id': message.id,
                'sender': message.sender.username,
                # 'receiver': message.receiver.username,
                'sender_image': domain + settings.MEDIA_URL + str(sender_profile.image),
                # 'receiver_image': domain + settings.MEDIA_URL + str(receiver_profile.image),
                'sender_id': message.sender.id,
                # 'receiver_id': message.receiver.id,
                'content': message.content,
                'message_translated': translated_content,
                'timestamp': message.timestamp.isoformat(),
                'is_read': message.is_read,
                'is_deleted': message.is_deleted,
                'image_url': domain + settings.MEDIA_URL + str(message.image) if message.image else None,
            })
                
        sio.emit('message_list', {
            'messages': message_list, 
            'room_type': 'private' if is_private else 'public'
        }, to=sid)
        
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
                'imgage': Profile.objects.get(user=user.id).image.url,
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
                'image': Profile.objects.get(user=user.id).image.url,
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
        print(user_id, receiver_id)
        user_1 = User.objects.get(id=user_id)
        user_2 = User.objects.get(id=receiver_id)
        user_1.friend_requests_sent.remove(user_2)
        user_2.friend_requests_sent.remove(user_1)
        add_friend(user_a_id=user_id, user_b_id=receiver_id)
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
        friendships = Friendship.objects.filter(user=user).select_related('friend')
        user_data = [
            {
                'id': friendship.friend.id,
                'fullname': Profile.objects.get(user=friendship.friend.id).fullname,
                'image': Profile.objects.get(user=friendship.friend.id).image.url,
                'status_online': friendship.friend.status_online,
                'room_chat_id': friendship.room_chat.id,
            }
            for friendship in friendships
        ]
        sio.emit('get_friend', {
            'userCurrent': user_id,
            'user_data': user_data,
        }, to=sid)
    
    @sio.event
    def get_chat_list(sid, data):
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        friends = Friendship.objects.filter(user=user).select_related('friend__profile')
    # Subquery để lấy id của tin nhắn mới nhất
        latest_message_subquery = ChatMessage.objects.filter(
            Q(sender=OuterRef('friend__id'), receiver=user) |
            Q(sender=user, receiver=OuterRef('friend__id'))
        ).order_by('-timestamp').values('id')[:1]
    # Gắn latest_message_id với từng friend
        friends = friends.annotate(latest_message_id=Subquery(latest_message_subquery))
    # Lấy tin nhắn mới nhất từ bạn bè
        latest_messages = ChatMessage.objects.filter(
            id__in=[f.latest_message_id for f in friends if f.latest_message_id]
        ).select_related('sender', 'receiver')
    # Tạo dict để truy cập nhanh
        latest_message_dict = {msg.id: msg for msg in latest_messages}
    # Chuẩn bị dữ liệu trả về cho client
        user_data = []
        for friend in friends:
            profile = friend.friend.profile  # Đã có profile qua select_related
            latest_message = latest_message_dict.get(friend.latest_message_id)
            if latest_message:
                latest_timestamp_str = format(latest_message.timestamp, 'Y-m-d H:i:s')
                message_translated = MessageTranslation.objects.filter(chat_message=latest_message, user=user).first()
                user_data.append({
                'id': friend.friend.id,
                'fullname': profile.fullname,
                'image': profile.image.url,
                'status_online': friend.friend.status_online,
                'latest_message_time': latest_timestamp_str,
                'latest_message_content': latest_message.content,
                'latest_message_translated': message_translated.translated_content if message_translated else latest_message.content,
                'room_chat_id': latest_message.room_chat_id,
                })
                
        chat_list_room = []
        # Lấy danh sách các nhóm chat mà user đang tham gia và tin nhắn gần nhất của từng nhóm
        memberships = RoomMembership.objects.filter(user=user, room__type_room='group')
        for membership in memberships:
            room = membership.room
            # Lấy tin nhắn gần nhất trong nhóm
            latest_message = ChatMessage.objects.filter(room_chat_id=room.id).order_by('-timestamp').first()
            if latest_message:
                message_content = latest_message.content
                timestamp = latest_message.timestamp.isoformat()
            else:
                message_content = ""
                timestamp = ""
            chat_list_room.append({
                'group_id': room.id,
                'group_name': room.name,
                'group_avatar': room.avatar.url,
                'latest_message': message_content,
                'timestamp': timestamp,
            })
        sio.emit('chat_list', {'chat_list': user_data, 'chat_list_room': chat_list_room}, to=sid)

    @sio.event
    def get_sorted_rooms_by_latest_message(sid, data):
        user_id = data.get("user_id")
        room_data = get_latest_message_per_room(user_id)

        sio.emit('sorted_rooms_by_latest_message', {
            'user_id': user_id,
            'rooms': room_data,
        }, to=sid)

    @sio.event
    def cancel_friend(sid, data):
        user_id = data.get("user_id")
        receiver_id = data.get("receiver_id")
        remove_friend(user_a_id=data.get("user_id"), user_b_id=data.get("receiver_id"))
        
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
    
    @sio.event
    def get_profile(sid, data):
        user = User.objects.get(id=data.get("id"))
        profile = Profile.objects.get(user=user)
        sio.emit('get_profile', {
            'id': user.id, 
            'fullname': profile.fullname.capitalize(),
            'username': user.username,
            'image': profile.image.url,
            'status_online': user.status_online,  
            'address': profile.address,
            'bio': profile.bio,
            'hobbies': profile.hobbies,
            'email': user.email,
            'userCurrent': data.get("userCurrent"),
            'user_language': user.user_language,
        })
        
    @sio.event
    def get_search_user(sid, data):
        user_id = data.get("user_id")
        users = User.objects.all()
        user_data = [
            {   
                'id': user.id,
                'fullname': Profile.objects.get(user=user.id).fullname,
                'status_online': user.status_online,
                'image': Profile.objects.get(user=user).image.url,
                'userCurrent': user_id,
            }
            for user in users
        ]
        sio.emit('get_search_user', {
            'userCurrent': user_id,
            'user_data': user_data,
        })
    
    @sio.event
    def update_profile(sid, data):
        print(data.get("email"))
        user_id = data.get("user_id")
        user = User.objects.get(id=user_id)
        profile = Profile.objects.get(user=user)
        user.email = data.get("email")
        user.username = data.get("username")
        profile.hobbies = data.get("hobbies")
        profile.address = data.get("address")
        profile.bio = data.get("aboutMe")
        old_language = user.user_language
        new_language = data.get("language")
        user.user_language = data.get("language")
        image_data = data.get("image")
        if image_data:
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            image_content = ContentFile(base64.b64decode(imgstr), name=f'temp.{ext}')
            profile.image = image_content
        profile.save()
        user.save()
        print(user_id, data.get("language"))
        if old_language != data.get("language"):
            translations = MessageTranslation.objects.filter(user=user)
            for translation in translations:
                print(1)
                original_message = translation.chat_message.content
                try:
                    translated_content = translate_message(original_message, new_language)
                    translation.translated_content = translated_content
                    translation.language = new_language
                    translation.save()
                except LangDetectException:
                    print(f"Cannot detect language for message: {original_message}")
            
    @sio.event
    def delete_message(sid, data):
        print(data.get("chat_id"))
        message = ChatMessage.objects.get(id=data.get("chat_id"))
        message.is_deleted = True
        message.save()
        
    @sio.event
    def handle_get_profile(sid, data):
        room_chat_id = data.get('id')
        user_id = data.get('user_id')
        room_chat = RoomChat.objects.get(id=room_chat_id)
        if room_chat.type_room == 'private':
            friend = room_chat.users.exclude(id=user_id).first()
            friend_profile = Profile.objects.get(user=friend)
            sio.emit('profile_response', {
                'type': 'private',
                'friend_id': friend.id,
                'friend_fullname': friend_profile.fullname,
                'friend_status': friend.status_online,
                'friend_avatar': friend_profile.image.url if friend_profile.image else '',
            }, room=sid)
        else:
        # Đối với phòng nhóm, gửi thông tin phòng
            sio.emit('profile_response', {
            'status': 'success',
            'type': 'group',
            'room_name': room_chat.name,
            'room_avatar': room_chat.avatar.url if room_chat.avatar else '',
            }, room=sid)
    
    @sio.event
    def create_group_chat(sid, data):
        user_id = data.get("user_id")
        user_ids = data.get("user_ids", [])
        group_name = data.get("group_name", "New Group Chat")

        if len(user_ids) < 1:
            sio.emit("error", {"message": "Group must contain at least 2 members"}, room=sid)
            return

        users = User.objects.filter(id__in=user_ids)

        room_chat = RoomChat.objects.create(
            name=group_name,
            type_room="group",
            status="active"
        )
        RoomMembership.objects.create(
            user=User.objects.get(id=user_id),
            room=room_chat,
            role="superadmin"
        )
        for user in users:
            RoomMembership.objects.create(
                user=user,
                room=room_chat,
                role="user"
            )

        sio.emit(
            "group_chat_created",
            {
                "room_chat_id": room_chat.id,
                "group_name": room_chat.name,
                "member_ids": user_ids,
            },
            room=sid
        )
    
    return sio

        