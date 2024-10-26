from django.apps import AppConfig

# Định nghĩa và cấu hình cho ứng dụng con 

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
