import asyncio
import json
import os
import sys
import time
import websockets

from datetime import datetime

import django
import requests

from twitchAPI.eventsub import EventSub
from twitchAPI.helper import first
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.types import AuthScope
from twitchAPI.twitch import Twitch

from settings import *

from core import *
from gemrule import *

django.setup()

from cdosstream.models import Event


class Event_Monitor():
    connection_names = {}
    connections = []
    shutdown = False
    monitor_stream_info = True
    last_monitor_stream_info_time = 0
    monitor_stream_interval = 60

    async def initialize_twitch_api_connection(self):
        self.twitch = await Twitch(APP_ID, APP_SECRET)
        self.user = await first(self.twitch.get_users(logins=USERNAME))
        print("Connected to Twitch as {} #{}".format(USERNAME, self.user.id))

    async def authenticate_twitch_user(self):
        target_scope = []
        for scope in AuthScope:
            # print("Scope", scope)
            target_scope.append(scope)

        auth = UserAuthenticator(self.twitch, target_scope, force_verify=True)

        success, token, refresh_token = load_token()
        if not success:
            token, refresh_token = await auth.authenticate()
            store_token(token, refresh_token)

        await self.twitch.set_user_authentication(token, target_scope, refresh_token)
        store_token(token, refresh_token)

        print("Authenticated.")

    async def log_event(self, data):
        print(str(datetime.now())[:19], data.get("subscription", {}).get("type", {}), data.get("event", {}).get("reward", {}).get("title", {}))
        try:
            resp = requests.post(WEBSERVER_URL + "event/capture/", json=data)
        except Exception:
            print("Could not capture event! Is the web server running at {}?".format(WEBSERVER_URL))
            return
        if self.connections:
            websockets.broadcast(self.connections, resp.text)
        else:
            print("No connections established to broadcast event!")

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
        print("Launching Websocket Server at", WEBSOCKET_SERVER_HOST)
        async with websockets.serve(self.ws_connect, WEBSOCKET_SERVER_HOST, WS_PORT):
            print("Ready for connections")
            await asyncio.Future()


    async def ws_connect(self, websocket):
        self.connections.append(websocket)
        print("Client {} connected. {} concurrent connections.".format(websocket.id, len(self.connections)))
        await websocket.send(str(websocket.id))

        consumer_task = asyncio.create_task(self.consumer_handler(websocket))
        producer_task = asyncio.create_task(self.producer_handler(websocket))

        done, pending = await asyncio.wait([consumer_task, producer_task], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            print("A task is being canceled", task)
            task.cancel()
        if self.shutdown:
            print("Self.shutdown is true")
            await websocket.close()
            return False

    def remove_connection(self, uuid):
        for idx in range(0, len(self.connections)):
            if self.connections[idx].id == uuid:
                self.connections.pop(idx)
                del self.connection_names[str(uuid)]
                print("Client {} disconnected".format(uuid))
                break
        return True

    async def consumer_handler(self, websocket):
        await websocket.wait_closed()
        self.remove_connection(websocket.id)

    async def producer_handler(self, websocket):
        while True:
            data = await websocket.recv()
            print("Received message:", data)
            data = json.loads(data)
            if not data.get("command"):
                print("Invalid data format!")
                continue
            if data.get("params"):
                command = data["command"]
                data = json.loads(data["params"])
                data["command"] = command

            #print("FINAL COMMAND")
            #print(data)

            if data["command"] == "replay":
                pk = data["pk"]
                resp = requests.get(WEBSERVER_URL + "get-event/?pk={}".format(pk))
                websockets.broadcast(self.connections, resp.text)
            elif data["command"] == "set-custom-card":
                card_data = {
                    "subscription": {"type": "Set Custom Card"},
                    "event": {
                        "title": "Set Custom Card", "basic": data["basic"], "extras": data["extras"]
                    },
                    "manual": True,
                }
                await self.log_event(card_data)
            elif data["command"] == "set-card":
                # Create an event to indicate the card change
                card_data = {"subscription": {"type": "Set Card"}, "event": {"title": "Set Card", "card_pk": data["pk"]}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "release-hold":
                card_data = {"subscription": {"type": "Release Hold"}, "event": {"title": "Release Hold", "manual": True}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "toggle-debug":
                card_data = {"subscription": {"type": "Toggle Debug"}, "event": {"title": "Toggle Debug", "manual": True}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "clear-queue":
                card_data = {"subscription": {"type": "Clear Queue"}, "event": {"title": "Clear Queue", "manual": True}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "set-timer":
                # Create an event to indicate the timer being set
                card_data = {"subscription": {"type": "Set Timer"}, "event": {"title": "Set Timer", "val": data["val"]}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "shutdown":
                print("SHUTTING DOWN")
                self.shutdown = True
                self.monitor_stream_info = False
                return True
            elif data["command"] == "set-event-position":
                card_data = {"subscription": {"type": "Set Event Position"}, "event": {"title": "Set Event Position", "position": data["position"]}, "manual": True}
                await self.log_event(card_data)
            elif data["command"] == "identify-connection":
                self.connection_names[data["sender"]["uuid"]] = data["sender"]["name"]
            elif data["command"] == "list-connections":
                print("{} active connections:".format(len(self.connection_names)))
                for k, v in self.connection_names.items():
                    print("{} -- {}".format(k, v))
            elif data["command"] == "timer-form":
                card_data = {"subscription": {"type": "Timer"}, "event": {"title": "Timer", "mode": data["mode"], "start_value": data["start_value"]}, "manual": True}
                await self.log_event(card_data)
            else:
                print("Unknown command: {}".format(data["command"]))

    async def get_stream_info(self):
        if self.monitor_stream_info:
            print("Tracking stream info...")
        else:
            print("Stream info tracker is currently DISABLED")
        while self.monitor_stream_info:
            now = time.time()
            if now - self.last_monitor_stream_info_time > self.monitor_stream_interval:
                self.last_monitor_stream_info_time = now
                data = await first(self.twitch.get_streams(user_login=USERNAME))
                if data:
                    data = data.to_dict()
                    stream_info = Event(kind="stream-info", raw=data).jsonized()
                    websockets.broadcast(self.connections, json.dumps(stream_info))
            else:
                await asyncio.sleep(self.monitor_stream_interval)


async def main():

    print("\n" * 30)
    m = Event_Monitor()
    await m.initialize_twitch_api_connection()
    await m.authenticate_twitch_user()
    print("Preparing EventSub Arguments...")
    prepare_eventsub_args(m.user.id, m.log_event)
    print("Prepared.")
    m.launch_reverse_proxy(NGROK_TOKEN, NGROK_PORT)
    if "-quick" in sys.argv:
        print("Skipping EventSub Subscriptions. Functionality will be limited.")
    else:
        await m.subscribe_to_eventsub_events()
    #await asyncio.gather(m.run_websocket_server(), m.get_stream_info())
    # uncomment the above, or run gemrule below
    await asyncio.gather(m.run_websocket_server(), m.get_stream_info(), gemrule_launch(m.twitch))

    try:
        input("Press ENTER to quit\n")
    finally:
        await event_sub.stop()
        await twitch.close()
    print("Shutting Down...")

asyncio.run(main())
