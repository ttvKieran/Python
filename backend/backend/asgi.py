# project/asgi.py
import os
import eventlet
import socketio
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

# Khởi tạo ứng dụng ASGI
application = get_asgi_application()

# Khởi tạo Socket.IO server
sio = socketio.Server(async_mode='eventlet')
app = socketio.WSGIApp(sio, application)