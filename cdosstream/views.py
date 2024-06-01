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
from .core import get_stream_entries, read_stream_notes
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
        return context


@csrf_exempt
def stream_control_panel(request):
    context = {"title": "Stream Control Panel"}
    #context["set_card_form"] = Set_Card_Form()
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


"""
@csrf_exempt
def process_form(request, slug):
    print("I THINK THIS CAN BE DELETED")
    # Calls .process() function on whitelisted forms based on slug in URL with POST data
    available_forms = {
        "set-recording-timer-form": Set_Recording_Timer_Form,
        "set-card-form": Set_Card_Form,
        "replay-event-form": Replay_Event_Form,
        "set-av-form": Set_AV_Form,
        "send-command-form": Send_Command_Form,
        "huh": whatthe,
    }
    form = available_forms.get(slug)

    if not form:
        return JsonResponse({"success": False, "errors": [{"message": "Form '{}' not found".format(slug)}]})

    form = form(request.POST)

    if form.is_valid():
        form.process()
        return JsonResponse({"success": True, "response": form.response})
    return JsonResponse({"success": False, "errors": form.errors.get_json_data()})
"""


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
        context["title"] = "Blank (Use ?w and ?h to speecify dimensions)"
        return context


class Card(TemplateView):
    template_name = "cdosstream/widget/card.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Card"
        return context


"""
class Chat(TemplateView):
    template_name =  "cdosstream/widget/chat.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Chat"
        return context
"""


class Header(TemplateView):
    template_name = "cdosstream/widget/header.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Header"
        return context


class Patron_Credits(TemplateView):
    template_name = "cdosstream/widget/patron-credits.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Patron Credits"
        return context
