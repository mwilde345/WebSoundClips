var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var horizon = require('horizon-youtube-mp3');

app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());
app.listen('3000');

//ffmpeg -i swansmon.mp3 -af loudnorm=I=-14:TP=-3:LRA=11:print_format=json -f mp3 swansloud.mp3
//ffmpeg -i <input-file> -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 <output-file.mp3>
//ffmpeg -y -i <input-file> -ss 00:00:35(or 35) -to 00:00:41 -c copy <output-file>

app.post('/trim', function (req, res){
    var start = req.body.start;
    var end = req.body.end;
    var videoID = req.body.videoID;
    var clipID = videoID+"_"+start+"_"+end;
    var filename = clipID+".mp3";
    const { exec } = require('child_process');
    exec('ffmpeg -y -i '+videoID+'.mp3 -ss '+start+' -to '+end+' -c copy '+filename, 
        (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                res.send("error"+err)
                return;
            }
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
            res.send("Completed: "+clipID);
            //console.log(`stderr: ${stderr}`);
        });
});

app.post('/test', function (req, res) {
    //download.download();
    // horizon.getInfo("http://youtube.com/watch?v=NEA0BLnpOtg", function(err, data){
    //     res.send(data);
    // });
    console.log(JSON.stringify(req.body));
    var url = req.body.url;
    var videoID = url.replace(/(.*)(=)(.*)/,"$3");
    horizon.downloadToLocal(
        url,
        './',
        videoID+'.mp3',
        null,//{start:'02:15', end:'02:20'},
        null,
        function (err, result) {
            //the result is the mp3 file. send it to the waveform generator
            //console.log(result);
            //res.send(result);
            if (result === horizon.successType.CONVERSION_FILE_COMPLETE) {
                console.log(result);
                res.send(JSON.stringify({videoID: videoID}));
                //res.send('finished');
                //send isn't working, so probs download to local.
            }
        },
        //make a progress bar.
        function onConvertVideoProgress(percent, timemark, targetSize) {
            //res.write(''+percent);
            console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
            // Will return...
            // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
            // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
            // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
        }
    );
});

console.log('working on 3000');