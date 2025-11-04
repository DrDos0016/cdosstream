"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";
import { OBS_Websocket_Connection } from "/static/cdosstream/js/obs-ws.js";
import { Notepad } from "/static/cdosstream/js/modules/notepad.js";
import { Stream_Timer } from "/static/cdosstream/js/modules/timer.js";
import * as Registered_Events from "/static/cdosstream/js/modules/events.js";
import { print_registered_events, raw_event_to_class } from "/static/cdosstream/js/modules/utils.js";


var TWITCH_USERNAME = "WorldsOfZZT";
var ws = null;

let ws_connections = {};
let notepad = null;
let stream_timer = "X";

function build_request(type, data={})
{
    let output = {
        "op": 6,
        "d": {
            "requestType": type,
            "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c", // crypto.UUID does not function on non-https
            "requestData": data,
        }
    };
    return JSON.stringify(output);
}


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
        //console.log("SCP GOT AN EVENT: ", event);

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

        let event_class = raw_event_to_class(event, Registered_Events);
        console.log("Event Kind:", event_class.event_key, "Class:", event_class);
        let log = event_class.as_scp_log();
        $("#event-overview").prepend(log);
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
    // Add PK to pre-set cards
    params += `PK=${pk}\r\n`;

    $("#id_fields").val(params);
    $("#card-overview .selected").removeClass("selected");
    $(this).addClass("selected");
    $("#submit-custom-card-form").click();
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

class Info_Pre_Stream_Music
{
    constructor()
    {
        this.input_name = "Pre-Stream Music";
        this.start_volume = -6.0; // dB
        this.current_volume = this.start_volume; // Volume after reduction, used to track current vol. mid fade
        this.fade_speed = 200 // ms between volume reductions
        this.fade_decay = -1.0 // dB decreased per reduction
        this.cutoff = -25 // dB Point to just mute outright
        this.fade_timer = null;
    }
    
    fade_start()
    {
        if (this.fade_timer)
            clearInterval(this.fade_timer);
        this.fade_timer = setInterval(this.fade_out.bind(this), this.fade_speed);
    }
    
    fade_out()
    {        
        this.current_volume += this.fade_decay;
        if (this.current_volume <= this.cutoff && this.current_volume > -99)
            this.current_volume = -99;
        if (this.current_volume <= - 100)
            clearInterval(this.fade_timer);
        let request = build_request("SetInputVolume", {inputName: this.input_name, inputVolumeDb: this.current_volume});
        ws_connections.obsws.websocket.send(request);
    }
}

let info_pre_stream_music = new Info_Pre_Stream_Music();

function test_get_scene()
{
    let request = build_request("GetCurrentProgramScene");
    ws_connections.obsws.websocket.send(request);
}

function test_fade()
{
    info_pre_stream_music.fade_start();
}

function punt_event(event, destination)
{
    console.log("Generic punt");
    console.log("Punt event", event);
    console.log("Punt destination", destination);
    ws_connections[destination].delegate_event(event);
}

function change_widget()
{
    $(".widget.active").removeClass("active");
    let widget_id = $(this).data("widget");
    $("#" + widget_id).addClass("active");
}

function ws_toggle_connection()
{
    let key = $(this).data("key")
    ws_connections[key].toggle_connection();
}

function post_form(e)
{
    e.preventDefault();
    if (ws_connections.scp.websocket == null)
    {
        console.log("No SCP websocket Connection Found. Form cannot post.");
        return false;
    }

    console.log("Posting form");

    var form = $(e.target).parent().parent();
    var form_id = form.attr("id");

    if (form_id == "replay-event-form")
    {
        ws_connections.scp.ws_send({"command": "replay", "pk": $("#id_pk").val()});
    }
    else if (form_id == "set-card-form")
    {
        ws_connections.scp.ws_send({"command": "set-card", "pk": $("#id_card").val()});
        highlight_active_card();
    }
    else if (form_id == "send-command-form")
    {
        ws_connections.scp.ws_send({"command": $("#id_command").val(), "params": $("#id_params").val()});
        $("#id_params").val("");
    }
    else if (form_id == "custom-card-form")
    {
        ws_connections.scp.ws_send({"command": "set-custom-card", "fields": $("#id_fields").val()});
    }
    else if (form_id == "timer-form")
    {
        ws_connections.scp.ws_send({"command": "set-timer", "mode": $("input[name=mode]:checked").val(), "value": $("#id_start_value").val()});
    }
    else
    {
        let form_data = $(form).serializeArray();
        form_data["command"] = form_id;
        console.log("SENDING", form_data);
        ws_connections.scp.ws_send(form_data);
    }
}

