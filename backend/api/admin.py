from django.contrib import admin
from api.models import User, Profile, ChatMessage

#cấu hình và đăng ký các model để hiển thị trong trang quản trị Django Admin

class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email']
    
class ProfileAdmin(admin.ModelAdmin):
    list_editable = ['verified']
    list_display = ['id', 'user', 'fullname', 'verified']
    
class ChatMessageAdmin(admin.ModelAdmin):
    list_editable = ['is_read']
    list_display = ['sender', 'receiver', 'content', 'is_read']
    
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)

