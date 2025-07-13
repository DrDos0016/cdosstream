import random
import time

import requests

from django.http import HttpResponse, JsonResponse
from django.views.generic.base import TemplateView
from django.views.generic.detail import DetailView
from django.shortcuts import redirect

from .core import REGISTERED_EVENTS
from .models import Event

def get_query(request, slug):
    func_name = slug.replace("-", "_")
    output = getattr(Event.objects, func_name)()
    return JsonResponse(output)

class Event_View(DetailView):
    model = Event
    template_name = "cdosstream/event/basic-card.html"
    context_object_name = "event"

    image = None
    text = None

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.event_json = self.object.jsonized()
        context["title"] = self.object.kind.replace("-", " ").title()
        context["event_func"] = self.object.kind.replace("-", "_")
        context["is_ajax"] = self.is_ajax()
        context["username"] = self.get_username()
        context["image"] = "/static/cdosstream/event/{}/{}".format(self.object.kind, self.image) if self.image else None
        context["text"] = self.text
        return context

    def is_ajax(self):
        return True if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest' else False

    def get_username(self):
        return self.event_json["body"]["event"]["user_name"]


def get_event_view(request, pk):
    event = Event.objects.get(pk=pk)
    return redirect(event.get_absolute_url())


def call_event_view(request, pk, slug, *args, **kwargs):
    view = REGISTERED_EVENTS.get(slug, {"view": "Undefined_Event_View"})["view"]
    print("VIEW IS", view)
    return globals()[view].as_view()(request, pk=pk, slug=slug)



class Undefined_Event_View(Event_View):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["event_func"] = "undefined_event"
        context["image"] = "/static/cdosstream/event/undefined-event/undefined-event.png"
        context["text"] = "ÜÜÜÜÜÜÜÜÜ ÜÜÜÜÜ! ÜÜÜ ÜÜÜÜÜ."
        return context

    def get_username(self):
        return "Ü"
        
class Beautiful_Music_View(Event_View):
    image = "beautiful-music.gif"
    text = "Ahhh. Beautiful music."


class Bip_Bo_Beep_View(Event_View):
    image = "forest.png"
    text = "Bip-bo-beep"


class Channel_Cheer_View(Event_View):
    image = "gem-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        text = "<span class='ega-cyan'>{}</span> cheered<br><span class='ega-green'>{}</span> bits!<br><span class='ega-yellow'>{}</span>"
        bits = self.event_json["body"]["event"]["bits"]
        message = self.event_json["body"]["event"].get("message", "")
        context["text"] = text.format(context["username"], bits, message)
        return context


class Channel_Subscribe_View(Event_View):
    image = "key-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        gifted = self.event_json["body"]["event"].get("is_gift", False)
        if gifted:
            context["text"] = "<span class='ega-cyan'>{}</span> was gifted a subscription to the channel!".format(context["username"])
        else:
            context["text"] = "<span class='ega-cyan'>{}</span> has subscribed to the channel!".format(context["username"])

        return context


class Channel_Subscription_Gift_View(Event_View):
    image = "key-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        total = self.event_json["body"]["event"]["total"]
        context["text"] = "<span class='ega-cyan'>{}</span> has gifted <span class='ega-yellow'>{}</span> viewer{} with a subscription to the channel!".format(
            context["username"],
            total,
            ("s" if total != 1 else ""),
        )

        return context


class Channel_Subscription_Message_View(Event_View):
    image = "key-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["text"] = "<span class='ega-cyan'>{}</span> has resubscribed to the channel!<br><span class='ega-yellow'>{}</span>".format(
            context["username"],
            self.event_json["body"]["event"]["message"].get("text", "")
        )
        return context


class Channel_Follow_View(Event_View):
    image = "player-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["text"] = "<span class='ega-cyan'>{}</span> is now following!".format(context["username"])
        return context


