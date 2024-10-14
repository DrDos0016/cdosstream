import os

import requests

from django.views.generic.base import TemplateView

from proj.settings import BASE_DIR


STREAM_NOTES_FILE_PATH = os.path.join(BASE_DIR, "cdosstream", "static", "cdosstream", "stream-notes.txt")

SUB_GOAL = 350
SUB_GOAL_REWARD = "Bonus Stream: <span class='ega-yellow'>IDK! Suggestions welcome</span>"


def get_stream_entries():
    print("Acquiring stream entry cards from Museum of ZZT")
    r = requests.get("https://museumofzzt.com/ajax/get-stream-entries/")
    return r.json().get("items")


class Event_View(TemplateView):
    pass


REGISTERED_EVENTS = {
    "bip-bo-beep": {  # Ref: 69
        "view": "Bip_Bo_Beep_View",
        "js_func": "bip_bo_beep",
        "icon": {"fg": "ega-green", "bg": "", "char": "♠"}
    },
    "channelcheer": {  # Ref: 260
        "view": "Channel_Cheer_View",
        "js_func": "channelcheer",
        "icon": {"fg": "ega-green", "bg": "", "char": "♦"}
    },
    "channelfollow": {  # Ref: 249
        "view": "Channel_Follow_View",
        "js_func": "channelfollow",
        "icon": {"fg": "ega-white", "bg": "ega-darkblue-bg", "char": "☻"},
    },
    "channelraid": {  # Ref: 1035
        "view": "Channel_Raid_View",
        "js_func": "channelraid",
        "icon": {"fg": "ega-white", "bg": "ega-darkyellow-bg", "char": "≡"},
    },
    "channelsubscribe": {  # Ref: 243 for plain, 1557 for gifted
        "view": "Channel_Subscribe_View",
        "js_func": "channelsubscribe",
        "icon": {"fg": "ega-purple", "bg": "", "char": "♀"},
    },
    "channelsubscriptionmessage": {  # Ref: 1550
        "view": "Channel_Subscription_Message_View",
        "js_func": "channelsubscriptionmessage",
        "icon": {"fg": "ega-purple", "bg": "", "char": "♀"},
    },
    "channelsubscriptiongift": {  # Ref: 1565 / 1556
        "view": "Channel_Subscription_Gift_View",
        "js_func": "channelsubscriptiongift",
        "icon": {"fg": "ega-purple", "bg": "", "char": "♀"},
    },
    "guide-the-raid": {  # Ref: ?
        "js_func": "guide_the_raid",
        "icon": {"fg": "ega-green", "bg": "", "char": "►"},
    },
    "hahaha": {  # Ref: ?
        "view": "Hahaha_View",
        "js_func": "hahaha",
        "icon": {"fg": "ega-darkgray", "bg": "", "char": "\""}
    },
    "hydrate": {  # Ref: 991
        "view": "Hydrate_View",
        "js_func": "hydrate",
        "icon": {"fg": "ega-white", "bg": "ega-darkblue-bg", "char": "░"},
    },
    "its-bird-oclock-somewhere": {  # Ref: 268
        "view": "Its_Bird_OClock_Somewhere_View",
        "js_func": "its_bird_oclock_somewhere",
        "icon": {"fg": "ega-white", "bg": "", "char": "v"},
    },
    "posture-check": {  # Ref: 252
        "view": "Posture_Check_View",
        "js_func": "posture_check",
        "icon": {"fg": "ega-yellow", "bg": "ega-darkcyan-bg", "char": "☻"},
    },
    "random-scroll": {  # Ref: 252
        "view": "Random_Scroll_View",
        "js_func": "random_scroll",
        "icon": {"fg": "ega-white", "bg": "", "char": "Φ"},
    },
    "set-card": {
        "js_func": "set_card",
        "icon": {"fg": "ega-white", "bg": "", "char": "■"},
    },
    "streeeeeeeeeetch": {  # Ref: 159
        "view": "Streeeeeeeeeetch_View",
        "js_func": "streeeeeeeeeetch",
        "icon": {"fg": "ega-yellow", "bg": "ega-blue-bg", "char": "☺"},
    },
    "sub-goal": {  # Ref: X
        "view": "Sub_Goal_View",
        "js_func": "sub_goal",
        "icon": {"fg": "ega-red", "bg": "", "char": "♥"},
    },
    "use-the-3d-talk-engine": {  # Ref: 1033
        "view": "Use_The_3D_Talk_Engine_View",
        "js_func": "use_the_3d_talk_engine",
        "icon": {"fg": "ega-yellow", "bg": "ega-darkred-bg", "char": "☺"},
    },
    "yeaaaaahh": {  # Ref: 1046
        "view": "Yeaaaaahh_View",
        "js_func": "yeaaaaahh",
        "icon": {"fg": "ega-yellow", "bg": "ega-darkgreen-bg", "char": "☻"},
    },
    "zzt-toilet-flush": {  # Ref: 973
        "view": "ZZT_Toilet_Flush_View",
        "js_func": "zzt_toilet_flush",
        "icon": {"fg": "ega-white", "bg": "", "char": "∩"},
    },
}

def get_stub_event_data(event_title):
    STUB_EVENT_DATA = {
        "subscription": {
            "id": "",
            "status": "enabled",
            "type": "",
            "version": "1",
            "condition": {
                "broadcaster_user_id": "",
                "reward_id": ""
            },
            "transport": {
                "method": "webhook",
                "callback": ""
            },
            "created_at": "",
            "cost": 0
        },
        "event": {
            "broadcaster_user_id": "",
            "broadcaster_user_login": "",
            "broadcaster_user_name": "",
            "id": "",
            "user_id": "",
            "user_login": "",
            "user_name": "",
            "user_input": "",
            "status": "",
            "redeemed_at": "",
            "reward": {
                "id": "",
                "title": "",
                "prompt": "",
                "cost": 0
            }
        }
    }

    event_data = STUB_EVENT_DATA
    event_data["event"]["reward"]["title"] = event_title
    return event_data


def read_stream_notes():
    if not os.path.isfile(STREAM_NOTES_FILE_PATH):
        with open(STREAM_NOTES_FILE_PATH, "w") as fh:
            contents = ""
    else:
        with open(STREAM_NOTES_FILE_PATH) as fh:
            contents = fh.read()
    return contents
