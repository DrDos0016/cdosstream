export let SHARED_LIST = ["foo", "bar", "baz"];

export class Websocket_Connection
{
    constructor(host, port, name="Foobar")
    {
        this.name = "Websocket Connection";
        this.connection_icon_selector = "#NOSELECTOR";
        this.connection_good_icon = "✅";
        this.connection_bad_icon = "❌";
        this.address = "";
        this.groups = [];

        this.needs_identification = true;
        this.uuid = "";

        this.websocket = null;
        this.host = host;
        this.port = port;
        this.log_all_events = true;
    }

    init()
    {
        this.setup();
        console.log("Init", this.name);
        if (this.websocket)
            return false;

        console.log(`Initalizing Websocket Connection for "${this.name}" | ADDRESS: ${this.host}:${this.port}`);
        this.websocket = new WebSocket(`ws://${this.host}:${this.port}/`);
        this.websocket.addEventListener("message", (event) => this.ws_receive(event));
        this.websocket.addEventListener("error", (event) => this.ws_close(event));
    }

    identify_connection(event)
    {
        let message = event.data;
        console.log(message);
        if (! this.uuid)
        {
            this.uuid = message;
            console.log(`${this.name} identify connection func [UUID=${this.uuid}]`);
            this.connection_established();
            this.ws_send({"command": "identify-connection"});
            return true;
        }
        return false;
    }

    toggle_connection()
    {
        if (this.websocket == null)
            this.init();
        else
            this.ws_close();
    }

    ws_receive(event)
    {
        if (this.needs_identification && ! this.uuid)
        {
            return this.identify_connection(event);
        }
        let message = event.data;
        this.delegate_event(message);
    }

    ws_send(obj)
    {
        obj["sender"] = {"name": this.name, "uuid": this.uuid};
        let message = JSON.stringify(obj);
        this.websocket.send(message);
    }

    ws_close(event)
    {
        console.log(`Closing Websocket Connection for "${this.name}" | ADDRESS: ${this.host}:${this.port}`);
        this.websocket.close();
        this.websocket = null;
        this.uuid = "";
        this.connection_lost();
    }

    get_timestamp()
    {
        let now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();
        let s = now.getSeconds();
        return `[${h}:${m}:${s}]`;
    }

    connection_established()
    {
        $(this.connection_icon_selector).attr("title", `${this.address} connected as ${this.uuid}`);
        $(this.connection_icon_selector).html(this.connection_good_icon);
    }

    connection_lost()
    {
        console.log("Lost");
        $(this.connection_icon_selector).attr("title", `{this.address} has no connection for ${this.uuid}`);
        $(this.connection_icon_selector).html(this.connection_bad_icon);
    }

    /* Functions intended to be defined in subclasses */
    setup() { return true; }
    delegate_event(event) { return true; }
    // Identify connection may need adjustment as well ^
}
