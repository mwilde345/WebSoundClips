var express = require('express.io');
var app = express();
var bodyParser = require('body-parser');
var horizon = require('horizon-youtube-mp3');
var Busboy = require("busboy");
//const fileUpload = require('express-fileupload');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({
    profile: 'mwildeadmin'
});
AWS.config.credentials = credentials;
AWS.config.region = 'us-east-1';
var S3 = new AWS.S3();
var dynamoDoc = new AWS.DynamoDB.DocumentClient();
var dynamo = new AWS.DynamoDB();

app.http().io()
app.use(bodyParser.json());
app.use(express.static(__dirname + '/'));

//app.use(fileUpload());
app.listen('3001');

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

app.io.route('get_saved_videos', function(req){
    var params = {
        ProjectionExpression: 'movieTitle',
        TableName: 'triviaClips',
    }
    dynamoDoc.scan(params, function(err, data){
        if(err){
            console.log("Error", err);
        }else{
            console.log(data.Items);
            var uniqueVideos = Array.from(new Set(data.Items.map(function(val){return val.movieTitle.toLowerCase()})));
            console.log(uniqueVideos);
            req.io.emit("got_saved_videos",uniqueVideos);
        }
    })
})

app.io.route('post_trivia', function(req){
    var clipData = req.data;
    var params = {
        Item: {
            "clipID":clipData.clipID,
            "s3bucket":clipData.s3bucket,
            "movieTitle":clipData.movieTitle,
            "creator":clipData.creator,
            "tags":clipData.tags,
            "firstFive":clipData.firstFive,
            "hints": clipData.hints,
            "essentialWords": clipData.essentialWords
        },
        TableName: "triviaClips"
    }
    dynamoDoc.put(params, function(err, data){
        if(err){
            console.log(err, err.stack);
        }else{
            console.log(data);
            req.io.emit("posted_trivia", clipData.clipID);
        }
    })
})

app.io.route('post_quote', function(req){
    var clipData = req.data;
    var params = {
        Item: {
            "clipID":clipData.clipID,
            "s3bucket":clipData.s3bucket,
            "firstFive":clipData.firstFive,
            "characterName":clipData.character
        },
        TableName: "quote_list"
    }
    dynamoDoc.put(params, function(err, data){
        if(err){
            console.log(err, err.stack);
        }else{
            console.log(data);
            req.io.emit("posted_quote", clipData.clipID);
        }
    })
})

app.io.route("post_video", function(req){
    var videoID = req.data.videoID;
    console.log(videoID);
    var clips = req.data.clips;
    //console.log(clips);
    var params = {
        Item: {
            "videoID": videoID,
            "clipIDs": clips
        },
        TableName: "videosTable"
    }
    dynamoDoc.put(params, function(err, data) {
        if (err){
            console.log(err.stack);
            //console.log(err, err.stack); // an error occurred
        } 
        else {
            console.log(data);
            req.io.emit("posted_video", data);
        }
    });
})

app.io.route("check_video_id", function(req){
    var videoID = req.data;
    var params = {
        ExpressionAttributeValues:{
            ':v':videoID
        },
        KeyConditionExpression: 'videoID = :v',
        ProjectionExpression: 'videoID, clipIDs',
        TableName: 'videosTable'
    }
    dynamoDoc.query(params, function(err, data){
        if(err){
            console.log("Error", err);
        }else{
            console.log(data.Items);
            req.io.emit("checked_video_id",data.Items);
        }
    })
})

app.io.route('checkFirstFive', function(req){
    var firstFives = req.data.firstFives;
    var skillOption = req.data.skillOption;
    var s3bucket = req.data.s3bucket;
    console.log("going through firstFives: "+firstFives);
    firstFives.forEach(function(item,index){
        var row = item.row;
        var firstFive = item.firstFive.toLowerCase().trim();
        if(skillOption=="trivia"){
            var table = "triviaClips";
        }else var table = "quote_clips";
        var params = {
            TableName: table,
            ProjectionExpression: "clipID",
            FilterExpression: "firstFive = :firstFive and s3bucket = :s3bucket",
            ExpressionAttributeValues: {
                 ":firstFive": firstFive,
                 ":s3bucket": s3bucket
            }
        };
        dynamoDoc.scan(params, onScan);
        var results = [];
        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                // print all the movies
                console.log("Scan succeeded.");
                if(data.Items.length){
                    data.Items.forEach(function(clip) {
                        results.push(clip);
                        console.log(clip);
                    });
                }
                // continue scanning if we have more movies, because
                // scan can retrieve a maximum of 1MB of data
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    dynamoDoc.scan(params, onScan);
                }else{
                    console.log("emitting for row: "+row);
                    req.io.emit("checked_first_five",{results: results, row: row});  
                }
            }
        }
        //req.io.emit("checked_first_five",{results: results, row: row});
    });

    
    //dynamo_call(firstFives);
/*
return:
    [
        {row: 0, valid: False, relatedClip: clipID, relatedUrl: s3link},
    ]
*/
})

