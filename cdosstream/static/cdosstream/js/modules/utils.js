// Utility functions

export function print_registered_events(registered_events)
{
    let event_str = "REGISTERED EVENT PLAYER EVENTS\n";
    for (let key in registered_events)
    {
        event_str += key + "\n";
    }
    console.log(event_str);
}

export function raw_event_to_class(event, registered_events)
{
    let components = event.meta.kind.split("-");
    let class_name = "Event_" + components.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1)).join("_");
    console.log("CONSTRUCTING CLASS: ", class_name);
    let obj = new registered_events[class_name](event);
    return obj;
}
