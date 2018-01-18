var express = require('express.io');
var app = express();
var bodyParser = require('body-parser');
var horizon = require('horizon-youtube-mp3');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
app.http().io()
app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());
app.listen('3000');

//ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-30:TP=-3:LRA=11:print_format=summary loudClips/V_laNt7Sh6g_12.5_22.0.mp3
//ffmpeg -i <input-file> -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 <output-file.mp3>
//ffmpeg -y -i <input-file> -ss 00:00:35(or 35) -to 00:00:41 -c copy <output-file>
//ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-25:TP=-3:LRA=11:measured_I=-16.8:measured_TP=-2.0:measured_LRA=2.6:measured_thresh=-28.4:offset=-2.65:linear=true:print_format=summary loudClips/V_laNt7Sh6g_12.5_22.0_test.mp3
//ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-40:TP=-3:LRA=11:offset=-20.65:linear=true:print_format=summary loudClips/V_laNt7Sh6g_12.5_22.0_test.mp3
//ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-30:TP=-3:LRA=11:measured_I=-16.8:measured_TP=-2.0:measured_LRA=2.6:measured_thresh=-28.4:offset=-20.65:print_format=summary:linear=true loudClips/V_laNt7Sh6g_12.5_22.0_2.mp3
//https://superuser.com/questions/1281327/ffmpeg-loudnorm-filter-does-not-make-audio-louder

//first pass: ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-10:TP=-3:LRA=11:print_format=json -f null -
/*output:
{
	"input_i" : "-16.81",
	"input_tp" : "-1.97",
	"input_lra" : "2.60",
	"input_thresh" : "-28.40",
	"output_i" : "-14.38",
	"output_tp" : "-3.00",
	"output_lra" : "3.00",
	"output_thresh" : "-24.87",
	"normalization_type" : "dynamic",
	"target_offset" : "4.38"
}
*/
//second pass: ffmpeg -y -i trimClips/V_laNt7Sh6g_12.5_22.0.mp3 -af loudnorm=I=-10:TP=-3:LRA=11:measured_I=-16.8:measured_TP=-2.0:measured_LRA=2.6:measured_thresh=-28.4:offset=4.38:print_format=summary:linear=true loudClips/V_laNt7Sh6g_12.5_22.0_2.mp3

app.io.route('trim', function (req){
    //don't let them trim on the client side unless there are actually segments in peaks.
    var input = req.data;
    var start = input.start;
    var end = input.end;
    var videoID = input.videoID;
    var clipID = videoID+"_"+start+"_"+end;
    var data = {start: start, end: end, videoID: videoID, clipID: clipID};
    trimClip(data, function(){
        //default clip to -14 loudness
        setLoudness(clipID, -14, function(){
            req.io.emit("trim_done",{clipID: clipID, loudness: -14});
        });
        
    });
});

function setLoudness(clipID, loudness, callback){
    console.log(clipID);
    var child = cp.exec('ffmpeg -y -i ./trimClips/'+clipID+'.mp3 -af loudnorm=I='+loudness+
        ':TP=-3:LRA=11:print_format=json -f null -');
    
    var output, I, TP, LRA, thresh, offset;
    child.stdout.on('data',function(data){
        output+=data;
    });
    child.stderr.on('data', function(data) {
        output+=data;
    });
    child.on('exit', function(code) {
        var json = JSON.parse(output.match(/{(.|\n)*}/)[0]);
        I = json.input_i;
        TP = json.input_tp;
        LRA = json.input_lra;
        thresh = json.input_thresh;
        offset = json.target_offset;
        var cmdString = 'ffmpeg -y -i trimClips/'+clipID+'.mp3 -af '+
        'loudnorm=I='+loudness+':TP=-3:LRA=11:measured_I='+I+':measured_TP='+TP+':'+
        'measured_LRA='+LRA+':measured_thresh='+thresh+':offset='+offset+':print_format=summary:'+
        'linear=true loudClips/'+clipID+loudness+'.mp3';
        console.log(cmdString);
        var child2 = cp.spawn(cmdString,{shell:true});
        child2.on('exit', function(code){

            callback();
        });
    });
}

app.io.route('loudness', function(req){
    console.log(req.data);
    var clipID = req.data.clipID;
    var loudness = req.data.loudness;
    var tableRow = req.data.tableRow;
    if(loudness< -70){
        loudness=-70;
    }
    if(loudness> -5){
        loudness= -5;
    }
    setLoudness(clipID, loudness, function(){
        req.io.emit("loudness_done",{clipID: clipID, loudness: loudness, tableRow: tableRow});
    });
});

app.io.route('compress', function(req){
    var clipID = req.data.clipID;
    cp.exec('ffmpeg -y -i ./loudClips/'+clipID+'.mp3'+
        ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ./compressedClips/'+clipID+'.mp3',
        (err, stdout, stderr) => {
            if(err){
                console.log(err);
                return;
            }
            req.io.emit('compress_done',clipID);
        });
});

app.io.route('s3_upload', function(req){
    var videoID = req.data.videoID;
    //upload to s3
   dumpClips(videoID, function(){

   }); 
});

function dumpClips(videoID, callback){
    var dirs = ['videoSound','videoDat','trimClips','loudClips','compressedClips'];
    dirs.forEach(function(dir, index){
        fs.readdir(dir, function(err, files){
            if(err) throw err;
            for(const file of files){
                fs.unlink(path.join(dir, file), err=>{
                    if(err) throw err;
                })
            }
        });
    });
    callback();
}

function trimClip(data, callback){
    cp.exec('ffmpeg -y -i ./videoSound/'+data.videoID+'.mp3 -ss '+data.start+' -to '+data.end+' -c copy ./trimClips/'
        +data.clipID+'.mp3', 
        (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                //res.send("error"+err)
                console.log(err);
                return;
            }
            callback();
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
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
        './videoSound/',
        videoID+'.mp3',
        null,//{start:'01:10', end:'01:20'},
        null,
        function (err, result) {
            //the result is the mp3 file. send it to the waveform generator
            //console.log(result);
            //res.send(result);
            if (result === horizon.successType.CONVERSION_FILE_COMPLETE) {
                generateWaveform(req,videoID, function(){
                    req.io.emit('download_finished',videoID);
                });
                
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

function generateWaveform(req, videoID, callback){
    cp.exec('audiowaveform -i ./videoSound/'+videoID+'.mp3 -o ./videoDat/'+videoID+'.dat -b 8', 
        (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                //res.send("error"+err)
                console.log(err);
                return;
            }
            callback();
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
            //req.io.emit("trim_done",{clipID: clipID, loudness: -14});
            //console.log(`stderr: ${stderr}`);
        });
}

console.log('working on 3000');