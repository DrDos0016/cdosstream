var speed = {"event_fade": 250};
var scroll_elapsed_ticks = 0;

// Audio volume should be between -10 and -15db w/ 100% slider volume in OBS

export class Redeem_Event_Base {
    constructor(event) {
        this.class_based_event = true; // Stopgap while classes and functions for events both exist
        this.event = event;
        this.event_key = event.meta.kind.replaceAll("-", "_").toLowerCase();
        this.event_icon = {"fg": "ega-white", "bg": "", "char": "?"};
        this.event_target = "#live-event";
        this.volume = 0.30;
        this.sound_filename = "";
        this.delay = 1000;
        this.created_at = event.meta.created_at;
        this.time = this.created_at.slice(14,19);
        this.username = (event.body.event.user_name) ? event.body.event.user_name : "NOUSER";
        this.pk = event.meta.pk;
        this.sound_filename = "";
    }
    
    get_static_path()
    {
        return `/static/cdosstream/event/${this.event_key.replaceAll('_', '-')}`;
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            if (this.sound_filename)
                await play_sound(`${this.get_static_path()}/${this.sound_filename}`);
            await delay(this.delay);
            fade_out_event_card(this.event);
        });
    }
    
    as_scp_log()  // Returns HTML used to log the event in the SCP event log
    {        
        let extra_row = "";
        let output = `
		<div class="event" data-pk="${this.event.meta.pk}">
			<div class="event-row">
				<div class="event-pk">${this.event.meta.pk}</div>
				<div class="event-time">${this.time}</div>
				<div class="event-kind">${this.event_icon.char} ${this.event.meta.kind}</div>
				<div class="event-user">${this.username}</div>
			</div>
			${extra_row}
		</div>
        `;
        
        return output;
    }
}

export class Event_Bip_Bo_Beep extends Redeem_Event_Base // Ref 69
{
    constructor(event)
    {
        super(event);
        this.volume = 0.25;
        this.event_icon = {"fg": "ega-green", "bg": "", "char": "Z"};
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            for (var idx = 1; idx < 9; idx++)
            {
                await play_sound(this.get_static_path() + "/f-" + (idx % 8 + 1)  + ".mp3");
                await delay(random_int(1,8) * 50);
            }
            fade_out_event_card(this.event);
        });
    }
}

export class Event_Beautiful_Music extends Redeem_Event_Base // Ref 5992
{
    constructor(event)
    {
        super(event);
        this.delay = 4500;
        this.event_icon = {"fg": "ega-darkred", "bg": "", "char": "☻"};
    }
}

export class Event_Channelcheer extends Redeem_Event_Base  // Ref 260
{
    constructor(event)
    {
        super(event);
        this.event_icon = {"fg": "ega-green", "bg": "", "char": "♦"};
        this.sound_filename = "bits-gem.wav";
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await delay(2000);
            fade_out_event_card(this.event);
        });
    }
}

export class Event_Channelfollow extends Redeem_Event_Base // Ref 249
{
    constructor(event)
    {
        super(event);
        this.delay = 3000;
        this.event_icon = {"fg": "ega-white", "bg": "ega-darkblue-bg", "char": "☻"};
        this.sound_filename = "follow-transporter.wav";
    }
}

export class Event_Channelraid extends Redeem_Event_Base // Ref 1035
{
    constructor(event)
    {
        super(event);
        this.delay = 3000;
        this.event_icon = {"fg": "ega-white", "bg": "ega-darkyellow-bg", "char": "≡"};
        this.sound_filename = "raid-passage.wav";
    }
}

export class Event_Channelsubscribe extends Redeem_Event_Base // Ref 243 (basic) / 1557 (gifted)
{
    constructor(event)
    {
        super(event);
        this.delay = 2000;
        this.event_icon = {"fg": "ega-purple", "bg": "", "char": "♀"};
        this.sound_filename = "sub-key.wav";
    }
}

export class Event_Channelsubscriptionmessage extends Redeem_Event_Base // Ref 1550
{
    constructor(event)
    {
        super(event);
        this.delay = 2000;
        this.event_icon = {"fg": "ega-purple", "bg": "", "char": "♀"};
        this.sound_filename = "sub-key.wav";
    }
}

export class Event_Channelsubscriptiongift extends Redeem_Event_Base // Ref 1565 (one gift) / 1556 (two gifts)
{
    constructor(event)
    {
        super(event);
        this.delay = 2000;
        this.event_icon = {"fg": "ega-purple", "bg": "", "char": "♀"};
        this.sound_filename = "sub-key.wav";
    }
}

