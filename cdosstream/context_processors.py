import os
import time

from cdosstream.models import Event

from django.core.cache import cache

HOST = os.environ.get("WEBSOCKET_SERVER_HOST", "-UNDEFINED-")
PORT = os.environ.get("WEBSOCKET_SERVER_PORT", "-UNDEFINED-")
EXTRA_SUBS = 0

def cdosstream_global(request):
    context = {}

    context["TIMESTAMP"] = int(time.time())
    context["WEBSOCKET_SERVER_HOST"] = HOST
    context["WEBSOCKET_SERVER_PORT"] = PORT
    
    if not cache.get("STARTING_SUBS"):
        sub_info = Event.objects.get_subscriber_info()
        total = sub_info.get("sub_count") + EXTRA_SUBS
        print("Subs in DB:", sub_info.get("sub_count"))
        print("Manually added subs:", EXTRA_SUBS)
        cache.set("STARTING_SUBS", sub_info.get("sub_count") + EXTRA_SUBS)
        print("Initialized Starting Subs to:", total)
    context["STARTING_SUBS"] = cache.get("STARTING_SUBS")
    
    return context
