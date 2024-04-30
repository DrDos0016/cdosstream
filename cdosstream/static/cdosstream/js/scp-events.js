function stream_info(event)
{
    $("#stream-viewers").html(event.body.viewer_count);
    $("#stream-title").html(event.body.title);
    $("#stream-category").html(event.body.game_name);
}

function use_the_3d_talk_engine(event)
{
    var time = event.meta.created_at.slice(11,19);
    var username = username = event.body.event.user_name;
    var row = `<tr class="row-${event.meta.kind}" data-pk="${event.meta.pk}"><td class="event-pk">${event.meta.pk}</td><td class="event-time">${time}</td><td class="event-kind">${event.meta.kind}</td><td class="event-user">${username}</tr>`;
    var row2 = `\n<tr class="row-${event.meta.kind} extra-row"><td colspan='4'>&lt;${username}&gt; ${event.body.event.user_input}</tr>`;
    $("#event-overview").prepend(row + row2);
}

function random_scroll(event)
{
    var time = event.meta.created_at.slice(11,19);
    var username = username = event.body.event.user_name;
    var row = `<tr class="row-${event.meta.kind}" data-pk="${event.meta.pk}"><td class="event-pk">${event.meta.pk}</td><td class="event-time">${time}</td><td class="event-kind">${event.meta.kind}</td><td class="event-user">${username}</tr>`;
    $("#event-overview").prepend(row);
}

function default_log(event)
{
    var row2 = ""
    var username = "";
    var time = event.meta.created_at.slice(11,19);

    if (event.body.event.user_name)
        username = event.body.event.user_name;

    var row = `<tr class="row-${event.meta.kind}" data-pk="${event.meta.pk}"><td class="event-pk">${event.meta.pk}</td><td class="event-time">${time}</td><td class="event-kind">${event.meta.kind}</td><td class="event-user">${username}</tr>`;

    if (event.meta.kind == "channelsubscriptionmessage")
    {
        var row2 = `\n<tr class="row-${event.meta.kind} extra-row"><td colspan='4'>&lt;${username}&gt; ${event.body.event.message.text}</tr>`;
    }
    $("#event-overview").prepend(row + row2);
}
