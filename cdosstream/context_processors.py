import os
import time

HOST = os.environ.get("WEBSOCKET_SERVER_HOST", "-UNDEFINED-")
PORT = os.environ.get("WEBSOCKET_SERVER_PORT", "-UNDEFINED-")

def cdosstream_global(request):
    context = {}

    context["TIMESTAMP"] = int(time.time())
    context["WEBSOCKET_SERVER_HOST"] = HOST
    context["WEBSOCKET_SERVER_PORT"] = PORT
    return context
