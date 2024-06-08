"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";
import * as Registered_Events from "/static/cdosstream/js/modules/events.js";

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
    }

    connection_established()
    {
    }

    connection_lost()
    {
    }

    delegate_event(event)
    {
        event = JSON.parse(event);

        if (! event.meta)
        {
            console.log("[!] Received malformed event:");
            console.log(event);
            return false;
        }

        // Discard irrelevant events
        if ((event.meta.kind == "set-card") || (event.meta.kind == "stream-info") || (event.meta.kind == "set-custom-card"))
            return false;

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
        let icon = `<span class="${event.meta.icon.fg} ${event.meta.icon.bg}" id="event-icon-${event.meta.pk}">${event.meta.icon.char}</span>`;
        $("#event-queue").html($("#event-queue").html() + icon);

        console.log("1. [" + event.meta.pk  + "] Queued received event:", event.meta.kind);
    }

    process_event()
    {
        // Initiates process of runnning an event
        this.HANDLING = true;
        let event = this.EVENTS.shift();
        console.log("2. [" + event.meta.pk + "] Processing event:", event.meta.kind);

        if (event.meta.kind == "timer") // TODO I don't like this living here
        {
            console.log(Registered_Events);
            Registered_Events["timer_start"](event);
            return true;
        }

        // Pull relevant HTML for event
        $.ajax({
            url:"/event/" + event.meta.pk + "/",
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
    let func_name = (event.meta.js_func) ? event.meta.js_func : "undefined_event";
    console.log("3. [" + event.meta.pk + "] Running card w/ requested function:", func_name);
    console.log(event);
    return await Registered_Events[func_name](event);
}
