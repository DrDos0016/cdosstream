function stream_info(event)
{
    $("#stream-viewers").html(event.body.viewer_count);
    $("#stream-title").html(event.body.title);
    $("#stream-category").html(event.body.game_name);
}

function use_the_3d_talk_engine(event)
{
    var time = event.meta.created_at.slice(14,19);
    var username = username = event.body.event.user_name;
    
    let output = `
		<div class="event" data-pk="${event.meta.pk}">
			<div class="event-row">
				<div class="event-pk">${event.meta.pk}</div>
				<div class="event-time">${time}</div>
				<div class="event-kind">${event.meta.kind}</div>
				<div class="event-user">${username}</div>
			</div>
			<div class="event-row">
				<div class="event-message">&lt;${username}&gt; ${event.body.event.user_input}</div>
			</div>
		</div>
    `;
    
    $("#event-overview").prepend(output);
}

function random_scroll(event)
{
    var time = event.meta.created_at.slice(14,19);
    var username = event.body.event.user_name;
    
    let output = `
		<div class="event" data-pk="${event.meta.pk}">
			<div class="event-row">
				<div class="event-pk">${event.meta.pk}</div>
				<div class="event-time">${time}</div>
				<div class="event-kind">${event.meta.kind}</div>
				<div class="event-user">${username}</div>
			</div>
		</div>
    `;
    
    
    $("#event-overview").prepend(output);
}

function default_log(event)
{
    var row2 = ""
    var username = "";
    var time = event.meta.created_at.slice(14,19);
    let extra_row = "";

    if (event.body.event.user_name)
        username = event.body.event.user_name;	

    if (event.meta.kind == "channelsubscriptionmessage")
    {
         extra_row = `<div class="event-row highlight">
			<div class="event-message">&lt;${username}&gt; ${event.body.event.message.text}</div>
         </div>`;
    }
    
    let output = `
		<div class="event" data-pk="${event.meta.pk}">
			<div class="event-row">
				<div class="event-pk">${event.meta.pk}</div>
				<div class="event-time">${time}</div>
				<div class="event-kind">${event.meta.kind}</div>
				<div class="event-user">${username}</div>
			</div>
			${extra_row}
		</div>
    `;
    
    $("#event-overview").prepend(output);
}
