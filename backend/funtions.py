from api.models import User, RoomChat, Friendship, ChatMessage
from langdetect import detect
from googletrans import Translator
from django.db.models import Subquery, OuterRef

def add_friend(user_a_id, user_b_id):
    user_a = User.objects.get(id=user_a_id)
    user_b = User.objects.get(id=user_b_id)
    # Tạo RoomChat
    room_chat = RoomChat.objects.create(
        name=f"Chat Room for {user_a.username} and {user_b.username}",
        type_room='private'
    )
    room_chat.users.add(user_a, through_defaults={'role': 'member'})
    room_chat.users.add(user_b, through_defaults={'role': 'member'})
    Friendship.objects.create(user=user_a, friend=user_b, room_chat=room_chat)
    Friendship.objects.create(user=user_b, friend=user_a, room_chat=room_chat) 
    
    
def remove_friend(user_a_id, user_b_id):
    try:
        user_a = User.objects.get(id=user_a_id)
        user_b = User.objects.get(id=user_b_id)
        
        Friendship.objects.filter(user=user_a, friend=user_b).delete()
        Friendship.objects.filter(user=user_b, friend=user_a).delete()

        room_chat = RoomChat.objects.filter(
            type_room='private',
            users=user_a
        ).filter(users=user_b).first()

        if room_chat:
            room_chat.users.remove(user_a)
            room_chat.users.remove(user_b)
            
            if room_chat.users.count() == 0:
                room_chat.delete()
                
        return {"status": "success", "message": "Friend removed successfully"}
    except User.DoesNotExist:
        return {"status": "error", "message": "User not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_latest_message_per_room(user_id):
    # Lấy tất cả các phòng chat mà user tham gia
    room_chats = RoomChat.objects.filter(users__id=user_id)

    # Tạo Subquery để lấy tin nhắn mới nhất của mỗi phòng
    latest_message_subquery = ChatMessage.objects.filter(
        room_chat_id=OuterRef('pk')
    ).order_by('-timestamp').values('id')[:1]

    # Gắn `latest_message_id` vào từng phòng chat
    room_chats = room_chats.annotate(
        latest_message_id=Subquery(latest_message_subquery),
    )

    # Lấy tất cả các tin nhắn mới nhất của từng phòng chat
    latest_messages = ChatMessage.objects.filter(
        id__in=[room.latest_message_id for room in room_chats if room.latest_message_id]
    ).select_related('sender', 'receiver')

    # Tạo dictionary để ánh xạ `room_chat_id` với tin nhắn gần nhất của nó
    latest_message_dict = {msg.room_chat_id: msg for msg in latest_messages}

    # Tạo danh sách các phòng cùng với tin nhắn mới nhất, sắp xếp theo thời gian gửi gần nhất
    room_data = []
    for room in room_chats:
        latest_message = latest_message_dict.get(room.id)
        if latest_message:
            room_data.append({
                'room_chat_id': room.id,
                'room_type': room.type_room,
                'latest_message_content': latest_message.content,
                'latest_message_timestamp': latest_message.timestamp,
                'sender': latest_message.sender.username,
            })

    # Sắp xếp danh sách theo `latest_message_timestamp` giảm dần
    room_data = sorted(room_data, key=lambda x: x['latest_message_timestamp'], reverse=True)

    return room_data


def translate_message(content, user_language):
    message_language = detect(content)
    if message_language != user_language:
        translator = Translator()
        translation = translator.translate(content, src=message_language, dest=user_language)
        return translation.text
    return content
