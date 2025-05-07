import asyncio
import json
import os
import time
import websockets

import django
import requests

from colorama import Fore, Back, Style

from datetime import datetime

from twitchAPI.eventsub import EventSub
from twitchAPI.helper import first
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.types import AuthScope
from twitchAPI.twitch import Twitch

from .settings import *
from core import *

django.setup()

from cdosstream.models import Event  # noqa: E402


class Event_Monitor():
    reverse_proxy_url = "N/A"  # ngrok url
    connection_names = {}  # Names of websocket server connections (dict w/ key=UUID, value=Connection Alias)
    connections = []  # List of websocket server connections
    max_connection_count = 8  # Max number of active connections to display
    message_log = []  # Log of messages
    message_log_max_size = 20  # Max number of past messages to display
    gemrule_registered_commands = []  # Commands enabled by Gemrule bot

    monitor_stream_info = True  # Whether or not to ping viewer counts and stream info
    monitor_stream_interval = 30  # Seconds to wait between stream info pings
    last_monitor_stream_info_time = 0

    # Commands that use repeatable event data and are passed to the event logger
    basic_commands = ["clear-queue", "release-hold", "toggle-debug"]
    basic_command_event_templates = {
        "clear-queue": {"subscription": {"type": "Clear Queue"}, "event": {"title": "Clear Queue"}},
        "release-hold": {"subscription": {"type": "Release Hold"}, "event": {"title": "Release Hold"}},
        "toggle-debug": {"subscription": {"type": "Toggle Debug"}, "event": {"title": "Toggle Debug"}},
    }
    
    def __init__(self, streamer, quick):
        self.streamer = streamer
        self.quick_mode = quick  # If Twitch API connections are established or not
        self.gemrule = None

    async def initialize_twitch_api_connection(self):
        self.twitch = await Twitch(APP_ID, APP_SECRET)
        self.user = await first(self.twitch.get_users(logins=self.streamer))

    async def authenticate_twitch_user(self):
        target_scope = []
        for scope in AuthScope:
            # print("Scope", scope)
            target_scope.append(scope)

        auth = UserAuthenticator(self.twitch, target_scope, force_verify=False)

        success, token, refresh_token = load_token(self.streamer)
        if not success:
            token, refresh_token = await auth.authenticate()
            store_token(token, refresh_token, self.streamer)

        await self.twitch.set_user_authentication(token, target_scope, refresh_token)
        store_token(token, refresh_token, self.streamer)

    async def log_event(self, data):
        try:
            resp = requests.post(WEBSERVER_URL + "event/capture/", json=data)
        except Exception:
            self.log_received_data("Could not capture event! Is the web server running at {}?".format(WEBSERVER_URL))
            return

        if self.connections:
            websockets.broadcast(self.connections, resp.text)
        else:
            self.log_received_data("No connections established to broadcast event to!")

    def launch_reverse_proxy(self, token, port):
        self.reverse_proxy_url = reverse_proxy_init(token, port)

    async def subscribe_to_eventsub_events(self):
        print("Subscribing to EventSub events...")
        event_sub = EventSub(self.reverse_proxy_url, APP_ID, NGROK_PORT, self.twitch)
        await event_sub.unsubscribe_all()
        event_sub.start()

        for i in EVENTSUB_FUNCTIONS:
            await getattr(event_sub, i["func_name"])(*i["args"])
            print("Subscribed to:", i["name"])

    async def run_websocket_server(self):
        self.log_received_data("Launching Websocket Server at {}".format(WEBSOCKET_SERVER_HOST))
        async with websockets.serve(self.ws_connect, WEBSOCKET_SERVER_HOST, WS_PORT):
            self.log_received_data("Ready for connections")
            await asyncio.Future()

    async def ws_connect(self, websocket):
        self.connections.append(websocket)
        self.log_received_data("Client {} connected. {} concurrent connections.".format(websocket.id, len(self.connections)))
        await websocket.send(str(websocket.id))

        consumer_task = asyncio.create_task(self.consumer_handler(websocket))
        producer_task = asyncio.create_task(self.producer_handler(websocket))

        done, pending = await asyncio.wait([consumer_task, producer_task], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            print("A task is being canceled", task)
            task.cancel()

    def remove_connection(self, uuid):
        for idx in range(0, len(self.connections)):
            if self.connections[idx].id == uuid:
                self.connections.pop(idx)
                del self.connection_names[str(uuid)]
                self.log_received_data("Client {} disconnected".format(uuid))
                break
        return True

    async def consumer_handler(self, websocket):
        await websocket.wait_closed()
        self.remove_connection(websocket.id)

    async def producer_handler(self, websocket):
        while True:
            data = await websocket.recv()
            self.log_received_data(data)
            data = json.loads(data)

            if data.get("sender", {}).get("name") == "OBS Websocket Connection":
                print("Received OBS Websocket Data")

                if data["d"]["requestType"] == "GetCurrentProgramScene":
                    card_data = {"subscription": {"type": "Set Event Position"}, "event": {"title": "Set Event Position", "position": "position-centered"}}
                    await self.log_event(card_data)
                continue

            if not data.get("command"):
                self.log_received_data(f"{Fore.RED}Invalid data format")
                continue
            if data.get("params"):
                command = data["command"]
                data = json.loads(data["params"])
                data["command"] = command

            if data["command"] == "replay":
                pk = data["pk"]
                resp = requests.get(WEBSERVER_URL + "get-event/?pk={}".format(pk))
                websockets.broadcast(self.connections, resp.text)
            elif data["command"] in self.basic_commands:
                await self.log_event(self.get_basic_command_event(data["command"]))
            elif data["command"] == "set-custom-card":
                card_data = {
                    "subscription": {"type": "Set Custom Card"},
                    "event": {
                        "title": "Set Custom Card", "basic": data["basic"], "extras": data["extras"]
                    },
                    "manual": True,
                }
                await self.log_event(card_data)
            elif data["command"] == "set-timer":
                # Create an event to indicate the timer being set
                card_data = {"subscription": {"type": "Set Timer"}, "event": {"title": "Set Timer", "value": data["value"], "mode": data["mode"]}}
                await self.log_event(card_data)
            elif data["command"] == "set-event-position":
                card_data = {"subscription": {"type": "Set Event Position"}, "event": {"title": "Set Event Position", "position": data["position"]}}
                await self.log_event(card_data)
            elif data["command"] == "identify-connection":
                self.connection_names[data["sender"]["uuid"]] = data["sender"]["name"]
            elif data["command"] == "gemrule-say":
                if not self.gemrule:
                    self.log_received_data(f"{Fore.RED}Gemrule is not attached to the event monitor! Can't send message.")
                await self.gemrule.chat.send_message(self.gemrule.channel, data["message"])
            else:
                command = data.get("command", "NO COMMAND?")
                self.log_received_data(f"{Fore.RED}Unknown command: {command}")

            self.display_data()

    async def get_stream_info(self):
        if self.monitor_stream_info:
            print("Tracking stream info...")
        else:
            print("Stream info tracker is currently DISABLED")
        while self.monitor_stream_info:
            now = time.time()
            if now - self.last_monitor_stream_info_time > self.monitor_stream_interval:
                self.last_monitor_stream_info_time = now
                data = await first(self.twitch.get_streams(user_login=self.streamer))
                if data:
                    data = data.to_dict()
                    stream_info = Event(kind="stream-info", raw=data).jsonized()
                    websockets.broadcast(self.connections, json.dumps(stream_info))
            else:
                await asyncio.sleep(self.monitor_stream_interval)

    def display_data(self):
        os.system("clear")
        conn_count = len(self.connections)
        quick = f" {Fore.RED}QUICK MODE" if self.quick_mode else ""
        print(f"Streaming as {Style.BRIGHT}{Fore.CYAN}{self.streamer} (#{self.user.id}){quick}{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}{self.reverse_proxy_url}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}ACTIVE CONNECTIONS: {conn_count}")
        for idx in range(0, conn_count):
            c = self.connections[idx]
            conn_alias = self.connection_names.get(str(c.id), "Unknown")
            print(f"{Fore.WHITE}{idx}:{Fore.GREEN}{c.id} {Fore.CYAN}{conn_alias}{Style.RESET_ALL}")
        if conn_count < self.max_connection_count:
            for idx in range(conn_count, (self.max_connection_count + 1)):
                print(f"{Fore.WHITE}{idx}:{Fore.GREEN}------------------------------------{Style.RESET_ALL}")

        print(f"{Fore.YELLOW}GEMRULE COMMANDS: {Fore.MAGENTA}{', '.join(self.gemrule_registered_commands)}")

        print(f"{Fore.YELLOW}MESSAGE HISTORY:")
        idx = 0
        for message in self.message_log:
            idx_str = ("0" + str(idx))[-2:]
            print(f"{Fore.WHITE}{idx_str}: {message}{Style.RESET_ALL}")
            idx += 1
        return True

    def log_received_data(self, data, update_display=True):
        timestamp = datetime.now().strftime("[%H:%M:%S]")
        self.message_log.append(timestamp + " " + str(data))
        if len(self.message_log) > self.message_log_max_size:
            self.message_log = self.message_log[1:]
        if update_display:
            self.display_data()
        return True
