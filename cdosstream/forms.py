from django import forms
from django.core.cache import cache


from .models import *
from .core import get_stream_entries

FAUX_EVENT_TEMPLATE = {
    "subscription": {"type": ""},
    "event": {"title": ""},
}


def create_new_event_dict(kind):
    output = dict(FAUX_EVENT_TEMPLATE)
    output["subscription"]["type"] = kind
    output["event"]["title"] = kind
    return output


def get_card_choices():
    choices = []
    items = get_stream_entries()
    for item in items:
        choices.append((item["pk"], item["title"]["value"]))

    return choices


class Custom_Card_Form(forms.Form):
    identifier = "custom-card-form"
    use_required_attribute = False
    response = ""

    fields = forms.CharField(label="Card Fields", widget=forms.Textarea, initial="World=\r\nAuthor=\r\nCompany=\r\nDate=\r\nURL=\r\n")

    def process(self):
        new_card = self.cleaned_data["card"]
        event_data = create_new_event_dict(kind="Set Card")
        event_data["event"]["card_pk"] = new_card.pk
        event = Event(raw=event_data)
        event.prepare()
        event.save()

        self.response = str(event)


class Set_Card_Form(forms.Form):
    identifier = "set-card-form"
    use_required_attribute = False
    response = ""

    card = forms.ChoiceField(choices=get_card_choices)

    def process(self):
        new_card = self.cleaned_data["card"]
        event_data = create_new_event_dict(kind="Set Card")
        event_data["event"]["card_pk"] = new_card.pk
        event = Event(raw=event_data)
        event.prepare()
        event.save()

        self.response = str(event)


class Set_AV_Form(forms.Form):
    identifier = "set-av-form"
    use_required_attribute = False
    response = ""

    CHOICES = (
        ("none", "- None -"),
        ("intro", "Intro"),
        ("outro", "Outro"),
    )

    av = forms.ChoiceField(choices=CHOICES, label="A/V Overlay")

    def process(self):
        event_data = create_new_event_dict(kind="Set A/V Overlay")
        event_data["event"]["av_overlay"] = self.cleaned_data["av"]
        event = Event(raw=event_data)
        event.prepare()
        event.save()
        self.response = str(event)


class Replay_Event_Form(forms.Form):
    identifier = "replay-event-form"
    use_required_attribute = False
    submit_text = "Replay"
    response = ""

    pk = forms.IntegerField(label="Event ID")

    def process(self):
        print("REPLAY EVENT FORM IS BEING PROCESSED")
        event = Event.objects.get(pk=self.cleaned_data["pk"])
        event.processed = False
        event.save()

        self.response = str(event)


class Shortcut_Field(forms.BooleanField):
    required = False


class Shortcut_Button_Widget(forms.TextInput):
    template_name = "cdosstream/widget/shortcut-button-widget.html"


class Send_Command_Form(forms.Form):
    identifier = "send-command-form"
    use_required_attribute = False
    submit_text = "Run"
    
    COMMAND_CHOICES = (
        ("replay-event", "Replay Event <#>"),
        ("gemrule-say", "Gemrule Says <text>"),
        ("clear-event-queue", "Clear Event Queue"),
        ("obs-connect", "Connect to OBS"),
    )

    command = forms.ChoiceField(choices=COMMAND_CHOICES)
    params = forms.CharField(required=False)

    def process(self):
        self.response = "Greeting from Send_Command_Form.process()."


class Timer_Form(forms.Form):
    identifier = "timer-form"
    use_required_attribute = False
    response = ""
    submit_text = "Launch"

    mode = forms.ChoiceField(label="Mode", widget=forms.RadioSelect, choices=(("DOWN", "Count Down From"), ("UP", "Count Up To"), ("PAUSE", "Toggle Pause")), initial="DOWN")
    start_value = forms.CharField(label="Start Value")

    def process(self):
        new_card = self.cleaned_data["card"]
        event_data = create_new_event_dict(kind="Set Card")
        event_data["event"]["card_pk"] = new_card.pk
        event = Event(raw=event_data)
        event.prepare()
        event.save()

        self.response = str(event)
