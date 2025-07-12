import glob
import os
import time
import random
import json

from datetime import datetime, timezone

from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.views.decorators.csrf import csrf_exempt

from .models import *
from .forms import *
from .core import get_stream_entries, read_stream_notes, SUB_GOAL, SUB_GOAL_REWARD, get_stub_event_data
from .event_views import *

from twitchAPI.helper import first
from twitchAPI.twitch import Twitch


@csrf_exempt
def capture_event(request):
    """ Take a received Twitch event and transform it into a CDosStream Event """
    event_data = json.loads(request.body)
    event = Event(raw=event_data)
    event.prepare()
    event.save()
    return JsonResponse(event.jsonized())


def create_event_goal(request):
    event = Event(raw=get_stub_event_data("sub-goal"))
    event.prepare()
    event.kind = "sub-goal"
    event.save()
    return JsonResponse(event.jsonized())


def get_card(request, pk):
    """ Load Stream Info Card from Museum and return it as HTML """
    context = {"card": None}
    cards = get_stream_entries()

    for card in cards:
        if card["pk"] == pk:
            context["card"] = card
            break

    return render(request, "cdosstream/event/zzt-card.html", context)


class Scene_View(TemplateView):
    def get_template_names(self):
        if self.kwargs.get("slug"):
            return "cdosstream/scene/wozzt-{}.html".format(self.kwargs.get("slug"))
        else:
            return "cdosstream/scene/wozzt-primary-scene.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = self.kwargs.get("slug", "NO TITLE")

        if self.kwargs.get("slug") == "outro":
            r = requests.get("https://museumofzzt.com/ajax/get-stream-schedule/")
            context["streams"] = r.json().get("items")
            for stream in context["streams"]:
                try:
                    stream["when"] = datetime.fromisoformat(stream["when"])
                except ValueError:
                    stream["when"] = ""
        return context

def get_event(request):
    """ Returns an event model in JSONized form """
    event = Event.objects.get(pk=request.GET["pk"])
    return JsonResponse(event.jsonized())


@csrf_exempt
def notepad_save(request):
    contents = request.POST.get("contents")
    if not contents:
        return JsonResponse({"success": False, "response": "Notepad contents were blank!"})
    else:
        with open("/home/drdos/projects/stream/cdosstream/static/cdosstream/stream-notes.txt", "w") as fh:
            fh.write(contents)
        return JsonResponse({"success": True, "response": "Notepad contents saved"})


class Event_Player_View(TemplateView):
    template_name = "cdosstream/widget/event-player.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Event Player"
        return context


class Blank_View(TemplateView):
    template_name = "cdosstream/widget/blank.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "[{}x{}] (?w/?h to set size)".format(self.request.GET.get("w", 480), self.request.GET.get("h", 350))
        return context


class Card(TemplateView):
    template_name = "cdosstream/widget/card.html"

    def get_context_data(self, **kwargs):
        if self.request.GET.get("alt"):
            self.template_name = "cdosstream/widget/card-refresh.html"
        context = super().get_context_data(**kwargs)
        context["title"] = "Card"
        return context


class Header(TemplateView):
    template_name = "cdosstream/widget/header.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Header"
        context["SUB_GOAL"] = SUB_GOAL
        context["SUB_GOAL_REWARD"] = SUB_GOAL_REWARD
        return context


class Patron_Credits(TemplateView):
    template_name = "cdosstream/widget/patron-credits.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Patron Credits"
        return context


def zeoguessr(request):
    context = {"card": None}
    context["title"] = "World"

    puzzles = [
        {"answer": "MERBOTIA", "directory": "merbotia"},
        {"answer": "BUG TOWN", "directory": "bugtown"},
        {"answer": "CAT CAT THAT DAMN CAT", "directory": "cat-cat-that-damn-cat"},
        {"answer": "DEEP DECEMBER", "directory": "deep-december"},
        {"answer": "DUNGEONS OF ZZT", "directory": "dungeons-of-zzt"},
    ]

    puzzle = puzzles[random.randint(0, len(puzzles) - 1)]

    images = glob.glob("/home/drdos/projects/stream/cdosstream/static/cdosstream/zeoguessr/{}/*.png".format(puzzle["directory"]))
    print(len(images))
    image = images[random.randint(0, len(images) - 1)]

    # Set up hint
    hint = ""
    for ch in puzzle["answer"]:
        if ch == " ":
            hint += " "
        else:
            hint += random.choice("░▒▓█")

    puzzle["image"] = "cdosstream/zeoguessr/{}/{}".format(puzzle["directory"], os.path.basename(image))
    puzzle["hint"] = hint
    context["puzzle"] = puzzle
    return render(request, "cdosstream/zeoguessr.html", context)


def stream_control_panel(request):
    context = {"title": "Stream Control Panel"}
    context["SUB_GOAL"] = SUB_GOAL
    context["SUB_GOAL_REWARD"] = SUB_GOAL_REWARD
    context["set_card_form"] = Custom_Card_Form()

    context["forms"] = [
        Replay_Event_Form(),
        Send_Command_Form(),
        Timer_Form(),
    ]

    # Get cards from Musuem
    cards = get_stream_entries()
    context["cards"] = cards
    context["recent_events"] = Event.objects.all().order_by("-id")[:5]
    context["notes"] = read_stream_notes()
    return render(request, "cdosstream/stream-control-panel.html", context)

def obs_ws_reference(request):
    context = {"title": "OBS Websocket Reference"}
    return render(request, "cdosstream/obs-ws-reference.html", context)
