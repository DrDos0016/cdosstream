import os

from django import template
from django.template import Context, Library
from django.template.loader import get_template
from django.utils.safestring import mark_safe
from django.conf import settings

register = Library()


@register.inclusion_tag("cdosstream/subtemplate/form-display.html")
def display_form(form, **kwargs):
    return {"form": form, "foo": "bar"}
