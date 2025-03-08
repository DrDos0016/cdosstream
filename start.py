import asyncio
import sys

from colorama import init as colorama_init
from colorama import Fore, Back, Style

import django

from monitor.event_monitor import *
from monitor.gemrule import *
from monitor.settings import *

django.setup()

from cdosstream.models import Event  # noqa: E402

STREAMER = "WorldsOfZZT" if sys.argv[-1].endswith(".py") else sys.argv[-1]


async def main():
    colorama_init()
    m = Event_Monitor()
    m.streamer = STREAMER
    g = Gemrule_Bot()
    g.streamer = STREAMER
    await m.initialize_twitch_api_connection()
    m.log_received_data(f"Connected to Twitch as {STREAMER} #{m.user.id}")
    await m.authenticate_twitch_user()
    m.log_received_data(f"Authenticated {STREAMER} #{m.user.id}")
    m.log_received_data(f"Preparing Eventsub Arguments...")
    prepare_eventsub_args(m.user.id, m.log_event)
    m.log_received_data(f"Eventsub Arguments prepared.")
    m.log_received_data(f"Launching Reverse Proxy (ngrok)...")
    m.launch_reverse_proxy(NGROK_TOKEN, NGROK_PORT)
    m.log_received_data(f"Reverse Proxy Launched.")
    if "-quick" in sys.argv:
        m.quick_mode = True
        m.log_received_data("Skipping EventSub Subscriptions. Functionality will be limited.")
    else:
        await m.subscribe_to_eventsub_events()

    # Gather Tasks
    gemrule = g.launch(m.twitch)
    websocket_server = m.run_websocket_server()
    stream_info_task = m.get_stream_info()

    m.gemrule_registered_commands = g.get_registered_commands()

    # Run Tasks
    m.log_received_data(f"{Fore.BLACK}{Back.GREEN}Running Tasks")
    await asyncio.gather(*[websocket_server, stream_info_task, gemrule])

    try:
        input("Press ENTER to quit\n")
    finally:
        await event_sub.stop()
        await twitch.close()
    print("Shutting Down...")

asyncio.run(main())