function gemrule_auto_plug()
{
    if (ws_connections["scp"])
        ws_connections.scp.ws_send({"command": "gemrule-say", "message": "Discord: https://museumofzzt.com/discord/ | Bsky: https://bsky.app/profile/worldsofzzt.bsky.social | YouTube: https://www.youtube.com/c/WorldsofZZT | Patreon: https://patreon.com/worldsofzzt | More: https://museumofzzt.com/follow/"});
}

function reset_stream()
{
    ws_connections.obsws.reset_stream();
}

function get_wad()
{
    ws_connections.obsws.get_wad();
}

function test_timer_func()
{
    console.log("Ding! Test timer func!");
}

$(document).ready(function (){
    print_registered_events(Registered_Events);
    console.log("SCP Page is creating SCP_Websocket_Connection");
    ws_connections.scp = new SCP_Websocket_Connection(WEBSOCKET_SERVER_HOST, WEBSOCKET_SERVER_PORT);
    ws_connections.scp.init();
    console.log("SCP Page is creating OBS_Websocket_Connection");
    ws_connections.obsws = new OBS_Websocket_Connection("localhost", 4455);
    ws_connections.obsws.init();
    ws_connections.obsws.punt_event = punt_event;

    notepad = new Notepad();
    $("#notepad")[0].addEventListener("keyup", (event) => notepad.restart_timer(event));

    // Stream Timer
    /*
    stream_timer = new Stream_Timer();
    stream_timer.add(5, test_timer_func);
    let timer_id = setInterval(() => { stream_timer.tick()}, 1000);
    */

    $(".widget-button").click(change_widget);
    $(".connection-icon").click(ws_toggle_connection);
    $(".iframe-launcher").click(launch_iframe);
    $("input[type=submit]").click(post_form);

    // Test events
    render_test_events();


    $(".shortcut-button").click(load_command_shortcut);
    //$("#event-position-select").change(set_event_position);

    $("#card-overview tr").click(prep_card);
    $("#sub-info").click(get_subscriber_count);
    clean_card_select();
    get_subscriber_count();
    //$("#cards").show();

    $("#obs-getscene").click(test_get_scene);
    $("#clear-log").click(function (){ $("#obsws-log").val(""); });
    $("#test-fade").click(test_fade);
    $("#reset-stream").click(reset_stream);
    $("#wad").click(get_wad);

    // Timer
    setInterval(gemrule_auto_plug, 1000 * 60 * 52);
});

function render_test_events()
{
    console.log("TEST EVENTS");
    let test_3d_talk = new Registered_Events.Event_Use_The_3d_Talk_Engine({
        "meta": {"created_at": "2024-01-01 04:20:15.12Z", "kind": "use-the-3d-talk-engine", "pk": 0,  },
        "body": {"event": {"user_name": "WorldsOfZZT", "user_input":"The doorbell rings..."}},
    });
    $("#event-overview").prepend(test_3d_talk.as_scp_log());
    let test_bip_bo_beep = new Registered_Events.Event_Bip_Bo_Beep({
        "meta": {"created_at": "2024-01-01 04:23:28.12Z", "kind": "bip-bo-beep", "pk": 0,  },
        "body": {"event": {"user_name": "Snorb Probably", "user_input":""}},
    });
    $("#event-overview").prepend(test_bip_bo_beep.as_scp_log());
    let test_scroll = new Registered_Events.Event_Random_Scroll({
        "meta": {"created_at": "2024-01-01 04:23:28.12Z", "kind": "random-scroll", "pk": 0,  },
        "body": {"event": {"user_name": "TheBigChungus", "user_input":""}},
    });
    $("#event-overview").prepend(test_scroll.as_scp_log());
    let test_sub_message = new Registered_Events.Event_Channelsubscriptionmessage({
        "meta": {"created_at": "2024-01-01 04:23:28.12Z", "kind": "channelsubscriptionmessage", "pk": 0,  },
        "body": {"event": {"user_name": "My_Loyal_Fans", "user_input":"", "message":{"text": "5 Years of Maximum ZZT"}}},
    });
    $("#event-overview").prepend(test_sub_message.as_scp_log());
}