app.get('/download_times/:videoID', function(req,res){
    var videoID = req.params.videoID;
    console.log(req.params);
    res.download('timesDownload/'+videoID+'.txt');
});
app.get('/download_segments/:videoID', function(req,res){
    var videoID = req.params.videoID;
    console.log(req.params);
    res.download('segmentsDownload/'+videoID+'-segments.txt');
});

app.post('/save_segments', function(req, res){
    //console.log(req);
    var times = req.body.times;
    if(!times){
        res.send("No data to download");
        return;
    }
    var output = JSON.stringify(times);
    var fs = require('fs');
    var filename = "segmentsDownload/"+req.body.videoID+"-segments.txt";
    fs.writeFile(filename, output, function(err) {
        if(err) {
            return console.log(err);
        }
        res.send(filename);
        //res.send("times downloaded");
        //res.send("times have been downloaded");
        console.log("The file was saved!");
    });
    //res.download(filename);   
});

app.post('/save_times', function(req, res){
    //console.log(req);
    var times = req.body.times;
    if(!times){
        res.send("No data to download");
        return;
    }
    var output = "";
    console.log('download times');
    times.startTimes.forEach(function(item,index){
        var endItem = times.stopTimes[index] ? times.stopTimes[index] : "";
        output+= ''+item.length? item + " " + endItem+"\n" : '';
    });
    var fs = require('fs');
    var filename = "timesDownload/"+req.body.videoID+".txt";
    fs.writeFile(filename, output, function(err) {
        if(err) {
            return console.log(err);
        }
        res.send(filename);
        //res.send("times downloaded");
        //res.send("times have been downloaded");
        console.log("The file was saved!");
    });
    //res.download(filename);   
});

app.post('/upload', function (req, res) {
    //console.log(req.files.textFile);
    console.log(req.headers);
    var loadFile = "";
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            fileSize: 3 * 1024 * 1024
        }
    });
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join('uploads', filename);
        loadFile = filename;
        console.log('Uploading: ' + saveTo);
        file.on('limit', function () {
            console.log('file size limit reached');
            res.send('File size cannot exceed 3MB')
        })
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('finish', function () {
        console.log('Upload complete');
        console.log(loadFile);
        var startTimes = [];
        var endTimes = [];
        readFile(loadFile, function (data) {
            var lines = data.split(/\r?\n/);
            console.log(lines);
            lines.forEach(function(item, index){
                console.log(item);
                var lineData = item.split(/ |,|\t/);
                console.log(lineData);
                startTimes.push(lineData[0]);
                if(lineData.length>1&&lineData[1].length){
                    endTimes.push(lineData[1]);
                }
            });
            res.send(JSON.stringify({start: startTimes, end: endTimes}));
        })

    });
    req.pipe(busboy);
});

app.post('/upload_segments', function (req, res) {
    //console.log(req.files.textFile);
    //console.log(req.headers);
    var loadFile = "";
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            fileSize: 3 * 1024 * 1024
        }
    });
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join('uploads', filename);
        loadFile = filename;
        console.log('Uploading: ' + saveTo);
        file.on('limit', function () {
            console.log('file size limit reached');
            res.send('File size cannot exceed 3MB')
        })
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('finish', function () {
        console.log('Upload complete');
        console.log(loadFile);
        var startTimes = [];
        var endTimes = [];
        readFile(loadFile, function (data) {
            res.send(JSON.stringify(data));
        })

    });
    req.pipe(busboy);
});

function readFile(filename, callback) {
    var fs = require('fs');
    //TODO won't work with a file with (1) or spaces i think
    fs.readFile("uploads/"+filename, 'utf8', function (err, data) {
        if (err) throw err;
        console.log('OK: ' + filename);
        callback(data);
    });
}



app.io.route('trim', function (req) {
    var input = req.data;
    var start = input.start;
    var end = input.end;
    var videoID = input.videoID;
    var clipID = videoID + "_" + start + "_" + end;
    var data = {
        start: start,
        end: end,
        videoID: videoID,
        clipID: clipID
    };
    trimClip(data, function () {
        //default clip to -13 loudness
        setLoudness(clipID, -13, function () {
            req.io.emit("trim_done", {
                clipID: clipID,
                loudness: -13
            });
        });

    });
});

