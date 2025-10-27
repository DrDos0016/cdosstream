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
