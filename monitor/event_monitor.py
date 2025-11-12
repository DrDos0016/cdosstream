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
from twitchAPI.chat import ChatMessage

from .settings import *
from core import *

from websockets.sync.client import connect

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

    monitor_stream_info = False  # Whether or not to ping viewer counts and stream info
    monitor_stream_interval = 30  # Seconds to wait between stream info pings
    last_monitor_stream_info_time = 0
   
    def __init__(self, streamer, quick):
        self.streamer = streamer
        self.quick_mode = quick  # If Twitch API connections are established or not
        self.gemrule = None
        self.obsws = None

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
        """ Record event in database. Broadcast to recipients. """
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

        done, pending = await asyncio.wait([consumer_task, producer_task], return_when=asyncio.ALL_COMPLETED) # Was FIRST_COMPLETED
        for task in pending:
            print("Hey! A task is being canceled: ", task)
            task.cancel()

    def remove_connection(self, uuid):
        for idx in range(0, len(self.connections)):
            if self.connections[idx].id == uuid:
                self.connections.pop(idx)
                if self.connection_names.get(str(uuid)):
                    del self.connection_names[str(uuid)]
                self.log_received_data("Client {} disconnected".format(uuid))
                break
        return True

    async def consumer_handler(self, websocket):
        await websocket.wait_closed()
        self.remove_connection(websocket.id)

    async def producer_handler(self, websocket):
        while True:
            """ ALL received data objects MUST contain the following keys:
            {"sender": {"name": "Human Readable Name for Connection", "uuid": "<UUID> for connection"}}
            """
            data = await websocket.recv()
            data = json.loads(data)
            self.log_received_data(data)

            """
            if data.get("sender", {}).get("name") == "OBS Websocket Connection":
                print("Received OBS Websocket Data")

                if data["d"]["requestType"] == "GetCurrentProgramScene":
                    card_data = {"subscription": {"type": "Set Event Position"}, "event": {"title": "Set Event Position", "position": "position-centered"}}
                    await self.log_event(card_data)
                continue
            """

            # Verify command is valid
            command = data.get("command")
            
            # COMMAND LIST
            if not command:
                self.log_received_data(f"{Fore.RED}Invalid data format {data}")
                continue
            elif command == "obs-connect":
                await self.obs_connect(data)
            elif command == "gemrule-say":
                await self.gemrule_say(data)
            elif command == "happy-zzt-day": # Not yet actually handled
                await self.happy_zzt_day(data)
            elif command == "identify-connection":
                self.add_connection_identification(data)
            elif command == "replay-event":
                await self.replay_event(data)
            elif command == "set-custom-card":
                await self.set_custom_card(data)
            elif command == "set-timer":
                await self.set_timer(data)
            elif command == "set-event-position": # Not yet rehandled
                await self.set_event_position(data)
            else:  # Unknown Command
                command = data.get("command", "NO COMMAND")
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
        if isinstance(data, str):
            message_line = timestamp + " " + str(data)
        else:
            message_line =  timestamp + " {} <{}> {}".format(data["sender"]["uuid"][:8], data["sender"]["name"], data.get("command"))
        self.message_log.append(message_line)
        if len(self.message_log) > self.message_log_max_size:
            self.message_log = self.message_log[1:]
        if update_display:
            self.display_data()
        return True
        
    async def replay_event(self, data):
        pk = data.get("params")
        if not pk:
            self.log_received_data(f"{Fore.RED}Invalid data format")
        else:
            resp = requests.get(WEBSERVER_URL + "get-event/?pk={}".format(pk))
            websockets.broadcast(self.connections, resp.text)

    async def set_custom_card(self, data):
        card_data = {"subscription": {"type": "Set Custom Card"}, "event": {"title": "Set Custom Card", "basic": data["fields"]}}
        await self.log_event(card_data)

    async def set_timer(self, data):
        # Create an event to indicate the timer being set
        card_data = {"subscription": {"type": "Set Timer"}, "event": {"title": "Set Timer", "value": data["value"], "mode": data["mode"]}}
        await self.log_event(card_data)

    def add_connection_identification(self, data):
        self.connection_names[data["sender"]["uuid"]] = data["sender"]["name"]

    async def gemrule_say(self, data):
        """ These messages ARE NOT shown in the stream itself. They do show up in actual chat. """
        if not self.gemrule:
            self.log_received_data(f"{Fore.RED}Gemrule is not attached to the event monitor! Can't send message.")
        else:
            await self.gemrule.chat.send_message(self.gemrule.channel, data["params"])
            
    async def happy_zzt_day(self, data):
        # data = {"message": **, "dow": "Friday"}
        print("DATA", data)
        card_data = {"subscription": {"type": "Happy ZZT Day"}, "event": {"title": "Happy ZZT Day", "user_name": data["message"].user.name, "dow": data["dow"]}}
        await self.log_event(card_data)

    async def set_event_position(self, data):
        card_data = {"subscription": {"type": "Set Event Position"}, "event": {"title": "Set Event Position", "position": data["params"]}}
        await self.log_event(card_data)

    async def obs_connect(self, data):
        self.log_received_data(f"{Fore.GREEN}I wanna connect to OBS's own server.")
        self.obsws = connect("ws://{}:{}".format("localhost", 4455))
        data = self.obsws.recv()
        print("HERE WHAT I GOT")
        print(data)
        print("NOW IDENTIFYING SELF")
        command = {"op": 1, "d": {"rpcVersion": 1,}} # Identify
        json_str = json.dumps(command)
        self.obsws.send(json_str)
        data = self.obsws.recv() # Get that response.
        
        print("NOW ASKING FOR SCENE LIST")
        data = {"op": 6, "d": {"requestType": "GetSceneList", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c"}}
        json_str = json.dumps(data)
        self.obsws.send(json_str)
        data = self.obsws.recv()
        data = json.loads(data)
        print("HERE WHAT I GOT")
        print(data)
        #self.log_received_data(data)

    async def obs_connection_loop(self):
        while True:
            if not self.obsws:
                await asyncio.Future()
            else:
                self.log_received_data("OBSWS TIME")
                await asyncio.Future()
