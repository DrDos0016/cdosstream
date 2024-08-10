import os

from django import template
from django.template import Context, Library
from django.template.loader import get_template
from django.utils.safestring import mark_safe
from django.conf import settings

from cdosstream.models import Audio_Info

register = Library()


@register.inclusion_tag("cdosstream/subtemplate/form-display.html")
def display_form(form, **kwargs):
    return {"form": form, "foo": "bar"}


@register.inclusion_tag("cdosstream/subtemplate/audio-info.html")
def audio_info(key):
    ai = Audio_Info.objects.filter(key=key).first()
    if not ai:
        return {"artist":"INVALID KEY", "track":key}
    return {"artist": ai.artist, "track": ai.track, "url": ai.url, "pk": ai.pk}
