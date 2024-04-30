import json
import time

from datetime import datetime

from django.db import models
from django.template.defaultfilters import slugify
from django.urls import reverse

from .core import REGISTERED_EVENTS
from .event_querysets import Event_Queryset


class Event(models.Model):
    objects = Event_Queryset.as_manager()

    raw = models.JSONField(null=True, blank=True)
    cleaned = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed = models.IntegerField(default=0)
    processed_at = models.DateTimeField(null=True, blank=True)
    kind = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return "Event ({}) [{}] -- {}".format(self.pk, str(self.created_at)[5:10], self.kind)

    def prepare(self):
        if self.raw.get("subscription"):
            if self.raw["subscription"].get("type") == "channel.channel_points_custom_reward_redemption.add":
                self.kind = slugify(self.raw["event"]["reward"]["title"]).lower()
            else:
                self.kind = slugify(self.raw["subscription"]["type"]).lower()
        else:
            if self.kind == "":
                self.kind = "?"
            elif not self.kind.startswith("?"):
                self.kind = "? " + self.kind

    def jsonized(self):
        event_info = REGISTERED_EVENTS.get(self.kind, {})
        output = {
            "meta": {
                "pk": self.pk if self.pk else -1,
                "kind": self.kind,
                "created_at": self.created_at if self.created_at else str(datetime.now()),
                "js_func": event_info.get("js_func", ""),
                "icon": self.get_queue_icon()
            },
            "body": self.raw
        }
        return output

    def get_absolute_url(self):
        return "/event/{}/{}/".format(self.pk, self.kind)

    def get_queue_icon(self):
        event_info = REGISTERED_EVENTS.get(self.kind, {})
        return event_info.get("icon", {"fg": "ega-white", "bg": "", "char": "?"})
