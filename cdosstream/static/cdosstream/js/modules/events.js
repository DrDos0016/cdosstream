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
            this.fade_out_event_card();
        });
    }
    
    as_scp_log()  // Returns HTML used to log the event in the SCP event log
    {   
        let extra_row = this.get_scp_log_extra_row();
        console.log(this.event_icon);
        let output = `
		<div class="event" data-pk="${this.event.meta.pk}">
			<div class="event-row">
                <div class="event-icon cp437 ${this.event_icon.fg} ${this.event_icon.bg}" title="${this.event.meta.kind}">${this.event_icon.char}</div>
				<div class="event-pk">${this.event.meta.pk}</div>
				<div class="event-time">${this.time}</div>
				<div class="event-user">&lt;${this.username}&gt;</div>
                ${extra_row}
			</div>
		</div>
        `;
        
        return output;
    }
    
    get_scp_log_extra_row() { return ""; }
    
    fade_out_event_card()
    {
        console.log("5. [" + this.event.meta.pk + "] Event complete. Returning to info card");
        $("#event-card").animate({opacity: 0}, speed.event_fade, value => {
            this.conclude_event();
        });
    }
    
    conclude_event()
    {
        $("#event-card").html("");
        $("#event-card").css("opacity", "");
        $("#event-icon-" + this.event.meta.pk).remove();
        $("#event-card").data("finished", true);
        console.log("6. [" + this.event.meta.pk + "] Fade Out Complete.");
    }
}

export class Event_Bip_Bo_Beep extends Redeem_Event_Base // Ref 69
{
    constructor(event)
    {
        super(event);
        this.volume = 0.25;
        this.event_icon = {"fg": "ega-green", "bg": "", "char": "♠"};
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
            this.fade_out_event_card();
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
            this.fade_out_event_card();
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
    
    get_scp_log_extra_row()
    {
        let months = (this.event.body.event.cumulative_months) ? this.event.body.event.cumulative_months : "999";
        let output = `<div class="event-extra">
                <div class="event-months">${months} Months</div>
                <div class="event-message">&ldquo;${this.event.body.event.message.text}&rdquo;</div>
            </div>`;
        return output;
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
            this.fade_out_event_card();
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

export class Event_Random_Scroll extends Redeem_Event_Base // Ref 2511
{
    constructor(event)
    {
        super(event);
        this.volume = 0.80;
        this.delay = 4500;
        this.scroll_delay = 1100;
        this.event_icon = {"fg": "ega-white", "bg": "", "char": "Φ"};
        this.sound_filename = "scroll.mp3";
    }
    
    async play()  // Animate the event
    {
        $(this.event_target).animate({opacity: 1}, speed.event_fade, async value => {
            sound.volume = this.volume;
            let scroll_height = $(".zzt-scroll")[0].scrollHeight;
            let offset = 0;
            await play_sound(this.get_static_path() + "/" + this.sound_filename);
            await delay(this.delay); // Delay before scrolling 
            
            while (offset <= $(".zzt-scroll").scrollTop())
            {
                offset += 37;
                $(".zzt-scroll").scrollTop(offset);
                await delay(this.scroll_delay);
            }        
            
            await delay(2000); // Time spent on bottom
            this.fade_out_event_card();
        });
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

export class Event_Undefined_Event extends Redeem_Event_Base // Ref 3780
{
    constructor(event)
    {
        super(event);
        this.volume = 0;
        this.event_icon = {"fg": "ega-darkgray", "bg": "", "char": "Ü"};
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
            this.fade_out_event_card();
        });
    }
    
    get_scp_log_extra_row()
    {
        let output = `<div class="event-extra">
        <div class="event-message">&ldquo;${this.event.body.event.user_input}&rdquo;</div>
        </div>`;
        return output;
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

export class Event_Set_Timer extends Redeem_Event_Base // Ref? 
{
    constructor(event)
    {
        super(event);
        this.event_icon = {"fg": "ega-cyan", "bg": "", "char": "♂"};
    }
    
    async play()  // This is handled in event-player.js as this event skips the queue
    { return true; }
}
