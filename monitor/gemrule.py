import os
import time
import sys

import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stream.settings")
django.setup()

from cdosstream.models import *  # noqa: E402

from twitchAPI.types import ChatEvent
from twitchAPI.chat import Chat, EventData, ChatMessage, ChatSub, ChatCommand

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


class Gemrule_Bot():
    registered_commands = []
    
    
    def __init__(self, bot, channel):
        self.bot = bot
        self.channel = channel

    async def launch(self, twitch):
        print("[Gemrule] Booting up Gemrule")
        self.chat = await Chat(twitch)
        self.register_commands()
        self.chat.start()
        print("[Gemrule] Launched.")

    def register_commands(self):
        print("[Gemrule] Registering Complex Commands")
        self.chat.register_event(ChatEvent.READY, self.on_ready)
        self.chat.register_event(ChatEvent.MESSAGE, self.on_message)
        self.register_command("audio", get_audio_link)
        self.register_command("article", get_article_link)

        print("[Gemrule] Populating Call and Response Commands")

        for k in CALL_AND_RESPONSE_COMMANDS.keys():
            self.register_command(k, command_call_and_response)


    def register_command(self, key, func):
        print(" - Registering !" + key)
        self.chat.register_command(key, func)
        self.registered_commands.append("!" + key)

    def get_registered_commands(self):
        return self.registered_commands


    async def on_ready(self, ready_event: EventData):
        print("[Gemrule] Ready. In chat for {}".format(self.channel))
        await ready_event.chat.join_room(self.channel)


    async def on_message(self, msg: ChatMessage):
        """
        print("Message received")
        print(msg.text)
        print(msg.sent_timestamp)
        print(msg.user)
        print(msg)
        print("---" * 20)
        await self.chat.send_message(self.channel, "Got a message at " + str(int(now)))
        """
        return True


#async def gemrule_auto_message(gemrule)
#    awai


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
