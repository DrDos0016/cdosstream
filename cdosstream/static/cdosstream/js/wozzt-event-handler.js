"use strict";

var repeat_rate = {
    "event_handling_check": 250,
    "advance_header": 30000,
    "update_clock": 1000,
};

var speed = {
    "event_fade": 250,
}

var HANDLING = false; // Is an event being handled?
var EVENTS = [];
var websocket = null;
var connection_uuid = "";

$(document).ready(function (){
    $("#debug").val("");
    console.log("Initalizing.");
    update_sub_info();
    update_cheer_info();
    ws_init();
    setInterval(handle_event, repeat_rate.event_handling_check);
    setInterval(advance_header, repeat_rate.advance_header);
    setInterval(update_clock, repeat_rate.update_clock);
});

function ws_init()
{
    websocket = new WebSocket("ws://192.168.254.15:8765/");
    websocket.close = ws_close;
    websocket.error = ws_close;
    websocket.onmessage = ({ data }) => {
        var event = data; // IDK but it doesn't like naming the variable event above
        if (! connection_uuid)
        {
            connection_uuid = data;
            $("#wozzt-name").removeClass("ega-darkred");
            $("#wozzt-name").addClass("ega-black");
            console.log("Connected as " + connection_uuid);
        }
        else
        {
            event = JSON.parse(event);

            if (event.meta.kind == "release-hold") // Special case to fix stuck events
            {
                conclude_event(event);
                return true;
            }
            else if (event.meta.kind == "clear-queue") // Special case to empty the entire queue
            {
                EVENTS = []
                $("#event-queue").html("");
                conclude_event(event);
                return true;
            }
            else if (event.meta.kind == "stream-info") // Ignore stream viewer updates
                return false;

            else if (event.meta.kind == "set-card") // Continue handling this
            {
                EVENTS.push(event)
            }
            //iconify_event(event);
            console.log("1. [" + event.meta.pk  + "] Queued received event:", event.meta.kind);
        }
    };
}

function ws_close()
{
    $("#wozzt-name").removeClass("ega-black");
    $("#wozzt-name").addClass("ega-darkred");
    websocket = null;
}


async function handle_event()
{
    // Called every 0.25s to see if an event has been queued
    if (HANDLING || (! EVENTS.length)) // Doing something or nothing to do
    {
        return false;
    }

    HANDLING = true;
    event = EVENTS.shift();
    await process_event(event);
}


async function process_event(event)
{
    // Initiates process of runnning a received event
    console.log("2. [" + event.meta.pk + "] Processing event:", event.meta.kind);
    console.log(event);
    if (event.meta.kind == "set-card")
    {
        console.log("2B. [" + event.meta.pk + "] Using special case for Set-Card");
        set_card(event);
        conclude_event(event);
        return true;
    }
    else if (event.meta.kind == "toggle-debug")
    {
        console.log("2B. [" + event.meta.pk + "] Using special case for Toggle-Debug");
        $("#debug").toggleClass("show");
        conclude_event(event);
        return true;
    }

    if (event.meta.pk == -1) // Manual events? TODO CONFIRM
        return true;

    // Pull relevant HTML for event
    $.ajax({
        url:"/event/" + event.meta.pk + "/",
        //data:{"pk": event.meta.pk}
    }).done(function (data){
        // Hide both info and event cards
        $("#info-card").removeClass("active");
        $("#event-card").removeClass("active");

        // Add the new card's HTML and allow it to be visible
        $("#event-card").html(data);
        $("#event-card").addClass("active");

        // Fade the card in and run any necessary code
        $("#event-card").animate({opacity: 1}, speed.event_fade, function (){
            run_card(event);
        });
    });
}

async function run_card(event)
{
    console.log("3. [" + event.meta.pk + "] Running card w/ requested function:", event.meta.js_func);

    var func = window[event.meta.js_func];
    if (typeof func === "function") {
        console.log("4. [" + event.meta.pk + "] Applying function:", event.meta.js_func);
        func.apply(null, [event]);
    }
    else {
        console.log("UNKNOWN FUNCTION: '" + event.meta.js_func + "'");
        conclude_event(event);
        console.log(event);
    }
}


function advance_header()
{
    roll_plug();

    var next = $("#header-left .active").next();
    $("#header-left .active").removeClass("active");
    if (next.length)
        next.addClass("active");
    else
        $("#header-left div").first().addClass("active");
}

function roll_plug()
{
    var plugs = $(".plugs > div");
    var count = plugs.length;
    var idx = random_int(0, count - 1);

    plugs.hide();
    plugs.removeClass("active-plug");
    $(plugs[idx]).addClass("active-plug");
    $(".active-plug").show();
}

function update_sub_info()
{
    var today = new Date();
    var ymd = today.getFullYear() + "-" + (today.getMonth() + 1) + "-01";
    $.ajax({
        url:"/subscriber-info/?ymd=" + ymd
    }).done(function (data){
        console.log(data);
        var count = data.sub_count;
        if (count > 999)
            count = "!!!";
        else if (count < 10)
            count = "0" + ("" + count);
        $("#sub-count").html(count);
        $("#latest-subscriber-name").html(data.latest_subscriber);
    });
}

function update_cheer_info()
{
    $.ajax({
        url:"/cheer-info/"
    }).done(function (data){
        console.log(data);
        var count = data.count;

        count = "00000" + ("" + count);
        count = count.slice(-5);
        $("#cheer-count").html(count);
        $("#latest-cheer-name").html(data.latest);
        $("#record-cheer-name").html(data.greatest);
        $("#record-cheer-amount").html(data.max);
    });
}

function update_clock()
{
    var now = new Date();
    var time = now.toTimeString();
    $("#current-time").html(time.slice(0,8));
    if (HANDLING)
        $("#current-time").addClass("ega-yellow");
    else
        $("#current-time").removeClass("ega-yellow");
}

function conclude_event(event)
{
    $("#event-card").html("");
    $("#event-card").removeClass("active");
    $("#info-card").addClass("active");
    HANDLING = false;
    console.log("6. [" + event.meta.pk + "] Fade Out Complete. Handling is now false");
}
