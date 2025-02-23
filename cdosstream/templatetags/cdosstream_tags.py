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


# Copied from MoZZT - Feb. 23, 2025
@register.inclusion_tag("cdosstream/subtemplate/plug.html")
def plug(service, **kwargs):
    services = {
        "bluesky": {"service": "Bluesky", "icon": "/static/cdosstream/icons/bsky.svg", "text": "@WorldsOfZZT"},
        "twitter": {"service": "Twitter", "icon": "/static/cdosstream/icons/plug-twitter.png", "text": "@WorldsOfZZT"},
        "mastodon": {"service": "Mastodon", "icon": "/static/cdosstream/icons/plug-mastodon.svg", "text": "WorldsOfZZT@mastodon.social"},
        "tumblr": {"service": "Tumblr", "icon": "/static/cdosstream/icons/plug-tumblr.png", "text": "@WorldsOfZZT"},
        "discord": {"service": "Discord", "icon": "/static/cdosstream/icons/plug-discord.png", "text": "<span class='ega-yellow'>!Discord</span>"},
        "patreon": {"service": "Patreon", "icon": "/static/cdosstream/icons/patreon_logo.png", "text": "/worldsofzzt"},
        "youtube": {"service": "YouTube", "icon": "/static/cdosstream/icons/plug-youtube.png", "text": "@WorldsOfZZT"},
        "twitch": {"service": "Twitch", "icon": "/static/cdosstream/icons/plug-twitch.png", "text": "Worlds of ZZT on Twitch"},
        "github": {"service": "GitHub", "icon": "/static/cdosstream/icons/GitHub-Mark-32px.png", "text": "Worlds of ZZT on GitHub"},
        "rss": {"service": "RSS", "icon": "/static/cdosstream/icons/rss-large.png", "text": "Worlds of ZZT RSS Feeds"},
    }

    context = services.get(service)
    return context
