from twitchAPI.chat import Chat, EventData, ChatMessage, ChatCommand

async def on_ready(ready_event: EventData):
    print("Gemrule reporting!")
    await ready_event.chat.join_room("worldsofzzt")


async def on_message(msg: ChatMessage):
    print("Gemrule saw a mesage:", msg.text)


async def test_command(cmd: ChatCommand):
    if len(cmd.parameter) == 0:
        await cmd.reply('you did not tell me what to reply with')
    else:
        await cmd.reply(f'{cmd.user.name}: {cmd.parameter}')
