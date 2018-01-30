
//TODO: option for quotes or trivia. 
//trivia shows more options after trimming and posts to videos table and trivia clips
//quotes shows less options and posts to videos and quotes
//videosTable: videoID, clipIDs
//triviaClips: clipID, movieTitle, creator, essentialWords, firstFive, hints, tags, s3bucket
//quotes: clipID, firstFive, s3bucket
//
//load video, check if video exists in videosTable
//if so, list clipIDs
//if not, insert new video entry with empty clips (or set a flag to do that later once 
//i have all the clips)

function dumpClips(){
    io.emit("dump_clips");
}
io.on("dumped_clips", function(number){
    console.log("removed: "+number+" files");
})

function checkVideoID(videoID){
    //select from videoTable where videoID = videoID
    //if videoID already exists, getAllClips()
    //if not, post<Quotes|Trivia>
    io.emit("check_video_id",videoID);
}

io.on("checked_video_id",function(data){
    console.log(data);
    if(!data.length){
        postVideo(videoID, []);
    }else{ 
        displayClips(data[0]);
    }
    //if not null then getAllClips else
    //postVideo(videoID,[])
});

function displayClips(videoObject){
    var videoID = videoObject.videoID;
    var clips = videoObject.clipIDs.L;
    console.log("Video found! Clips: ");
    if(!clips.length) {
        console.log("no clips yet");
        return;
    }else{
        console.log("running displayClips");
        clips.L.forEach(function(item,index){
            clipsForThisVideo.push(item);
            console.log(item);
        });
    }
}

function getAllClips(videoID){
    //get clipIDs for videoID from videosTable
    //loop through clips and getClip(clipID)
}

function postClips(){
    var clips = [];

    $("#clipTableBody tr").each(function(index, item){
        var rowData = $(item).find("td");
        var clipData = {
            clipID: $($(rowData).find('#clipAudio')).attr('src').match(/(.*\/)(.*)(\.mp3.*)/)[2],
            firstFive: $($(rowData).find("#firstFive")).val(),
            essentialWords: $($(rowData).find("#essential")).val().split(',')
                .map(function(v){return v.toLowerCase().trim()}),
            hints: $($(rowData).find("#hints")).val().split(',')
                .map(function(v){return v.toLowerCase().trim()}),
            tags: $($(rowData).find("#tags")).val().split(',')
                .map(function(v){return v.toLowerCase().trim()}),
            movieTitle: $($(rowData).find("#movie")).val(),
            creator: $($(rowData).find("#creator")).val(),
            s3bucket: s3bucket
        }
        clipData = validateArgs(clipData);
        if(skillOption=="quotes"){
            clipData = {
                clipID: clipData.clipID,
                firstFive: clipData.firstFive,
                s3bucket: s3bucket
            }
        }
        clips.push(clipData);
    });
    clips.forEach(function(item, index){
        if(clipsForThisVideo.indexOf(item.clipID)>=0){
            console.log("skipped "+item.clipID);
            return;
        }else{
            clipsForThisVideo.push(item.clipID);
            if(skillOption=="quotes"){
                postQuote(item);
            }else if(skillOption=="trivia"){
                postTrivia(item);
            }
        }

    })
    postVideo(videoID);
    console.log(clips);
}

function validateArgs(clipData){
    for(key in clipData){
        //console.log(key);
        if(!clipData[key].length){
            clipData[key] = " ";
        }
    }
    return clipData;
}

function postQuote(clipData){
    //post to quotes
    io.emit("post_quote", clipData);
    
    //post to videosTable
    //put it in the specified s3bucket
}

io.on("posted_quote", function(data){
    console.log("posted quote");
    //clipsForThisVideo.push(data);
    console.log(data);
});

function postTrivia(clipData){
    //post to triviaClips
    io.emit("post_trivia", clipData);
    //post to videosTable
    //put it in specified s3bucket
}

io.on("posted_trivia", function(data){
    console.log("posted trivia");
    //clipsForThisVideo.push(data);
    console.log(data);
});

function postVideo(videoID){
    console.log("posting video with clilps: ");
    console.log(clipsForThisVideo);
    io.emit("post_video",{videoID: videoID, clips: clipsForThisVideo});
}

io.on("posted_video", function(data){
    console.log("posted video");
    console.log(data);
});

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
    var firstFives = [];
    var movie = "";
    var errorFlag = false;
    $("tr #firstFiveConflict").remove();
    $("#clipTable tr #firstFive").each(function(index, item){
        if(index in approvedClips||index in deniedClips){
            console.log("skipping row "+index);
            return true;
        }
        if(!$(item).val().length){
            errorFlag = true;
            alert("First Five entries may not be empty");
            return false;
        }
        if(findDuplicates(firstFives, $(item).val().trim())){
            errorFlag = true;
            alert("Remove duplicate First Five entries");
            return false;
        }
        firstFives.push({row: index, firstFive: $(item).val().trim()});
    });
    if(!errorFlag){
        io.emit('checkFirstFive',{firstFives: firstFives, skillOption: skillOption, s3bucket: s3bucket});
    }
}

