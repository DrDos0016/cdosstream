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

@csrf_exempt
def capture_event(request):
    """ Take a received Twitch event and transform it into a CDosStream Event """
    event_data = json.loads(request.body)
    event = Event(raw=event_data)
    event.prepare()
    event.save()
    return JsonResponse(event.jsonized())


def create_event_goal(request):
    event = Event(raw=get_stub_event_data("sub-goal", "AUTO:Sub Goal Met"))
    event.prepare()
    event.kind = "sub-goal"
    event.save()
    return JsonResponse(event.jsonized())
    
def create_event_sub_goal_progress(request):
    event = Event(raw=get_stub_event_data("sub-goal", "Sub Goal Progress"))
    event.prepare()
    event.kind = "sub-goal-progress"
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

def get_art(request):
    images = glob.glob("/home/drdos/projects/stream/cdosstream/static/cdosstream/scene/art/*.png")
    

    image = os.path.basename(images[random.randint(0, len(images))])
    prefix = image.split("-")[0]
    prefixes = {
        "artwork": "Artwork Collection v.01 (1999)",
        "freezer": "FreeZerBurn's ARt (1999)",
        "lemmer": "Planet Lemmer Industries (1999)",
        "mosaic": "Mosaic (1999)",
        "mosaic2": "Mosaic! 2 (1999)",
        "ownage": "Ownage Triangle (2004)",
        "rai": "R.E.S.T.A.R.T. (2000)",
        "tseng": "Stairway To Da Hood (2000)",
        "xmas": "Season's Greetings (1992)"
    }
    
    # TODO Move this
    # Quick and dirty Art Test
    """
    for fname in images:
        image = os.path.basename(fname)
        prefix = image.split("-")[0]
        desc = prefixes.get(prefix, None)
        if desc is None:
            print("BROKEN PREFIX", image)
	"""

    desc = prefixes.get(prefix, "Unknown origin! Yell at Dos.")

    return JsonResponse({"image": image, "desc": desc})


def subscroller(request):
    context = {"title": "Sub Scroller"}
    context["starting_subs"] = cache.get("STARTING_SUBS", 69)
    context["current_subs"] = Event.objects.get_subscriber_info()["sub_count"]
    context["goal"] = SUB_GOAL
    
    #context["starting_subs"] = 39
    #context["current_subs"] = 57
    #context["goal"] = request.GET.get("g", 57)
    #print("CONTEXT", context)
    return render(request, "cdosstream/subscroller.html", context)

def gemrule_test(request):
    context = {"title": "Gemrule Test"}
    return render(request, "cdosstream/gemrule-test.html", context)
