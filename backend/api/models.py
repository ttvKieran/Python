from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save

class User(AbstractUser):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.username
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    fullname = models.CharField(max_length=200, null=True, blank=True)
    bio = models.CharField(max_length=200, null=True, blank=True)
    image = models.ImageField(default="default.jpg", upload_to="user_images", null=True, blank=True)
    verified = models.BooleanField(default="False")
    
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
    
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    # Chứa những dữ liệu mô tả cho model
    class Meta:
        ordering = ['-timestamp'] # Sắp xếp theo trường timestamp
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        
    def __str__(self):
        return f"{self.sender} - {self.receiver}"

    # Nếu không dùng @property, mỗi lần tạo object ChatMessage sẽ phải query 
    # thêm 2 lần để lấy profile của sender và receiver, gây lãng phí tài nguyên nếu không cần dùng đến
    @property #Chuyển phương thức thành thuộc tính (lazy loading)
    def sender_profile(self):
        return Profile.objects.get(user=self.sender)
    
    @property
    def receiver_profile(self):
        return Profile.objects.get(user=self.receiver)
        

