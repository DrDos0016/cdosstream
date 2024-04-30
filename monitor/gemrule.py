from twitchAPI.types import ChatEvent
from twitchAPI.chat import Chat, EventData, ChatMessage, ChatSub, ChatCommand
#from private import USERNAME
USERNAME = "WorldsOfZZT"

from websockets.sync.client import connect

REGISTERED_COMMAND_KEYS = ["reply"]
REGISTERED_COMMANDS = [
    {"command": "reply", "func": "test_command"}
]
CALL_AND_RESPONSE_COMMANDS = {
    "discord": "Visit the Museum of ZZT Discord: https://museumofzzt.com/discord/",
    "patreon": "Support Worlds of ZZT: https://museumofzzt.com/patreon",
}


async def gemrule_launch(twitch):
    #await gemrule_bot(twitch)
    chat = await Chat(twitch)
    chat.register_event(ChatEvent.READY, on_ready)
    chat.register_event(ChatEvent.MESSAGE, on_message)
    #chat.register_command("reply", test_command)
    for k in CALL_AND_RESPONSE_COMMANDS.keys():
        chat.register_command(k, command_call_and_response)
    chat.start()
    print("Gemrule launched.")


async def on_ready(ready_event: EventData):
    print("Gemrule Ready")
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