export class Event_Guide_The_Raid extends Redeem_Event_Base // Ref 5598
{
    constructor(event)
    {
        super(event);
        this.delay = 1600;
        this.event_icon = {"fg": "ega-green", "bg": "", "char": "►"};
        this.sound_filename = "raid-passage.wav";
    }
}

export class Event_Hahaha extends Redeem_Event_Base // Ref 5877
{
    constructor(event)
    {
        super(event);
        this.delay = 1000;
        this.event_icon = {"fg": "ega-darkgray", "bg": "", "char": "\""};
        this.sound_filename = "hahaha.wav";
    }
}

export class Event_Happy_Zzt_Day extends Redeem_Event_Base // Ref 5996
{
    constructor(event)
    {
        super(event);
        this.event_icon = {"fg": "ega-white", "bg": "ega-darkblue", "char": "X"};
        this.sound_filename = "foo.wav";
    }
}

export class Event_Hydrate extends Redeem_Event_Base // Ref 991
{
    constructor(event)
    {
        super(event);
        this.delay = 1000;
        this.event_icon = {"fg": "ega-white", "bg": "ega-darkblue-bg", "char": "░"};
        this.sound_filename = "hydrate-water.wav";
    }
}

export class Event_Its_Bird_Oclock_Somewhere extends Redeem_Event_Base // Ref 268
{
    constructor(event)
    {
        super(event);
        this.volume = 0.90;
        this.event_icon = {"fg": "ega-white", "bg": "", "char": "v"};
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            let hour = $("#live-event").data("hour");
            await play_sound(this.get_static_path() + "/bc-" + hour + ".mp3");
            fade_out_event_card(this.event);
        });
    }
}

export class Event_Posture_Check extends Redeem_Event_Base // Ref 991
{
    constructor(event)
    {
        super(event);
        this.delay = 2000;
        this.event_icon = {"fg": "ega-yellow", "bg": "ega-darkcyan-bg", "char": "☻"};
        this.sound_filename = "pushing.wav";
    }
}

export class Event_Streeeeeeeeeetch extends Redeem_Event_Base // Ref 159
{
    constructor(event)
    {
        super(event);
        this.delay = 2000;
        this.event_icon = {"fg": "ega-yellow", "bg": "ega-blue-bg", "char": "☺"};
        this.sound_filename = "pushing.wav";
    }
}

export class Event_Sub_Goal extends Redeem_Event_Base // Ref 3780
{
    constructor(event)
    {
        super(event);
        this.volume = 0.5;
        this.delay = 0;
        this.event_icon = {"fg": "ega-red", "bg": "", "char": "♥"};
        this.sound_filename = "newthingget-normalized.mp3";
    }
}

export class Event_Use_The_3d_Talk_Engine extends Redeem_Event_Base // Ref 1033
{
    constructor(event)
    {
        super(event);
        this.event_icon = {"fg": "ega-yellow", "bg": "ega-darkred-bg", "char": "☺"};
        this.sound_filename = "3d-talk.wav";
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            let hour = $("#live-event").data("hour");
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await delay(800);
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await delay(1200);
            fade_out_event_card(this.event);
        });
    }
}

export class Event_Yeaaaaahh extends Redeem_Event_Base // Ref 1046
{
    constructor(event)
    {
        super(event);
        this.volume = 0.5;
        this.delay = 200;
        this.event_icon = {"fg": "ega-yellow", "bg": "ega-darkgreen-bg", "char": "☻"};
        this.sound_filename = "yeah.wav";
    }
}

export class Event_Zzt_Toilet_Flush extends Redeem_Event_Base // Ref 973
{
    constructor(event)
    {
        super(event);
        this.volume = 0.4;
        this.delay = 1000;
        this.event_icon = {"fg": "ega-white", "bg": "", "char": "∩"};
        this.sound_filename = "flush.mp3";
    }
}

/* Old Style functions below */
export async function random_scroll(event)  /* Ref: #2511 */
{
    $("#live-event").animate({opacity: 1}, speed.event_fade, async function (){
		let scroll_height = $(".zzt-scroll")[0].scrollHeight;
		let offset = 0;
        sound.volume = 0.80;
        await play_sound("/static/cdosstream/event/random-scroll/scroll.mp3");
        //console.log("Scroll is this tall:", scroll_height);
        await delay(4500); // Delay before scrolling
        
        while (offset <= $(".zzt-scroll").scrollTop())
        {
			offset += 37;
			$(".zzt-scroll").scrollTop(offset);
			await delay(1100)
			//console.log("OFFSET", offset, "SCROLL_HEIGHT", scroll_height, "SCROLLTOP", $(".zzt-scroll").scrollTop());
		}

        await delay(2000); // Time spent on bottom
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
