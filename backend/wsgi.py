import os
import socketio
import eventlet
import django
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from socket_server import create_socketio_server  # Import từ file cùng cấp

# Khởi tạo Django application
django_app = get_wsgi_application()

# Khởi tạo Socket.IO server
sio = create_socketio_server()

# Kết hợp Django và Socket.IO
application = socketio.WSGIApp(sio, django_app)

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 8000)), application)