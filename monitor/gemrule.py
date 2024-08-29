import os
import sys

import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stream.settings")
django.setup()

from cdosstream.models import *  # noqa: E402

from twitchAPI.types import ChatEvent
from twitchAPI.chat import Chat, EventData, ChatMessage, ChatSub, ChatCommand
#from private import USERNAME
USERNAME = "WorldsOfZZT"

from websockets.sync.client import connect

#from asgiref.sync import sync_to_async

def populate_call_and_response_commands():
    print("[Gemrule] Populating Call and Response Commands.")
    qs = Gemrule_Response.objects.all().order_by("command")
    output = {}
    for gr in qs:
        output[gr.command] = gr.response
    return output

def populate_audio_info():
    print("[Gemrule] Populating Audio Info.")
    qs = Audio_Info.objects.all().order_by("id")
    output = []
    for ai in qs:
        output.append({"pk": ai.pk, "artist": ai.artist, "track": ai.track, "url": ai.url})
    return output

REGISTERED_COMMAND_KEYS = ["reply"]
REGISTERED_COMMANDS = [
    #{"command": "reply", "func": "test_command"},
    {"command": "audio", "func": "get_audio_link"},
    {"command": "article", "func": "get_article_link"},
]
CALL_AND_RESPONSE_COMMANDS = populate_call_and_response_commands()
AUDIO_INFO = populate_audio_info()


async def gemrule_launch(twitch):
    print("[Gemrule] Booting up Gemrule")
    chat = await Chat(twitch)

    print("[Gemrule] Registering Complex Commands")
    chat.register_event(ChatEvent.READY, on_ready)
    #chat.register_event(ChatEvent.MESSAGE, on_message)
    print(" - Registering !audio")
    chat.register_command("audio", get_audio_link)
    print(" - Registering !article")
    chat.register_command("article", get_article_link)

    print("[Gemrule] Populating Call and Response Commands")

    for k in CALL_AND_RESPONSE_COMMANDS.keys():
        print(" - Registering !" + k)
        chat.register_command(k, command_call_and_response)
    chat.start()
    print("[Gemrule] Launched.")


async def on_ready(ready_event: EventData):
    print("[Gemrule] Ready.")
    await ready_event.chat.join_room(USERNAME)


async def on_message(msg: ChatMessage):
    """
    print("Message received")
    print(msg.text)
    print(msg.sent_timestamp)
    print(msg.user)
    print(msg)
    print("---" * 20)
    """
    return True


async def test_command(cmd: ChatCommand):
    print("In TEST COMMAND Command")
    await cmd.reply('Hello I am replying.')


async def command_call_and_response(cmd: ChatCommand):
    response = CALL_AND_RESPONSE_COMMANDS.get(cmd.name, "")
    if response:
        await cmd.reply(response)
    return True


async def get_audio_link(cmd: ChatCommand):
    try:
        idx = int(cmd.parameter) - 1
    except ValueError:
        return False

    if (idx < 0 or idx > len(AUDIO_INFO)):
        return False

    info = AUDIO_INFO[idx]
    response = "{} - {} {}".format(info["artist"], info["track"], info["url"])
    await cmd.reply(response)

async def get_article_link(cmd: ChatCommand):
    try:
        pk = int(cmd.parameter)
    except ValueError:
        return False

    if (pk <= 0):
        return False

    response = "https://museumofzzt.com/article/view/{}".format(pk)
    await cmd.reply(response)
