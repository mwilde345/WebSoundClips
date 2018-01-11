var express = require('express');
var app = express();
var horizon = require('horizon-youtube-mp3');
var download = require('./test.js');

app.use(express.static(__dirname + '/'));

app.listen('3000');

app.post('/test', function(req, res){
    //download.download();
    // horizon.getInfo("http://youtube.com/watch?v=NEA0BLnpOtg", function(err, data){
    //     res.send(data);
    // });
    horizon.downloadToLocal(
        "https://www.youtube.com/watch?v=SrLZgP-OR6s",
        './',
        'swansonlocal.mp3',
        null, //{start:'02:15', end:'02:20'},
        null,
        function(err, result){
            //the result is the mp3 file. send it to the waveform generator
            //console.log(result);
            //res.send(result);
            if(result === horizon.successType.CONVERSION_FILE_COMPLETE){
                console.log(result);
                res.send('donezo');
                //res.send('finished');
                //send isn't working, so probs download to local.
            }
        },
        null
    );
   
});
console.log('working on 3000');
