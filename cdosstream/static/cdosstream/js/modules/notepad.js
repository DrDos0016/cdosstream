export class Notepad
{
    constructor() {
        this.timer = null;
        this.previous_value = "";
        this.foo = "Bar";
    }

    restart_timer(e)
    {
        console.log("Timer restart?", e)
        if (this.identical())
        {
            console.log("RETURNING FALSE");
            return false;
        }

        console.log("Not identical");

        if (this.timer)
        {
            this.stop_timer();
        }

        //this.timer = setTimeout(this.save, 3000)
        this.timer = setTimeout(save_notepad, 3000, this)
        $("#notepad").css("background-color", "#FFEEEE");
    }

    stop_timer() {
        console.log("STOPPING TIMER");
        clearTimeout(this.timer);
        this.timer = null;
    }

    identical() {
        if (this.previous_value == $("#notepad").val())
            return true;
        this.previous_value = $("#notepad").val();
        return false;
    }

    save()
    {
        console.log("SAVING?", this);
        this.stop_timer();
        let to_write = $("#notepad").val();
        $("#notepad").css("background-color", "#FFFFFF");
        $.ajax({
            url:"/notepad/save/",
            method:"POST",
            data:{"contents": to_write}
        }).done(function (response){
            if (! response.success)
                console.log(response);
        });
    }
}

function save_notepad(notepad)
{
    // This seems wild to have to write an external function for. But it works.
    notepad.save()
}
