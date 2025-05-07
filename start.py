import argparse
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

DEFAULT_STREAMER = "WorldsOfZZT"
DEFAULT_CHATBOT = "gemrulebot"
DEFAULT_QUICK = False

parser = argparse.ArgumentParser(prog="Twitch Stream Monitor", description="Monitor Twitch events and manage Chatbot")
parser.add_argument("-s", "--streamer", help="Twitch username to monitor for events")
parser.add_argument("-b", "--bot", help="Twitch username to run the chatbot from")
parser.add_argument("-q", "--quick", action="store_true", help="Bypass eventsub connections for faster debugging")
args = parser.parse_args()
STREAMER = args.streamer if args.streamer else DEFAULT_STREAMER
CHATBOT = args.bot if args.bot else DEFAULT_CHATBOT
QUICK = args.quick if args.quick else DEFAULT_QUICK


async def main():
    colorama_init()
    m = Event_Monitor(STREAMER, QUICK)
    g = Gemrule_Bot(CHATBOT, STREAMER)
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
    if QUICK:
        m.log_received_data(f"{Fore.YELLOW}{Back.BLACK}Skipping EventSub Subscriptions. Functionality will be limited.")
    else:
        await m.subscribe_to_eventsub_events()

    # Gather Tasks
    gemrule = g.launch(m.twitch)
    websocket_server = m.run_websocket_server()
    stream_info_task = m.get_stream_info()

    m.gemrule_registered_commands = g.get_registered_commands()
    m.gemrule = g

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
