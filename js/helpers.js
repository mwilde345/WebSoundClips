
//TODO: option for quotes or trivia. 
//trivia shows more options after trimming and posts to videos table and trivia clips
//quotes shows less options and posts to videos and quotes
//videosTable: videoID, clipIDs
//triviaClips: clipID, movieTitle, creator, essentialWords, firstFive, hints, tags, s3bucket
//quotes: clipID, firstFive, s3bucket
//

function testDynamo(){
    io.emit('dynamo_test');
}

function checkVideoID(videoID){
    //select from videoTable where videoID = videoID
    //if videoID already exists, getAllClips()
    //if not, post<Quotes|Trivia>
}

function getAllClips(videoID){
    //get clipIDs for videoID from videosTable
    //loop through clips and getClip(clipID)
}

function postQuotes(){
    //post to quotes
    //post to videosTable
    //put it in the specified s3bucket
}

function postTrivia(){
    //post to triviaClips
    //post to videosTable
    //put it in specified s3bucket
}

function checkFive(s3bucket, fiveWords){
    //set a flag for the first check
    //select all from quotes or triviaClips 
        //where bucket = s3bucket and five_words = fiveWords.lower;
    //if fiveWords found, loop through all results and getClip(clipID)
    //make the row yellow and add the duplicate audio clip(s) to the row
    //so what should be presented on the row? clipID and audio element? videoID too? how do you get the videoID from a clip?
    //(.*)(_(\.|\d)+_(\.|\d)+)(\.mp3)$ and get $1
    //add a confirm button to allow the duplicate clips to stay. confirm to each row and click it as you resolve each?
    //put confirm and remove options next to each other on the row.
    //is there a way to get a matching percentage say if 4 of the five words are the same
    //to avoid user error
}

function getClip(clipID){
    //present the clips to the user to play them.
    //return a string for an audio element.
    //then put several audio elements in one td if needed.
    //each audio element needs it's associated clipID next to it though...

}

function checkFirstFive(){
    //TODO: field to apply all tags and hints as well
    //verify at least 1 hint.
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
        //call dynamodb and search for duplicate videoID
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
}



function setAllDescriptors(){
    //don't allow this to be clicked until all clips have been trimmed and loaded
    var r = confirm("Overwrite current values for all fields?");
    if (!r) return;
    var masterMovie = $("#masterMovie").val();
    var masterCreator = $("#masterCreator").val();
    var masterHints = $("#masterHints").val();
    var masterTags = $("#masterTags").val();
    $("#clipTable tr #movie").each(function(index, item){
        $(item).val(masterMovie);
    });
    $("#clipTable tr #creator").each(function(index, item){
        $(item).val(masterCreator);
    });
    $("#clipTable tr #hints").each(function(index, item){
        $(item).val(masterHints);
    });
    $("#clipTable tr #tags").each(function(index, item){
        $(item).val(masterTags);
    });
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
    //the server breaks on the trim command if i do it too quick?
    $("#trimBtn").attr('disabled',true);
    $("#trimOutput").hide();
    $("#compressClipsDiv").hide();
    $("#trimProgress").val(0);
    $("#clipTable tr").slice(1).remove();
    var segments = peaksInstance.segments.getSegments();
    if (segments.length == 0) {
        alert("Please add segments!");
        return;
    }
    $("#trimProgress").attr("max",segments.length);
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

function test() {
    videoID = "V_laNt7Sh6g";
    $("#audioStuff").show();
    $("audio").prop("src", "./videoSound/" + videoID + ".mp3");
    if (peaksInstance != null) {
        peaksInstance.destroy();
    }
    var segments = {
        startTimes: [0.0,7.4,13.4,19.6,36.3,53.6,67.6],
        stopTimes: [7.1,13.1,18.3,28.4,43.9,67.5,78.3]
    };
    peaksFunction(peaks, videoID);
    addSegments(segments, peaksInstance);
    segments.startTimes.forEach(function(item, index){
        var clipID = videoID+"_"+parseFloat(segments.startTimes[index]).toFixed(1)+
            "_"+parseFloat(segments.stopTimes[index]).toFixed(1);
        var loudness = -13;
        var rowString = "<tr><td>" + clipID +
        "</td><td><audio controls=controls type='audio/mpeg' src='./loudClips/" +
        clipID + loudness + ".mp3' id='" + clipID + "_audio'/></td>" +
        "<td id='" + clipID + "_loudness'>" + loudness + "</td>" +
        "<td><input type='text' value='" + loudness + "' id='" + clipID + "_change'></input>" +
        "<button id='changeButton' name='" + clipID + "' class='btn btn-info'>Change Loudness</button></td>"+
        "<td><input value='' type='text' id='firstFive' placeholder='First Five'/>"+
        "<button id='viewConflicts' class='btn btn-primary'><span class='glyphicon glyphicon-search'/></button>"+
        "<button id='approve' class='btn btn-success'><span class='glyphicon glyphicon-ok'/></button>"+
        "<button id='deny' class='btn btn-danger'><span class='glyphicon glyphicon-remove'/></button>"+
        "<td><input value='' type='text' id='essential' placeholder='Essential Words'/></td>"+
        "<td><input value='' type='text' id='hints' placeholder='Hints'/></td>"+
        "<td><input value='' type='text' id='tags' placeholder='Tags'/></td>"+
        "<td><input value='' type='text' id='movie' placeholder='Movie'/></td>"+
        "<td><input value='' type='text' id='creator' placeholder='Creator'/></td></tr>";
        //add a call to dynamo and a flag if first five are the same
        $("#clipTableBody").append(rowString);
        $("#trimProgress").val($("#clipTable audio").length);
    });
    //if($("#clipTable audio").length==peaksInstance.segments.getSegments().length){
        $("#trimOutput").show();
        $("#compressClipsDiv").show();
        $("#trimBtn").attr("disabled", false);
      //}
}