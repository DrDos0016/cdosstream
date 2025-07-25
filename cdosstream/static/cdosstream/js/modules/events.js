var speed = {"event_fade": 250};

// Audio volume should be between -10 and -15db w/ 100% slider volume in OBS

export async function beautiful_music(event)  /* Ref: #TBD */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        await delay(5000);
        fade_out_event_card(event);
    });
}

export async function bip_bo_beep(event)  /* Ref: #69 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.25;
        for (var idx = 1; idx < 9; idx++)
        {
            await play_sound("/static/cdosstream/event/bip-bo-beep/f-" + (idx % 8 + 1)  + ".mp3");
            await delay(random_int(1,8) * 50);
        }
        fade_out_event_card(event);
    });
}

export async function channelcheer(event)  /* Ref: #260 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelcheer/bits-gem.wav");
        await play_sound("/static/cdosstream/event/channelcheer/bits-gem.wav");
        await play_sound("/static/cdosstream/event/channelcheer/bits-gem.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}


export async function channelfollow(event)  /* Ref: #249 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelfollow/follow-transporter.wav");
        await delay(3000);
        fade_out_event_card(event);
    });
}


export async function channelraid(event)  /* Ref: #1035 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelraid/raid-passage.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}


export async function channelsubscribe(event)  /* Ref: #243 for basic sub, #1557 for receiving a gift sub */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        //update_sub_info();
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelsubscribe/sub-key.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}

export async function channelsubscriptionmessage(event)  /* Ref: #1550 Resub */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        //update_sub_info();
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelsubscriptionmessage/sub-key.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}


export async function channelsubscriptiongift(event)  /* Ref: 1565 / 1556 Gift Sub Sent */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        //update_sub_info();
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelsubscriptiongift/sub-key.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}

export async function guide_the_raid(event)  /* Ref: #5598 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
		sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/channelraid/raid-passage.wav");
        await delay(1600);
        fade_out_event_card(event);
    });
}


export async function hahaha(event)  /* Ref: #TBD */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/hahaha/hahaha.wav");
        await delay(1000);
        fade_out_event_card(event);
    });
}


export async function hydrate(event)  /* Ref: #991 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/hydrate/hydrate-water.wav");
        await delay(1000);
        fade_out_event_card(event);
    });
}


export async function its_bird_oclock_somewhere(event)  /* Ref: #268 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        let hour = $("#live-event").data("hour");
        sound.volume = 0.90;
        await play_sound("/static/cdosstream/event/its-bird-oclock-somewhere/bc-" + hour + ".mp3");
        fade_out_event_card(event);
    });
    log("Exiting Birdclock");
}


export async function posture_check(event)  /* Ref: #252 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/posture-check/pushing.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}

export async function streeeeeeeeeetch(event)  /* Ref: #159 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/streeeeeeeeeetch/pushing.wav");
        await delay(2000);
        fade_out_event_card(event);
    });
}

export async function sub_goal(event)  /* Ref: #3780 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.5;
        await play_sound("/static/cdosstream/event/sub-goal/newthingget-normalized.mp3");
        fade_out_event_card(event);
    });
}

export async function use_the_3d_talk_engine(event)  /* Ref: #1033 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.30;
        await play_sound("/static/cdosstream/event/use-the-3d-talk-engine/3d-talk.wav");
        await delay(800);
        await play_sound("/static/cdosstream/event/use-the-3d-talk-engine/3d-talk.wav");
        await delay(1200);
        fade_out_event_card(event);
    });
}

export async function yeaaaaahh(event)  /* Ref: #1046 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.50;
        await play_sound("/static/cdosstream/event/yeaaaaahh/yeah.wav");
        await delay(1600);
        fade_out_event_card(event);
    });
}

export async function zzt_toilet_flush(event)  /* Ref: #973 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.40;
        await play_sound("/static/cdosstream/event/zzt-toilet-flush/flush.mp3");
        await delay(2000);
        fade_out_event_card(event);
    });
}

export async function random_scroll(event)  /* Ref: #2511 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        sound.volume = 0.80;
        await play_sound("/static/cdosstream/event/random-scroll/scroll.mp3");
        await delay(12000);
        fade_out_event_card(event);
    });
}

export async function timer_start(event) /* Ref: ?? */
{
    if ($("#stream-timer").attr("data-timer-id"))
        clearInterval($("#stream-timer").attr("data-timer-id"));
    $("#stream-timer").remove();

    let [hours, minutes, seconds] = event.body.event.start_value.split(":");
    let raw_seconds = parseInt(hours * 60 * 60) + parseInt(minutes * 60) + parseInt(seconds);

    $("body").append(`<div id="stream-timer" data-value="${raw_seconds}" data-mode="${event.body.event.mode}" data-timer-id=""><span class="timer-hours">00</span>:<span class="timer-minutes">00</span>:<span class="timer-seconds">00</span>`);
    let timer_id = setInterval(tick_timer, 1000);
    $("#stream-timer").attr("data-timer-id", timer_id);
    conclude_event(event);
}

export async function undefined_event(event)  /* Ref: #1009 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
        fade_out_event_card(event);
    });
}

export function fade_out_event_card(event)
{
    console.log("5. [" + event.meta.pk + "] Event complete. Returning to info card");
    $("#event-card").animate({opacity: 0}, speed.event_fade, function (){
        conclude_event(event)
    });
}


export function remove_event_icon(pk)
{
    $("#event-icon-" + pk).remove();
}

export function conclude_event(event)
{
    $("#event-card").html("");
    $("#event-card").css("opacity", "");
    remove_event_icon(event.meta.pk);
    $("#event-card").data("finished", true);
    console.log("6. [" + event.meta.pk + "] Fade Out Complete.");
}


function tick_timer()
{
    let current = $("#stream-timer").attr("data-value");
    let mode = $("#stream-timer").data("mode");
    current -= 1;
    $("#stream-timer").attr("data-value", current);
    let temp = current;
    let hours = parseInt(temp / 60 / 60);
    temp -= (hours * 60 * 60);
    let minutes = parseInt(temp / 60);
    temp -= (minutes * 60);
    let seconds = temp;

    $(".timer-hours").html(("" + hours).padStart(2, "0"));
    $(".timer-minutes").html(("" + minutes).padStart(2, "0"));
    $(".timer-seconds").html(("" + seconds).padStart(2, "0"));
}
