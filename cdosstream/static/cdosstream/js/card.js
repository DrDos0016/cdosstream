"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

var ws = null;

class Card_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "Card Websocket Connection";
        this.allowed_event_kinds = ["set-card"];
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
