export class Stream_Timer
{
    constructor(seconds, func, args)
    {
        this.name = "Automatic Timer";
        this.running = false;
        this.seconds = seconds;
        this.tick_count = 0;
        this.func = func;
        this.args = args;
        this.timeout = null; // js SetInterval
    }

    start_timer()
    {
        this.running = true;
        //setInterval(this.activate, 1000 * this.seconds);
    }

    tick()
    {
        console.log("Count", this.tick_count);
        this.tick_count++;
        if (this.tick_count >= this.seconds)
    }


}
