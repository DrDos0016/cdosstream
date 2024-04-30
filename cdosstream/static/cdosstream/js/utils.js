const sound = new Audio();

function log(...args)
{
    // HAVE YET TO SEE THIS USED
    var ts = new Date();
    $("#debug").val($("#debug").val() + "\n[" + ts.toISOString() + "] " + args);
    console.log("LOG:", args.join());
}


function random_int(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function delay(ms) {
    return new Promise(res => {
        setTimeout(() => { res('') }, ms);
    });
}

function play_sound(filename)
{
    return new Promise(res=>{
        sound.src = filename;
        sound.onended = res;
    })
}
