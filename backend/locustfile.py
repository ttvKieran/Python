from locust import HttpUser, task, between
import socketio
import time

class ChatSocketIOUser(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        self.sio = socketio.Client()
        try:
            start_time = time.time()
            self.sio.connect("http://127.0.0.1:8000")
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="connect",
                response_time=response_time,
                response_length=0
            )
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="connect",
                response_time=response_time,
                response_length=0,
                exception=str(e)
            )

    @task
    def send_message(self):
        try:
            start_time = time.time()
            self.sio.emit("send_message", {"room_chat_id": "19", "content": "Test message locust", "image": None, "timestamp": None, "sender_id": 52})
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="send_message",
                response_time=response_time,
                response_length=0
            )
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="send_message",
                response_time=response_time,
                response_length=0,
                exception=str(e)
            )

    def on_stop(self):
        try:
            start_time = time.time()
            self.sio.disconnect()
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="disconnect",
                response_time=response_time,
                response_length=0
            )
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            self.environment.events.request.fire(
                request_type="WebSocket",
                name="disconnect",
                response_time=response_time,
                response_length=0,
                exception=str(e)
            )