function setLoudness(clipID, loudness, callback) {
    console.log(clipID);
    var command = 'ffmpeg -y -i ./trimClips/' + clipID + '.mp3 -af loudnorm=I=' + loudness +
    ':TP=-3:LRA=11:print_format=json -f null -'
    console.log("running: "+command);
    var child = cp.exec(command);

    var output, I, TP, LRA, thresh, offset;
    child.stdout.on('data', function (data) {
        output += data;
    });
    child.stderr.on('data', function (data) {
        output += data;
    });
    child.on('exit', function (code) {
        console.log(output);
        //TODO: what if the command fails
        var json = JSON.parse(output.match(/{(.|\n)*}/)[0]);
        I = json.input_i;
        TP = json.input_tp;
        LRA = json.input_lra;
        thresh = json.input_thresh;
        offset = json.target_offset;
        var cmdString = 'ffmpeg -y -i trimClips/' + clipID + '.mp3 -af ' +
            'loudnorm=I=' + loudness + ':TP=-3:LRA=11:measured_I=' + I + ':measured_TP=' + TP + ':' +
            'measured_LRA=' + LRA + ':measured_thresh=' + thresh + ':offset=' + offset + ':print_format=summary:' +
            'linear=true loudClips/' + clipID + loudness + '.mp3';
        console.log(cmdString);
        var child2 = cp.spawn(cmdString, {
            shell: true
        });
        child2.on('exit', function (code) {

            callback();
        });
    });
}

app.io.route('loudness', function (req) {
    console.log(req.data);
    var clipID = req.data.clipID;
    var loudness = req.data.loudness;
    var tableRow = req.data.tableRow;
    if (loudness < -70) {
        loudness = -70;
    }
    if (loudness > -5) {
        loudness = -5;
    }
    setLoudness(clipID, loudness, function () {
        req.io.emit("loudness_done", {
            clipID: clipID,
            loudness: loudness,
            tableRow: tableRow
        });
    });
});

app.io.route('compress', function (req) {
    var clipID = req.data.clipID;
    cp.exec('ffmpeg -y -i ./loudClips/' + clipID + '.mp3' +
        ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ./compressedClips/' + clipID + '.mp3',
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                return;
            }
            req.io.emit('compress_done', clipID);
        });
});

app.io.route('s3_upload', function (req) {
    var clipID = req.data.clipID;
    var s3bucket = req.data.s3bucket;
    var fileBuffer = fs.readFileSync('compressedCLips/' + clipID + ".mp3");
    S3.putObject({
            ACL: 'public-read',
            Bucket: s3bucket,
            Key: clipID + '.mp3',
            Body: fileBuffer,
            ContentType: 'audio/mpeg'
        },
        function (error, response) {
            if (error) {
                console.log("failed uploading " + clipID + " with error: " + error);
                return;
            } else {
                req.io.emit("s3_upload_done", clipID);
            }
        }
    );

});

app.io.route('dump_clips', function (req) {
    dumpClips(function (number) {
        console.log("dumped "+number+" clips");
        req.io.emit("dumped_clips",number);
    });
});

function dumpClips(callback) {
    var dirs = ['videoSound', 'videoDat', 'trimClips', 'loudClips', 'compressedClips'];
    var number = 0;
    console.log("dumping clips");
    var remainingDirs = 5;
    dirs.forEach(function (dir, index) {
        fs.readdir(dir, function (err, files) {
            if (err) throw err;
            for (const file of files) {
                console.log(file);
                //this keeps getting run before the previous one is finished. so it's overwritten.
                //never gets to 0;
                var remainingFiles = files.length;
                console.log(remainingFiles);
                fs.unlink(path.join(dir, file), (err) => {
                    if (err){
                        throw err;
                    }else{
                        console.log("removed file");
                        number+=1;
                        remainingFiles-=1;
                        if(remainingFiles==0){
                            remainingDirs-=1;
                            if(remainingDirs==0){
                                callback(number);
                            }
                        }
                    }
                })
            }
        });
        
    });
  
}

function trimClip(data, callback) {
    cp.exec('ffmpeg -y -i ./videoSound/' + data.videoID + '.mp3 -ss ' + data.start + ' -to ' + data.end + ' -c copy ./trimClips/' +
        data.clipID + '.mp3',
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
    var videoID = url.replace(/(.*)(=)(.*)/, "$3");
    console.log('downloading');
    horizon.downloadToLocal(
        url,
        './videoSound/',
        videoID + '.mp3',
        null, //{start:'01:10', end:'01:20'},
        null,
        function (err, result) {
            //the result is the mp3 file. send it to the waveform generator
            //console.log(result);
            //res.send(result);
            if (result === horizon.successType.CONVERSION_FILE_COMPLETE) {
                generateWaveform(req, videoID, function () {
                    req.io.emit('download_finished', videoID);
                });

                //console.log(result);
                //res.send(JSON.stringify({videoID: videoID}));
                //res.send('finished');
                //send isn't working, so probs download to local.
            }
            if(err){
                console.log(err);
                req.io.emit("download_error");
            }
        },
        //make a progress bar.
        function onConvertVideoProgress(percent, timemark, targetSize) {
            //res.write(''+percent);
            console.log('downloading progress ' + percent);
            req.io.emit('download_progress', percent.toFixed(0));
            //console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
            // Will return...
            // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
            // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
            // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
        }
    );
});

function generateWaveform(req, videoID, callback) {
    cp.exec('audiowaveform -i ./videoSound/' + videoID + '.mp3 -o ./videoDat/' + videoID + '.dat -b 8',
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

console.log('working on 3001');