
function saveSegments(){
    var times = peaksInstance.segments.getSegments();
    console.log(times);
    console.log("downloading");
    $.ajax({
        url: '/save_segments',
        method: 'POST',
        data: JSON.stringify({times: times, videoID: videoID}),
        //dataType: 'json',
        contentType: 'application/json',
        success: function(result){
            console.log(result);
            $("#downloadLink").attr('href','download_segments/'+videoID);
            $("#downloadLink").get(0).click();
        },
        error: function(jqXHR, textStatus, err) {
            //show error message
            console.log(err);
        }

    });
}

function saveTimes(){
    var times = gatherTimes();
    console.log(times);
    console.log("downloading");
    $.ajax({
        url: '/save_times',
        method: 'POST',
        data: JSON.stringify({times: times, videoID: videoID}),
        //dataType: 'json',
        contentType: 'application/json',
        success: function(result){
            console.log(result);
            $("#downloadLink").attr('href','download_times/'+videoID);
            $("#downloadLink").get(0).click();
        },
        error: function(jqXHR, textStatus, err) {
            //show error message
            console.log(err);
        }

    });
}

function loadTheVideo() {
    //https://www.youtube.com/watch?v=SrLZgP-OR6s
    var input = $("#videoID").val().length ? $("#videoID").val().match(/(.*)(=)(.*)/) : [];
    if(input.length==0){
        alert("please enter valid Youtube URL");
        return;
    }else{
        //$("#timeTableBody tr").remove();
        videoID = input[3];
        console.log(videoID);
        player.loadVideoById(videoID);
    }
}

function compress() {
    $("#s3UploadDiv").show();
    getClipIds().forEach(function(item,index){
        //compressedClips.push(clipID + loudness);
        io.emit('compress',{
            clipID: item
        });
    });
}

function s3upload() {
    var s3Bucket = $("#s3Bucket").val();
    if(!s3Bucket.length){
        alert("No Bucket Specified!");
        return;
    }
    getClipIds().forEach(function(item,index){
        io.emit('s3_upload', {
            clipID: item,
            s3Bucket: s3Bucket
        });
    });
}

function getClipIds(){
    var allClips = [];
    $("#clipTable tr").each(function (index, item) {
        if(index==0){ return true;}
        var clipID = $(item).find("td:eq(0)").text();
        var loudness = $(item).find("td:eq(2)").text(); 
        allClips.push(clipID + loudness);
    });
    return allClips;
}

function tableClick(event) {
    var element = event.target;
    if ($(element).attr("id") == "changeButton") {
        var rowNum = $(element).closest("tr")[0].rowIndex;
        var clipID = $(element).attr('name');
        //var newLoudness = $("#clipTable tr:eq(" + rowNum + ") input#"+clipID+"_change").val();
        var newLoudness = $("#clipTable tr:eq(" + rowNum + ") input")[0].value;
        if(!newLoudness.length){ newLoudness = -13};
        console.log(newLoudness);
        console.log(clipID);
        console.log(rowNum);
        io.emit('loudness', {
            clipID: clipID,
            loudness: newLoudness,
            tableRow: rowNum
        });
    }
    if ($(element).attr("id") == "checkButton") {
        var rowNum = $(element).closest("tr")[0].rowIndex;
        var clipID = $(element).attr('name');
        var fiveWords = $("#clipTable tr:eq(" + rowNum + ") input#firstFive").val();
        //dynamodb call and check
        //make just one button before compress.... instead of one for every row
    }
}

function checkFirstFive(){
    //have a field above the trimmed clips for movie and creator that you can apply to each text field
    //then manually edit movies and creators per clip if the video has more than one movie in it.
    var firstFives = [];
    var movie = "";
    $("#clipTable tr #firstFive").each(function(index, item){
        if(!$(item).val().length){alert("First Five entries may not be empty"); return false;}
        movie = $("#clipTable tr:eq("+(index+1)+") input")[5].value;
        firstFives.push({row: index, firstFive: $(item).val(), movie: movie});
    });
    if($("#clipTable tr #firstFive").length==firstFives.length){
        io.emit('checkFirstFive',firstFives);
    }
    
}

function test() {
    videoID = "V_laNt7Sh6g";
    $("#audioStuff").show();
    $("audio").prop("src", "./videoSound/" + videoID + ".mp3");
    if (peaksInstance != null) {
        peaksInstance.destroy();
    }
    peaksFunction(peaks, videoID);
    addSegments({
        startTimes: [0,7.4,13.4,19.6,36.3,53.6,67.6],
        stopTimes: [7.1,13.1,18.3,28.4,43.9,67.5,78.3]
    }, peaksInstance);
    //trimClips();
}

function playSegment(button) {
    var segmentID = $(button).attr("id");
    var segment = peaksInstance.segments.getSegment(segmentID);
    peaksInstance.player.playSegment(segment);
}

function removeSegment(button) {
    var segmentID = $(button).attr("id");
    peaksInstance.segments.removeById(segmentID);
    renderSegments(peaksInstance);
}

function download() {
    $("#downloadBtn").prop("disabled", true);
    $("#downloadProgress").attr("value",0);
    if (peaksInstance != null) {
        var r = confirm("Overwrite mp3 file?");
        if (!r) return;
        peaksInstance.destroy();
        $("#audioStuff").hide();
    }
    var data = {};
    data.url = "https://www.youtube.com/watch?v="+videoID;
    console.log(data.url);
    io.emit('download', data);
}

function gatherTimes() {
    var startTimes = [];
    var stopTimes = [];
    $("#timeTableBody tr").each(function (index) {
        var start = parseFloat($($(this).children()[0]).text());
        var stop = $($(this).children()[1]).text();
        startTimes.push(start);
        if (stop.length) {
            stop = parseFloat(stop);
            if (start == stop) stop = start + 1
            stopTimes.push(stop);
        }
    });
    if (startTimes.length > stopTimes.length) {
        stopTimes.push(startTimes[startTimes.length - 1] + 5.0);
    }
    return {
        startTimes: startTimes,
        stopTimes: stopTimes
    };
}

function trimClips() {
    $("#trimOutput").show();
    $("#compressClipsDiv").show();
    var segments = peaksInstance.segments.getSegments();
    if (segments.length == 0) {
        alert("Please add segments!");
        return;
    }
    segments.forEach(function (item, index) {
        var data = {};
        data.start = item.startTime.toFixed(1);
        data.end = item.endTime.toFixed(1);
        data.videoID = videoID;
        io.emit('trim', data);
    });
}

function addSegments(timeSegments, peaksInstance) {
    peaksInstance.on('peaks.ready', function () {
        timeSegments.startTimes.forEach(function (item, index) {
            console.log("adding segment " + index);
            peaksInstance.segments.add({
                startTime: timeSegments.startTimes[index],
                endTime: timeSegments.stopTimes[index],
                labelText: "Segment " + index,
                editable: true
            });
        });
        renderSegments(peaksInstance);
    });
}