function findDuplicates(firstFives, currentFirstFive){
    var duplicateFound = false;
    firstFives.map(function(item){
        if(item.firstFive==currentFirstFive){
            duplicateFound = true;
        }
    });
    return duplicateFound;
}

function validateEntries(){
    //for each row:
    //first fives cannot equal each other
    //if trivia, make sure nothing is empty
    //if quotes, all we need are the first five.
}

function viewConflicts(button){
    var row = $(button).closest("tr").index();
    var clipIDs = conflictObject[row];
    $("#my_tooltip tbody tr").remove();
    clipIDs.forEach(function(item,index){
        $("#my_tooltip tbody").append('<tr>'+
        '<td><audio src="https://s3.amazonaws.com/'+s3bucket+'/'+item.clipID+'.mp3" controls="controls" type="audio/mpeg"/></td>'+
        '<td>'+item.clipID+'</td>'+
        '</tr>');
    })
    
    $('#my_tooltip').popup({
        type: 'tooltip',
        vertical: 'bottom',
        transition: '0.3s all 0.1s',
        tooltipanchor: $(button),
        autoopen: true
    });
    console.log("Conflicts on row: "+(row+1)+" are: "+conflictObject[row].toString());
}
function approve(button){
    var row = $(button).closest("tr").index();
    var clipID = $(button).find("td:eq(0)").text();
    approvedClips[row] = clipID;
    $("#clipTableBody tr:eq("+row+")").addClass("approved");
    $("#clipTableBody tr:eq("+row+") #firstFiveConflict").remove();
}
function deny(button){
    var row = $(button).closest("tr").index();
    var clipID = $(button).find("td:eq(0)").text();
    deniedClips[row] = clipID;
    $("#clipTableBody tr:eq("+row+")").addClass("denied");
    $("#clipTableBody tr:eq("+row+") #firstFiveConflict").remove();
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
    
    //$("#chooseBucketDiv").hide();
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
        // $("#chooseBucketDiv").show();
        checkVideoID(videoID);
    }
}

function compress() {
    // $("#s3UploadDiv").show();
    getClipIds().forEach(function(item,index){
        //compressedClips.push(clipID + loudness);
        io.emit('compress',{
            clipID: item
        });
    });
}

function s3upload() {
    //var s3Bucket = s3bucket
    console.log("uploading to : "+s3bucket);
    if(!s3bucket.length){
        alert("No Bucket Specified!");
        return;
    }
    getClipIds().forEach(function(item,index){
        io.emit('s3_upload', {
            clipID: item,
            s3bucket: s3bucket
        });
    });
}

function getClipIds(){
    var allClips = [];
    $("#clipTableBody tr").each(function (index, item) {
        if(index in deniedClips){ return true;}
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
    var masterEssential = $("#masterEssential").val();
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
    $("#clipTable tr #essential").each(function(index, item){
        $(item).val(masterEssential);
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
        // $("#audioStuff").hide();
        $("#clipTable tr").slice(1).remove();
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
    // $("#trimOutput").hide();
    // $("#compressClipsDiv").hide();
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
    // $("#audioStuff").show();
    $("audio").prop("src", "./videoSound/" + videoID + ".mp3");
    $("#clipTable tr").slice(1).remove();
    if (peaksInstance != null) {
        peaksInstance.destroy();
    }
    var segments = {
        startTimes: [0.0,7.4,13.4,19.6,36.3,53.6,67.6],
        stopTimes: [7.1,13.1,18.3,28.4,43.9,67.5,78.3]
    };
    //loadTheVideo();
    peaksFunction(peaks, videoID);
    addSegments(segments, peaksInstance);
    segments.startTimes.forEach(function(item, index){
        var clipID = videoID+"_"+parseFloat(segments.startTimes[index]).toFixed(1)+
            "_"+parseFloat(segments.stopTimes[index]).toFixed(1);
        var loudness = -13;
        var rowString = "<tr><td>" + clipID +
        "</td><td><audio controls=controls type='audio/mpeg' src='./loudClips/" +
        clipID + loudness + ".mp3' id='clipAudio'/></td>" +
        "<td id='clipLoudness'>" + loudness + "</td>" +
        "<td><input type='text' value='" + loudness + "' id='" + clipID + "_change'></input>" +
        "<button id='changeButton' name='" + clipID + "' class='btn btn-info'>Change Loudness</button></td>"+
        "<td><input value='' type='text' id='firstFive' placeholder='First Five'/>"+
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
        // $("#trimOutput").show();
        // $("#compressClipsDiv").show();
        $("#trimBtn").attr("disabled", false);
      //}
}