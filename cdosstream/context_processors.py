import os
import time

from cdosstream.models import Event

from django.core.cache import cache

HOST = os.environ.get("WEBSOCKET_SERVER_HOST", "-UNDEFINED-")
PORT = os.environ.get("WEBSOCKET_SERVER_PORT", "-UNDEFINED-")

def cdosstream_global(request):
    context = {}

    context["TIMESTAMP"] = int(time.time())
    context["WEBSOCKET_SERVER_HOST"] = HOST
    context["WEBSOCKET_SERVER_PORT"] = PORT
    
    if not cache.get("STARTING_SUBS"):
        sub_info = Event.objects.get_subscriber_info()
        cache.set("STARTING_SUBS", sub_info.get("sub_count"))
        print("Initialized Starting Subs to", sub_info.get("sub_count"))
    
    return context
