"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

var ws = null;

class Card_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "Card Websocket Connection";
        this.allowed_event_kinds = ["set-card", "set-custom-card"];
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
            if (event.meta.kind == "set-custom-card")
                set_custom_card(event);
            else
                set_card(event);
        }
        return false;
    }
}

$(document).ready(function (){
    ws = new Card_Websocket_Connection(WEBSOCKET_SERVER_HOST, WEBSOCKET_SERVER_PORT);
    ws.init();
});

async function set_card(event)
{
    var requested_card = event.body.event.card_pk;

    $.ajax({
        url:("/card/" + requested_card + "/")
    }).done(function (resp){
        $("#info-card").html(resp);
    });
}

async function set_custom_card(event)
{
    console.log("GOT A CUSTOM CARD");
    console.log(event);
    let raw_info = event.body.event.basic;
    let raw_extra = event.body.event.extras;
    let html = `<div id="stream-card" class="cp437 ega-darkblue-bg">`;
    let color = "gray";

    // Parse info
    let lines = raw_info.split("\r\n");
    if (raw_extra)
        lines = lines.concat(raw_extra.split("\r\n"));

    for (let idx = 0; idx < lines.length; idx++)
    {
        let line = lines[idx].trim();
        if (! line || line.indexOf("#") == 0)
            continue;
        let key, value;
        [key, value] = line.split("=", 2)

        if (key == "URL" || value == "")
            continue;

        console.log(key, value);

        html += `<div>
            <h1><span class="heading-letter ega-${color}-bg">${key[0]}</span>${key}:</h1>
            <div class="indented-block">${value}</div>
        </div>
        `

        color = (color == "gray") ? "darkcyan" : "gray";
    }

    $("#info-card").html(html + "</div>");
}
