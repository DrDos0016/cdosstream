export class Websocket_Connection
{
    constructor(host, port) {
        this.name = "Websocket Connection";
        this.uuid = "";
        this.websocket = null;
        this.host = host;
        this.port = port;
    }

    init()
    {
        if (this.websocket)
            return false;

        console.log(`Initalizing Websocket Connection for "${this.name}" | ADDRESS: ${this.host}:${this.port}`);
        this.websocket = new WebSocket(`ws://${this.host}:${this.port}/`);
        this.websocket.addEventListener("message", (event) => this.ws_receive(event));
        this.websocket.addEventListener("error", (event) => this.ws_close(event));
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
        console.log("CALLED RECEIVE WITH EVENT", event);
        let message = event.data;

        if (! this.uuid)
        {
            this.uuid = message;
            this.connection_established();
            this.ws_send({"command": "identify-connection"});
            return true;
        }

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

    /* Functions intended to be overridden in subclass */
    connection_established() { return true; }
    connection_lost() { return true; }
    delegate_event(event) { return true; }
}
