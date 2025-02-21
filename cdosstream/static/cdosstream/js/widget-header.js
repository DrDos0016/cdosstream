"use strict";
var HEADER_SPEED = 30000;
//var HEADER_SPEED = 2000;

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

var ws = null;

class Header_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "Header Websocket Connection";
        this.allowed_event_kinds = ["channelsubscribe", "channelsubscriptionmessage", "channelsubscriptiongift", "channelcheer"];
        this.connection_icon_selector = "#zzt-connection-indicator";
        this.connection_good_icon = "ZZT";
        this.connection_bad_icon = "???";
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

        if (this.allowed_event_kinds.indexOf(event.meta.kind) != -1)
        {
            if (event.meta.kind == "channelcheer")
                update_cheer_info();
            else
                update_sub_info();
        }
        return false;
    }
}

$(document).ready(function (){
    console.log("Initalizing.");
    update_sub_info();
    update_cheer_info();
    ws = new Header_Websocket_Connection(WEBSOCKET_SERVER_HOST, WEBSOCKET_SERVER_PORT);
    ws.init();
    setInterval(advance_header, HEADER_SPEED);
    setInterval(update_clock, 1000);

    $("#header-left").click(advance_header);
});

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
        url:"/query/get-subscriber-info/"
    }).done(function (data){
        let goal_str = $("#sub-goal").text();
        let sub_goal;
        if (goal_str != "???")
            sub_goal = parseInt(goal_str);
        else
            sub_goal = 999999;
        var count = data.sub_count;
        if (count > 999)
            count = "!!!";
        else if (count < 10)
            count = "0" + ("" + count);
        $("#sub-count").html(count);
        $("#latest-subscriber-name").html(data.latest_subscriber);
        console.log("Subs updated", count, "/", sub_goal, data.latest_subscriber);

        if (count >= sub_goal)
        {
            sub_goal_met();
        }
    });
}

function update_cheer_info()
{
    $.ajax({
        url:"/query/get-cheer-info/"
    }).done(function (data){
        var count = data.count;

        count = "00000" + ("" + count);
        count = count.slice(-5);
        $("#cheer-count").html(count);
        $("#latest-cheer-name").html(data.latest);
        $("#record-cheer-name").html(data.greatest);
        $("#record-cheer-amount").html(data.max);
        console.log("Cheers updated", count);
    });
}

function update_clock()
{
    var now = new Date();
    var time = now.toTimeString();
    $("#current-time").html(time.slice(0,8));
}

function sub_goal_met()
{
    $("#sub-goal").text("???");
    console.log("Goal reached :3");

    $.ajax({
        url:"/create-event/goal/"
    }).done(function (data){
        //console.log("Event created for reaching goal.");
        // "Replay" the newly logged event
        ws.ws_send({"command": "replay", "pk": data.meta.pk});
    });
}
