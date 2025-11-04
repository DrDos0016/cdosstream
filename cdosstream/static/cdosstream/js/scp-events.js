function stream_info(event)
{
    $("#stream-viewers").html(event.body.viewer_count);
    $("#stream-title").html(event.body.title);
    $("#stream-category").html(event.body.game_name);
}
