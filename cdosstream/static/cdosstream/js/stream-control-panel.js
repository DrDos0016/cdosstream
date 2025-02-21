"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

var TWITCH_USERNAME = "WorldsOfZZT";
var ws = null;

export class SCP_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "SCP Websocket Connection";
        this.connection_icon_selector = "#ws-connection";
        this.address = "SCP";
        this.groups = [];
    }

    delegate_event(event)
    {
        // "event" being the JSON data received via websocket, not a JS event
        console.log("SCP GOT AN EVENT", event);

        event = JSON.parse(event);
        if (! event.meta)
        {
            console.log("[!] Received malformed event:");
            console.log(event);
            return false;
        }


        if (event.meta.kind == "stream-info")
        {
            stream_info(event);
            return true;
        }

        if (event.meta.js_func)
        {
            var func = window[event.meta.js_func];
            if (typeof func === "function") { func.apply(null, [event]); }
            else { default_log(event, event.meta.js_func, "unhandled") }
        }
        else
        {
            console.log("[!] JS_FUNC NOT SET ON EVENT");
            console.log(event);
        }
    }
}


function highlight_active_card()
{
    var pk = $("#id_card").val();
    $("#card-overview tr").removeClass("highlight");
    $("#card-overview tr[data-pk=" + pk + "]").addClass("highlight");
}


export function load_command_shortcut()
{
    var command = $(this).data("command");
    var params = JSON.stringify($(this).data("params"));
    $("#id_command").val(command);
    $("#id_params").val(params);
}


function set_event_position()
{
    console.log("Updating event pos");
    if (ws != null)
        ws.ws_send({"command": "set-event-position", "position": $("#event-position-select").val()});
    else
        console.log("NO ws object?");
    return true;
}


export function launch_iframe()
{
    let target_str = $(this).data("target");
    //let url = $(this).data("url").replaceAll("[CHANNEL]", $("input[name=twitch-channel-name]").val());
    let url = $(this).data("url").replaceAll("[CHANNEL]", TWITCH_USERNAME);
    let w = $(this).data("width");
    let h = $(this).data("height");
    $(target_str).html(`<iframe src="${url}" width="${w}" height="${h}"></iframe>`);
}

export function prep_card()
{
    let pk = $(this).data("pk");
    let params = "";

    let keys = ["World", "Author", "Company", "Date"];
    let attrs = ["title", "author", "company", "date"];
    for (let idx = 0; idx < keys.length; idx++)
    {
        let key = keys[idx];
        let attr = attrs[idx]
        params += key + "=" + $(`tr[data-pk=${pk}] .card-${attr}`).text() + "\r\n";
    }
    // URLs need href attribute
    params += "URL=" + $(`tr[data-pk=${pk}] .card-url`).attr("href") + "\r\n";

    $("#id_basic_params").val(params);
    $("#card-overview .selected").removeClass("selected");
    $(this).addClass("selected");
}

export function clean_card_select()
{
    // Hacky, but I'd rather rewrite this widget to be custom inputs later so this will do for now
    $("#id_card option").each(function (){
        let text = $(this).text();
        let pk = $(this).val();

        if (text.indexOf("<a href=") == 0)
        {
            let sliced = text.slice(text.indexOf(">") + 1, -4);
            $(this).text(sliced);

            let url = text.slice(9, text.indexOf(">") - 1);
            console.log(url);
            $(`#card-url-${pk}`).attr("href", "https://museumofzzt.com" + url);
        }

    });
}

function list_to_object(data)
{
    let output = {};
    for (let idx=0; idx < data.length; idx++)
    {
        if (data[idx].name == "csrfmiddlewaretoken")
            continue;
        output[data[idx].name] = data[idx].value;
    }
    return output;
}


export function get_subscriber_count()
{
    $.ajax({
        url:"/query/get-subscriber-info/"
    }).done(function (data){
        var count = data.sub_count;
        $("#sub-count-value").html(count);
    });
}
