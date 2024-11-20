from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save

class User(AbstractUser):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    friend_requests_sent = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        related_name='friend_requests_received'
    )
    friends = models.ManyToManyField(
        'self', 
        through='Friendship',  # Sử dụng model trung gian Friendship
        symmetrical=False, 
        related_name='friend_of'
    )
    status_online = models.CharField(max_length=50, default="offline")
    user_language = models.CharField(max_length=2, default="en")
    def __str__(self):
        return self.username
    
class Friendship(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends_as_friend')
    room_chat = models.ForeignKey('RoomChat', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'friend') 

class RoomChat(models.Model):
    ROOM_TYPES = [
        ('private', 'Private'),
        ('group', 'Group'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    name = models.CharField(max_length=100)
    avatar = models.ImageField(default='default_room.png', upload_to='room_avatars', null=True, blank=True)
    type_room = models.CharField(max_length=10,choices=ROOM_TYPES, default='private')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    users = models.ManyToManyField(
        User,
        through='RoomMembership',
        related_name='rooms'
    )
    def __str__(self):
        return self.name

class RoomMembership(models.Model):
    ROLE_CHOICES = [
        ('superadmin', 'SuperAdmin'),
        ('admin', 'Admin'),
        ('user', 'User'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(RoomChat, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'room')  
    
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    fullname = models.CharField(max_length=200, null=True, blank=True)
    bio = models.CharField(max_length=200, null=True, blank=True)
    image = models.ImageField(default="default.jpg", upload_to="user_images", null=True, blank=True)
    verified = models.BooleanField(default="False")
    address = models.CharField(max_length=300, null=True, blank=True)
    hobbies = models.CharField(max_length=300, null=True, blank=True)
    def save(self, *args, **kwargs):
        if self.fullname == "" or self.fullname == None:
            self.fullname = self.user.username
        super(Profile, self).save(*args, **kwargs)
    def __str__(self):
        return self.fullname
    
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)
    
class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="user")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sender")
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="receiver")
    room_chat_id = models.CharField(max_length=300, null=True, blank=True)
    image = models.ImageField(default="", upload_to="chat_images", null=True, blank=True)
    content = models.TextField()
    message_translated = models.TextField(default="")
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
    def __str__(self):
        return f"{self.sender} - {self.receiver}"

    @property 
    def sender_profile(self):
        return Profile.objects.get(user=self.sender)
    @property
    def receiver_profile(self):
        return Profile.objects.get(user=self.receiver)
    
class MessageTranslation(models.Model):
    chat_message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="translations")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    language = models.CharField(max_length=5)  
    translated_content = models.TextField() 
    class Meta:
        unique_together = ('chat_message', 'user', 'language')  

        