class Channel_Raid_View(Event_View):
    image = "passage-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        text = "<span class='ega-cyan'>{}</span> raided the stream<br>with <span class='ega-yellow'>{}</span> viewers!"
        context["text"] = text.format(context["username"], self.event_json["body"]["event"]["viewers"])
        return context

    def get_username(self):
        return self.event_json["body"]["event"]["from_broadcaster_user_name"]
        
class Guide_The_Raid_View(Event_View):
    image = "passage-8x.png"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        raided_channel = self.event_json["body"]["event"].get("user_input", "???")
        context["text"] = "<span class='ega-cyan'>Let's #walk on over to {}'s channel...</span>".format(raided_channel)
        return context
        
        
class Hahaha_View(Event_View):
    image = "hahaha.png"
    text = "Ha ha ha"


class Hydrate_View(Event_View):
    image = "water-8x.png"
    text = "Your thirst is quenched by water!"


class Its_Bird_OClock_Somewhere_View(Event_View):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        birds = [
            "No bird", "American Robin", "Northern Mockingbird", "Blue Jay", "House Wren", "Tufted Titmouse", "Baltimore Oriole", "Mourning Dove",
            "Black-capped Chickadee", "Northern Cardinal", "White-throated Sparrow", "White-breasted Nuthatch", "House Finch"
        ]
        random.seed(self.request.path)
        hour = random.randint(1, 12)
        hour_padded = ("0" + str(hour))[-2:]

        image = "/static/cdosstream/event/its-bird-oclock-somewhere/{}.png"
        text = "It's Bird O'Clock Somewhere<br><span class='ega-yellow'>{}:00</span> - <span class='ega-cyan'>{}</span>"

        context["image"] = image.format(hour_padded)
        context["text"] = text.format(hour, birds[hour])
        context["hour"] = hour
        return context


class Posture_Check_View(Event_View):
    image = "posture.png"
    text = "Posture Check!"


class Random_Scroll_View(Event_View):
    template_name = "cdosstream/event/random-scroll.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.GET.get("pk"):
            r = requests.get("https://museumofzzt.com/api/v2/scroll/get/?pk={}".format(self.request.GET["pk"]))
        else:
            r = requests.get("https://museumofzzt.com/api/v2/scroll/random/")
        context["scroll"] = r.json()["data"][0]

        # Replication of Scroll.content_as_text()
        raw = context["scroll"]["fields"]["content"]
        lines = raw.split("\n")
        output = []
        for line in lines:
            if line.startswith("@"):
                continue
            output.append(line)
        context["scroll_content_as_text"] = "\n".join(output)

        context["next"] = int(self.request.GET.get("pk", 1)) + 1
        return context


class Streeeeeeeeeetch_View(Event_View):
    text = "Stretchin'"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["image"] = "/static/cdosstream/event/streeeeeeeeeetch/stretch.gif?{}".format(int(time.time()))
        return context

class Sub_Goal_View(TemplateView):
    template_name = "cdosstream/event/basic-card.html"
    text = "Sub Goal Met!<br><span class='ega-cyan'>Bonus Stream Unlocked!</span>"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Goal!"
        context["image"] = "/static/cdosstream/event/sub-goal/goal.png"
        context["text"] = self.text
        context["username"] = ":)"

        """
        "sub-goal": {  # Ref: X
        "view": "Sub_Goal_View",
        "js_func": "sub_goal",
        "icon": {"fg": "ega-red", "bg": "", "char": "♥"},
        },"""
        return context


class Use_The_3D_Talk_Engine_View(Event_View):
    image = "3dtalk.gif"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        text = "<span class='ega-cyan'>{}</span>: <span class='ega-yellow'>{}</span>"
        context["text"] = text.format(context["username"], self.event_json["body"]["event"]["user_input"])
        return context


class Yeaaaaahh_View(Event_View):
    image = "jill.png"

class ZZT_Toilet_Flush_View(Event_View):
    image = "toilet-8x.png"
    text = "<span class='ega-yellow'>&lt;&lt;Flush&gt;&gt;</span>"
