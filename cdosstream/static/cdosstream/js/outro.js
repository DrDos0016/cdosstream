color_duration = 100;
color_idx = 0;
color_order = ["purple", "red", "cyan", "green", "blue", "white", "yellow"];
color_timer = setInterval(advance_color, color_duration);

pre_name_text = "« Thanks to the Worlds of ZZT patrons! »";
post_name_text = "« See you next stream! »";

name_timer = null;
name_duration = 1200;
name_idx = -2; // Deliberate


marquee_idx = 0;
marquee_str = names.join(" X ").replace(" ", " "); /* Force non-breaking spaces */


$(document).ready(function (){
    name_timer = setInterval(animate_names, name_duration);
    //marquee_timer = setInterval(scroll_names, 200);
});

function scroll_names()
{

    $("#outro-credits").html(marquee_str.slice(marquee_idx, marquee_idx + 42));
    marquee_idx++;
}

function animate_names()
{
    var text = "";
    name_idx++;

    if (name_idx < 0)
        text = pre_name_text;
    else if (name_idx >= names.length)
    {
        text = post_name_text;
        name_idx = names.length;
    }
    else
        text = "░▒▓ " + names[name_idx] + " ▓▒░";

    while (text.length < 42)
    {
        text = "%" + text;
        if (text.length < 42)
            text = text + "%";
    }
    text = text.replace(/%/g, "&nbsp;");

    $("#outro-credits").html(text);
}

function advance_color()
{
    $(".flashing").removeClass("ega-"+color_order[color_idx]);

    color_idx++;
    if (color_idx == color_order.length)
        color_idx = 0;

    $(".flashing").addClass("ega-"+color_order[color_idx]);
}
