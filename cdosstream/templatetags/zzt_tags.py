import os

from django import template
from django.template import Library
from django.utils.safestring import mark_safe
from django.conf import settings

register = Library()

@register.tag(name="scroll")
def scroll(parser, token):
    nodelist = parser.parse(('endscroll',))
    parser.delete_first_token()
    return ZztScroll(nodelist)


class ZztScroll(template.Node):
    def __init__(self, nodelist):
        self.nodelist = nodelist

    def render(self, context):
        raw = self.nodelist.render(context)
        output = "<div class='c'>\n<div class='zzt-scroll'>\n"

        if not str(raw).strip():
            raw = ["", "TODO: SCROLL HAS NO TEXT"]  # Expected TODO usage.
        else:
            raw = raw.split("\n")

        if raw[0] == "" and raw[1][0] == "@":  # It's okay to start on the second line
            raw = raw[1:]
        if raw[0] != "" and raw[0][0] == "@":
            output += "<div class='name'>" + raw[0][1:] + "</div>\n"
        else:
            output += "<div class='name'>Interaction</div>\n"

        output += "<div class='content'>\n"

        # Pad short scrolls with blank lines
        output += "<br>\n" * (10 - len(raw))
        output += "  •    •    •    •    •    •    •    •    •<br>\n"

        # Header dots
        for line in raw[1:]:
            if line and line[0] == "$":
                output += "<div class='white'>" + line[1:] + "</div>\n"
            elif line and line[0] == "!":
                output += ("<div class='hypertext'>" + line.split(";", 1)[-1] +
                           "</div><br>\n")
            else:
                output += "<span class='plaintext'>" + line + "</span><br>\n"

        if raw[-1] == "":  # Strip trailing empty string resulting in newline
            output = output[:-5]

        # Footer dots
        output += "  •    •    •    •    •    •    •    •    •<br>\n"
        output += "</div>\n</div>\n</div>\n"

        # Fix spacing
        output = output.replace("  ", "&nbsp;&nbsp;")
        return output
