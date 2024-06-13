"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";
import { Notepad } from "/static/cdosstream/js/modules/notepad.js";

var ws = null;
var notepad = null;

class SCP_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "SCP Websocket Connection";
    }

    connection_established()
    {
        $("#ws-connection").attr("title", "Connected as " + this.uuid);
        $("#ws-connection").html("✅");
    }

    connection_lost()
    {
        $("#wozzt-name").removeClass("ega-black");
        $("#wozzt-name").addClass("ega-red");
        $("#ws-connection").html("❌");
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
            else { default_log(event) }
        }
        else
        {
            console.log("[!] JS_FUNC NOT SET ON EVENT");
            console.log(event);
        }
    }
}


$(document).ready(function (){
    $("#ws-connection").click(ws_toggle_connection);
    $("input[type=submit]").click(post_form);
    $(".shortcut-button").click(load_command_shortcut);
    $("#event-position-select").change(set_event_position);
    $(".iframe-launcher").click(launch_iframe);

    ws = new SCP_Websocket_Connection(WEBSOCKET_SERVER_HOST, WEBSOCKET_SERVER_PORT);
    ws.init();


    notepad = new Notepad();
    $("#notepad")[0].addEventListener("keyup", (event) => notepad.restart_timer(event));

    $("select[name=widget-select]").change(change_widget);
    $("#card-overview tr").click(prep_card);
    clean_card_select();
    change_widget();
});


function post_form(e)
{
    e.preventDefault();
    if (ws.websocket == null)
    {
        console.log("No Websocket Connection Found. Form cannot post.");
        return false;
    }

    console.log("Posting form");

    var form = $(e.target).parent().parent();
    var form_id = form.attr("id");

    if (form_id == "replay-event-form")
    {
        ws.ws_send({"command": "replay", "pk": $("#id_pk").val()});
    }
    else if (form_id == "set-card-form")
    {
        ws.ws_send({"command": "set-card", "pk": $("#id_card").val()});
        highlight_active_card();
    }
    else if (form_id == "send-command-form")
    {
        ws.ws_send({"command": $("#id_command").val(), "params": $("#id_params").val()});
        $("#id_command").val("");
        $("#id_params").val("");
    }
    else if (form_id == "custom-card-form")
    {
        ws.ws_send({"command": "set-custom-card", "basic": $("#id_basic_params")[0].innerHTML, "extras": $("#id_extra_params").text()});
    }
    else
    {
        let form_data = $(form).serializeArray();
        form_data = list_to_object(form_data);
        form_data["command"] = form_id;
        console.log("SENDING", form_data);
        ws.ws_send(form_data);
    }
}


function highlight_active_card()
{
    var pk = $("#id_card").val();
    $("#card-overview tr").removeClass("highlight");
    $("#card-overview tr[data-pk=" + pk + "]").addClass("highlight");
}

function ws_toggle_connection()
{
    ws.toggle_connection();
}


function load_command_shortcut()
{
    var command = $(this).data("command");
    var params = JSON.stringify($(this).data("params"));
    $("#id_command").val(command);
    $("#id_params").val(params);
}


function set_event_position()
{
    if (ws != null)
        ws.ws_send({"command": "set-event-position", "position": $("#event-position-select").val()});
    return true;
}


function launch_iframe()
{
    let target_str = $(this).data("target");
    let url = $(this).data("url").replaceAll("[CHANNEL]", $("input[name=twitch-channel-name]").val());
    let w = $(this).data("width");
    let h = $(this).data("height");
    $(target_str).html(`<iframe src="${url}" width="${w}" height="${h}"></iframe>`);
}

function change_widget()
{
    console.log("Changing widget");
    $(".widget.active").removeClass("active");
    let widget_id = $("select[name=widget-select]").val();
    $(widget_id).addClass("active");
}

function prep_card()
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

    $("#id_basic_params").text(params);
    $("#card-overview .selected").removeClass("selected");
    $(this).addClass("selected");
}

function clean_card_select()
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
