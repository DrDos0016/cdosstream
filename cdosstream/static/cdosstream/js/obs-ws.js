"use strict";

import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

//var obs_ws = null;

const OBS_MICROPHONE_INPUT_NAME = "Mic/Aux";

export class OBS_Websocket_Connection extends Websocket_Connection
{
    constructor(host, port)
    {
        super(host, port);
        this.name = "OBS Websocket Connection";
        this.connection_icon_selector = "#obs-connection";
        this.address = "OBS";
        this.groups = [];

        this.log_all_events = true;
        this.base_ws_connected = false;
        this.base_ws = null;

        this.obs_event_functions = {
            "CurrentProgramSceneChanged": CurrentProgramSceneChanged,
            "InputMuteStateChanged": InputMuteStateChanged,
        }
    }

    delegate_event(event)
    {
        // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#events
        this.obs_log_event(event);
        event = JSON.parse(event);
        let punt = false;

        if (event.op == 2) // Identified
        {
            console.log("OBSWS: Successfully identified");
            this.connection_established();
            this.identified = true;
        }
        else if (event.op == 5) // Event
        {
            let callable_function = this.obs_event_functions[event.d.eventType];
            if (! callable_function)
                console.log(`OBS-WS.JS could not call function, ${callable_function}`);
            else
                return callable_function(this, event);

            /*
            if (event.d.eventType == "CurrentProgramSceneChanged")
            {
                event.meta = {
                    "kind": "OBS Scene Change",
                    "js_func": `obsws_${event.d.eventType}`,
                    "created_at": new Date(),
                    "pk": "OBS",
                }
                event.body = {"event": event.d.eventData};
                punt = true;
            }
            */
        }
        else if (event.op == 7) // Request Response
        {
            // Send an event received by OBSWS to the main WS Event system
            event.meta = {
                "kind": "obsws-punt",
                "js_func": `obsws_${event.d.requestType}`,
                "created_at": new Date(),
                "pk": "OBS",
            };
            event.body = {"event": {"user_name": "OBSWS"}};
            punt = true;
        }

        if (punt)
            this.punt_event(JSON.stringify(event), "scp");
    }

    identify_connection(event)
    {
        event = JSON.parse(event.data)
        console.log(event);
        if (event.op !== 0)
        {
            console.log("ERROR: OBSWS event received was not meant to be used for identification");
            return false;
        }

        let command = {"op": 1, "d": {"rpcVersion": 1,}} // OP #1: Identify
        this.websocket.send(JSON.stringify(command));
        console.log("OBSWS: Identification Sent Successfully." );
        this.uuid = "OBSWS";
        return true;
    }

    base_ws_connect()
    {
        // TODO: Hardcoded
        console.log("Connecting to base WS");
        this.base_ws = new WebSocket(`ws://192.168.254.15:8765/`);
        this.base_ws.addEventListener("message", (event) => this.base_ws_null(event));
        this.base_ws.addEventListener("error", (event) => this.base_ws_null(event));
        this.base_ws_connected = true;
        console.log("Connected", this.base_ws);
    }

    base_ws_null(event)
    {
        // Not our job. Do nothing.
        return true;
    }

    obs_log_event(event)
    {
        let log = $("#obsws-log").val();
        let now = new Date();
        let h = ("0" + now.getHours()).slice(-2);
        let m = ("0" + now.getMinutes()).slice(-2);
        let s = ("0" + now.getSeconds()).slice(-2);
        let event_log_string = `[${h}:${m}:${s}] <OBS> ${event}\n`;
        $("#obsws-log").val(event_log_string + log);

    }
}


// Callable Events
function CurrentProgramSceneChanged(self, event)
{
    //{"d":{"eventData":{"sceneName":"[2] KevEdit Composite"},"eventIntent":4,"eventType":"CurrentProgramSceneChanged"},"op":5}
    let full_scene_name = event.d.eventData.sceneName;
    let scene_name = full_scene_name.replace(" Composite", "");
    let bracket_idx = scene_name.indexOf("]");
    if (bracket_idx != -1)
        scene_name = scene_name.slice(bracket_idx + 1).trim();

    $(".obs-value[data-obs-key=scene]").html(scene_name);
    $(".obs-value[data-obs-key=scene]").attr("title", full_scene_name);
    return true;
}

function InputMuteStateChanged(self, event)
{
    if (event.d.eventData.inputName != OBS_MICROPHONE_INPUT_NAME)
        return false

    let muted = event.d.eventData.inputMuted;
    let output = muted ? "MUTED" : "ON AIR";
    if (muted)
        $("#obs-mic-wrapper").addClass("muted");
    else
        $("#obs-mic-wrapper").removeClass("muted");
    $(".obs-value[data-obs-key=microphone]").html(output);
    return true;
}
