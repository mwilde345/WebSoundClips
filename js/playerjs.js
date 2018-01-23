var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'V_laNt7Sh6g',
    events: {
      'onReady': onPlayerReady,
      //'onStateChange': onPlayerStateChange
    },
    origin: "https://www.youtube.com"
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}
var done = false;

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    //setTimeout(stopVideo, 6000);
    //done = true;
  }
}

function stopVideo() {
  player.stopVideo();
}

function logTime(timeValue = null) {
  console.log("logging time");
  //add a link to each entry that moves the player to that time
  //check if time > .5 so we don't go negative
  if (stopPressed == false && startPressed == false) {
    startPressed = true;
  }
  if (startPressed == true) {
    stopPressed = true;
    startPressed = false;
    insertTime(true, timeValue);
    return;
  }
  if (stopPressed == true) {
    startPressed = true;
    stopPressed = false;
    insertTime(false, timeValue);
    return;
  }
}

function insertTime(isStart, timeValue) {
  console.log("inserting time: "+timeValue);
  var currentTime = timeValue==null ? (player.getCurrentTime() - .8).toFixed(1) : timeValue;
  currentTime = currentTime < 0 ? 0 : currentTime;
  var insertString = isStart ? '<td><button onclick="seekTo(this)">' + currentTime + '</button></td>' :
    '<td><button onclick="seekTo(this)">' + currentTime + '</button></td>';
  $insertedItem = $(insertString);
  if (isStart) {
    $("#timeTableBody").append("<tr></tr>");
    $("#timeTableBody tr:last").append($insertedItem);
  } else {
    $("#timeTableBody td:last").after($insertedItem);
  }
  $insertedItem.find("button").addClass("btn btn-info");
}

function resetTime() {
  startPressed = false;
  stopPressed = false;
  $("#timeTableBody tr").remove();
}

function undoTime() {
  startPressed = !startPressed;
  stopPressed = !stopPressed;
  $("#timeTable td:last").remove();
}

function seekTo(button) {
  var time = $(button).html();
  player.seekTo(time);
}