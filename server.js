var express = require('express.io');
var app = express();
var bodyParser = require('body-parser');
var horizon = require('horizon-youtube-mp3');

app.http().io()
app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());
app.listen('3000');

//ffmpeg -i swansmon.mp3 -af loudnorm=I=-14:TP=-3:LRA=11:print_format=json -f mp3 swansloud.mp3
//ffmpeg -i <input-file> -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 <output-file.mp3>
//ffmpeg -y -i <input-file> -ss 00:00:35(or 35) -to 00:00:41 -c copy <output-file>

app.io.route('loud', function(req){

});

app.io.route('trim', function (req){
    //don't let them trim on the client side unless there are actually segments in peaks.
    var input = req.data;
    var start = input.start;
    var end = input.end;
    var videoID = input.videoID;
    var clipID = videoID+"_"+start+"_"+end;
    trimClip(req,videoID, clipID);
});

function trimClip(req, videoID, clipID){
    const { exec } = require('child_process');
    exec('ffmpeg -y -i '+videoID+'.mp3 -ss '+start+' -to '+end+' -c copy '+clipID+'.mp3', 
        (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                //res.send("error"+err)
                console.log(err);
                return;
            }
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
            req.io.emit("trim_done",{clipID: clipID, loudness: -14});
            //console.log(`stderr: ${stderr}`);
        });
}

app.io.route('download', function (req) {
    //download.download();
    // horizon.getInfo("http://youtube.com/watch?v=NEA0BLnpOtg", function(err, data){
    //     res.send(data);
    // });
    var url = req.data.url;
    var videoID = url.replace(/(.*)(=)(.*)/,"$3");
    horizon.downloadToLocal(
        url,
        './',
        videoID+'.mp3',
        null,//{start:'01:10', end:'01:20'},
        null,
        function (err, result) {
            //the result is the mp3 file. send it to the waveform generator
            //console.log(result);
            //res.send(result);
            if (result === horizon.successType.CONVERSION_FILE_COMPLETE) {
                console.log('emitting finished');
                req.io.emit('download_finished',videoID);
                //console.log(result);
                //res.send(JSON.stringify({videoID: videoID}));
                //res.send('finished');
                //send isn't working, so probs download to local.
            }
        },
        //make a progress bar.
        function onConvertVideoProgress(percent, timemark, targetSize) {
            //res.write(''+percent);
            req.io.emit('download_progress',percent.toFixed(0));
            //console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
            // Will return...
            // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
            // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
            // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
        }
    );
});

console.log('working on 3000');