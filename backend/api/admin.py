from django.contrib import admin
from api.models import User, Profile

#cấu hình và đăng ký các model để hiển thị trong trang quản trị Django Admin

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email']
    
class ProfileAdmin(admin.ModelAdmin):
    # list_editable = ['verified']
    list_display = ['user', 'fullname']
    
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)

