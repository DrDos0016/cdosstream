from django.urls import include, path

import cdosstream.views
import cdosstream.event_views

urlpatterns = [
    #path("", cdosstream.views.stream_control_panel),
    path("", cdosstream.views.obs_test),

    path("event/capture/", cdosstream.views.capture_event),
    path("event/<int:pk>/", cdosstream.event_views.get_event_view, name="get_event_view"),
    path("event/<int:pk>/<slug:slug>/", cdosstream.event_views.call_event_view),
    path("event/special/<slug:slug>/", cdosstream.event_views.call_event_view, {"pk": 0}),
    path("get-event/", cdosstream.views.get_event),

    path("notepad/save/", cdosstream.views.notepad_save),

    path("query/<slug:slug>/", cdosstream.views.get_query),

    path("scene/<slug:slug>/", cdosstream.views.Scene_View.as_view(), name="scene"),

    path("widget/blank/", cdosstream.views.Blank_View.as_view()),
    path("widget/card/", cdosstream.views.Card.as_view()),
    path("widget/event-player/", cdosstream.views.Event_Player_View.as_view()),
    path("widget/header/", cdosstream.views.Header.as_view()),
    path("widget/patron-credits/", cdosstream.views.Patron_Credits.as_view()),

    path("create-event/goal/", cdosstream.views.create_event_goal),

    path("zeoguessr/", cdosstream.views.zeoguessr),

    path("obs-test/", cdosstream.views.obs_test),
    path("obs-ws-reference/", cdosstream.views.obs_ws_reference),

    # Confirm these are used below

    #path("widget/chat/", cdosstream.views.Chat.as_view()),

    path("card/latest/", cdosstream.views.get_card, {"pk": -1}),
    path("card/<int:pk>/", cdosstream.views.get_card),
]
