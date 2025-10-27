"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";
import * as Registered_Events from "/static/cdosstream/js/modules/events.js";
import { print_registered_events, raw_event_to_class } from "/static/cdosstream/js/modules/utils.js";

var ws = null;
var speed = {
    "event_check": 125,
    "event_fade": 250,
}

class Event_Player_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "Event Player Websocket Connection";
        this.EVENTS = []; // Event queue
        this.HANDLING = false;

        this.connection_icon_selector = "#NOSELECTOR";
        this.connection_good_icon = "✅";
        this.connection_bad_icon = "❌";
    }

    delegate_event(event)
    {
        event = JSON.parse(event);
        console.log("Event player received an event");
        console.log(event);

        if (! event.meta)
        {
            console.log("[!] Received malformed event:");
            console.log(event);
            return false;
        }

        // Discard irrelevant events
        if ((event.meta.kind == "set-card") || (event.meta.kind == "stream-info") || (event.meta.kind == "set-custom-card"))
            return false;

        // Handle events that do not need to be queued
        if (event.meta.kind == "set-timer")
        {
            set_timer(event.body.event.mode, event.body.event.value);
            return false;
        }

        this.queue_event(event);
        return false;
    }

    queue_event(event)
    {
        // Handle changing event position
        if (event.meta.kind == "set-event-position")
        {
            console.log("SETTING TO", event.body.event.position);
            $("#event-card").removeClass(["position-standard", "position-centered"]);
            $("#event-card").addClass(event.body.event.position);
            return false;
        }

        // Push to event list
        this.EVENTS.push(event)

        // Iconify the event
        console.log("Iconify?", event);
        let icon = `<span class="${event.meta.icon.fg} ${event.meta.icon.bg}" id="event-icon-${event.meta.pk}">${event.meta.icon.char}</span>`;
        $("#event-queue").html($("#event-queue").html() + icon);

        console.log("1. [" + event.meta.pk  + "] Queued received event:", event.meta.kind);
    }

    process_event()
    {
        // Initiates process of runnning an event
        this.HANDLING = true;
        let event = this.EVENTS.shift();
        let pk = event.meta.pk
        console.log("2. [" + event.meta.pk + "] Processing event:", event.meta.kind);
        console.log("Just the event", event);

        if (event.meta.kind == "timer") // TODO I don't like this living here
        {
            console.log(Registered_Events);
            Registered_Events["timer_start"](event);
            return true;
        }
        
        if (! event.meta.js_func)
        {
            console.log("Using Class for", event.meta.kind);
            event = raw_event_to_class(event, Registered_Events);
        }

        // Pull relevant HTML for event
        $.ajax({
            url:"/event/" + pk + "/",
        }).done(function (data){
            // Blank current card
            $("#event-card").html("");
            $("#event-card").data("finished", false);
            // Add the new card's HTML and allow it to be visible
            $("#event-card").html(data);
            // Fade the card in and run any necessary code
            $("#event-card").animate({opacity: 1}, speed.event_fade, function (){
                run_card(event);
            });
        });
    }
}

$(document).ready(function (){
    //ws_init();
    ws = new Event_Player_Websocket_Connection(WEBSOCKET_SERVER_HOST, WEBSOCKET_SERVER_PORT);
    ws.init();

    sound.addEventListener("canplaythrough", (event) => {
        sound.play();
    });

    setInterval(check_event_queue, speed.event_check);
    
    print_registered_events(Registered_Events);
});

async function check_event_queue()
{
    if ($("#event-card").data("finished") == true && ws.HANDLING)
        ws.HANDLING = false;

    if (ws.HANDLING || (! ws.EVENTS.length)) // Doing something or nothing to do
    {
        return false;
    }

    await ws.process_event();
}

async function run_card(event)
{
    console.log("MEOWDY RUN CARD FUNC EVENT IS");
    console.log(event);
    
    if (event.class_based_event)
    {
        console.log("3. [" + event.pk + "] Running class-based event");
        return await event.play();
    }
    else
    {
        let func_name = (event.meta.js_func) ? event.meta.js_func : "undefined_event";
        console.log("3. [" + event.meta.pk + "] Running card w/ requested function:", func_name);
        console.log(event);
        return await Registered_Events[func_name](event);
    }
}

/* TODO: This can live elsewhere I'm sure */
var timer_interval = null;
var timer_components = {"h": 0, "m": 0, "s": 0, "increment": 0, "paused": false};
function set_timer(mode, initial)
{
    console.log(mode, timer_components);
    // Pause gets special case
    if (mode == "PAUSE" && (timer_components.paused == false))
    {
        timer_components.paused = true;
        $("#timer-frame").addClass("paused");
        return false;
    }
    else if (mode == "PAUSE" && (timer_components.paused == true))
    {
        timer_components.paused = false;
        $("#timer-frame").removeClass("paused");
        return false;
    }

    if (timer_interval)
        clearInterval(timer_interval);

    if (initial == "")
        $("#timer-frame").removeClass("active");
    else
        $("#timer-frame").addClass("active");

    timer_interval = setInterval(tick_timer, 1000)
    let increment = (mode == "UP" ? 1 : -1);
    let split = initial.split(":")
    timer_components.h = parseInt(split[0]);
    timer_components.m = parseInt(split[1]);
    timer_components.s = parseInt(split[2]);
    timer_components.increment = increment;
}

function tick_timer()
{
    // Tick timer
    if (timer_components.paused)
        return false;

    timer_components.s += timer_components.increment;

    if (timer_components.s >= 60)
    {
        timer_components.s = 0;
        timer_components.m++;
    }
    else if (timer_components.s < 0)
    {
        timer_components.s = 59;
        timer_components.m--;
    }

    if (timer_components.m >= 60)
    {
        timer_components.m = 0;
        timer_components.h++;
    }
    else if (timer_components.m < 0)
    {
        timer_components.m = 59;
        timer_components.h--;
    }

    if (timer_components.h < 0)
    {
        timer_components.h = 0;
        timer_components.increment = 0;
    }

    let h_padded = ("0" + timer_components.h).slice(-2);
    let m_padded = ("0" + timer_components.m).slice(-2);
    let s_padded = ("0" + timer_components.s).slice(-2);

    $("#timer-hours").html(h_padded);
    $("#timer-minutes").html(m_padded);
    $("#timer-seconds").html(s_padded);
}


