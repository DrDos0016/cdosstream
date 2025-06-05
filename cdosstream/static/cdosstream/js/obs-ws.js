"use strict";
import { Websocket_Connection } from "/static/cdosstream/js/modules/websocket_connection.js";

let OPCODE = {"HELLO": 0, "IDENTIFY": 1, "IDENTIFIED": 2, "REIDENTIFY": 3, "N/A": 4, "EVENT": 5, "REQUEST": 6, "REQUEST_RESPONSE": 7, "REQUEST_BATCH": 8, "REQUEST_BATCH_RESPONSE": 9};
let UUID_SCENE = {
    "PRESTREAM":    "fbcafa89-a143-4233-8aba-da210a6390b4",
    "WORLDS":       "5fdbef60-88bd-489a-b20f-0888b4d85497",
    "OUTRO":        "49f5563c-9cd3-48a5-ad65-e7bdea274825",
    "ZZT":          "93888a88-a827-4462-8cb5-81e6b35850aa",
    "KEVEDIT":      "286c7e8c-24ea-48c3-9465-d47bc74eac3a",
    "ADBREAK":      "398f708e-119f-43e4-9f53-5a72a05ad5bc",
}
let INPUTS  = {
    "Desktop Audio (Keep Muted)": "57dd87b0-4ec4-4817-a46e-2e28bdd0da1e",
    "Microphone": "ca47c4e4-6ff9-464f-8bdc-edf5ef3fd4ef",
    "Ad Break Music": "18b0559a-3da5-49be-a722-264bddb284b7",
    "WoZZT Theme": "450f168e-737e-4b6c-a22a-a78706631ba4",
}
let DO_NOT_PUNT_EVENTS = [
    "GetSceneList", "GetInputList", "SetInputVolume", "GetSceneItemList",
];

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

        this.redeem_location = "CORNER";

        this.event_handler_functions = [this.stub, this.stub, this.identified];
    }

    identified(event)
    {
        console.log("I got to identified here");
    }

    delegate_event(event)
    {
        // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#events
        this.obs_log_event(event);
        event = JSON.parse(event);
        let punt = false;

        //let event_handler_function = this.event_handler_functions[event.op];
        /*console.log("OP", event.op);
        event_handler_function(event);*/

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
        }
        else if ((event.op == 7) && (DO_NOT_PUNT_EVENTS.indexOf(event.d.requestType) == -1)) // Request Response + Punt
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
        else if ((event.op == 7) && (DO_NOT_PUNT_EVENTS.indexOf(event.d.requestType) != -1)) // Request Response, do not punt
        {
            console.log("No need to punt this");
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

        let event_pretty = JSON.stringify(JSON.parse(event), null, 4) ;

        let event_log_string = `[${h}:${m}:${s}] <OBS> ${event_pretty}\n`;
        $("#obsws-log").val(event_log_string + log);
    }

    connection_established()
    {
        super.connection_established();
        console.log("My conn estab func");
        let command = {"op": 6, "d": {"requestType": "GetSceneList", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c"}};
        this.websocket.send(JSON.stringify(command));
        command = {"op": 6, "d": {"requestType": "GetInputList", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c"}};
        this.websocket.send(JSON.stringify(command));
        command = {"op": 6, "d": {"requestType": "SetInputVolume", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c", "requestData": {"inputName": "Pre-Stream Music", "inputVolumeDb": -6.0}}};
        this.websocket.send(JSON.stringify(command));
    }

    reset_stream()
    {
        let command = {"op": OPCODE.REQUEST, "d": {"requestType": "GetSceneItemList", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c", "requestData": {"sceneUuid": UUID_SCENE.PRESTREAM}}};
        this.websocket.send(JSON.stringify(command));
        return true;

        console.log("Resetting stream!");
        console.log("Inputs WoZZT Theme", INPUTS["WoZZT Theme"]);
        // Disable source - WoZZT Theme
        command = {"op": OPCODE.REQUEST, "d": {"requestType": "SetSceneItemEnabled", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c", "requestData": {"sceneUuid": UUID_SCENE.PRESTREAM, "sceneItemID": INPUTS["WoZZT Theme"], "sceneItemEnabled": false}}};
        this.websocket.send(JSON.stringify(command));
        // Set Pre-Stream Music vol to -6.0db
        // Enable Source - Pre-Stream Music
        // Change scene to Pre-Stream
    }

    get_wad()
    {
        console.log(RAW_SCENE_LIST);
        console.log(RAW_INPUT_LIST);
        console.log("LL", RAW_SCENE_LIST.length);

        for (let idx = 0; idx < RAW_SCENE_LIST.length; idx++)
        {
            let command = {"op": OPCODE.REQUEST, "d": {"requestType": "GetSceneItemList", "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c", "requestData": {"sceneUuid": RAW_SCENE_LIST[idx].sceneUuid}}};
            this.websocket.send(JSON.stringify(command));
        }
    }

    get_scene_list()
    {
        console.log("Gonna get scene list");
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

    /*
    let new_redeem_location = "CORNER";
    if (full_scene_name.toUpperCase().indexOf("AD-BREAK") != -1)
    {
        new_redeem_location = "CENTER";
    }
    if (new_redeem_location != ws_connections.obsws.redeem_location)
    {
        ws_connections.obsws.redeem_location = new_redeem_location;
        console.log("REDEEMS NOW GO IN", new_redeem_location);
    }*/

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
