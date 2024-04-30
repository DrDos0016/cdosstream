"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

var ws = null;

class Header_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "Header Websocket Connection";
        this.allowed_event_kinds = ["channelsubscribe", "channelsubscriptionmessage", "channelsubscriptiongift", "channelcheer"];
    }

    connection_established()
    {
        $("#wozzt-name").removeClass("ega-darkred");
        $("#wozzt-name").addClass("ega-black");
        $("#wozzt-name").attr("title", "Connected as " + this.uuid);
    }

    connection_lost()
    {
        $("#wozzt-name").removeClass("ega-black");
        $("#wozzt-name").addClass("ega-red");
        $("#wozzt-name").attr("title", "No connection");
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
    setInterval(advance_header, 30000);
    setInterval(update_clock, 1000);
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
        var count = data.sub_count;
        if (count > 999)
            count = "!!!";
        else if (count < 10)
            count = "0" + ("" + count);
        $("#sub-count").html(count);
        $("#latest-subscriber-name").html(data.latest_subscriber);
        console.log("Subs updated", count, data.latest_subscriber);
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
