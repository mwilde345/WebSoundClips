var myAudioContext = new AudioContext();
var peaksInstance = null;
var renderSegments = null;
var peaksFunction = function (Peaks) {
  var options = {
    container: document.getElementById('first-waveform-visualiser-container'),
    mediaElement: document.querySelector('audio'),
    audioContext: myAudioContext,
    //   dataUri: {
    //     arraybuffer: '/test_data/TOL_6min_720p_download.dat',
    //     json: '/test_data/TOL_6min_720p_download.json'
    //   },
    keyboard: true,
    pointMarkerColor: '#006eb0',
    showPlayheadTime: true,
    waveformBuilderOptions: {
      
        //scale: 128,
        //amplitude_scale: 1.0
    },
    zoomLevels: [128,256,512,1024,2048]
  };

  peaksInstance = Peaks.init(options);

  renderSegments = function (peaks) {
    var segmentsContainer = document.getElementById('segments');
    var segments = peaks.segments.getSegments();
    var html = '';

    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i];

      var row = '<tr>' +
        '<td>' + segment.id + '</td>' +
        '<td>' + segment.labelText + '</td>' +
        '<td>' + segment.startTime.toFixed(1) + '</td>' +
        '<td>' + segment.endTime.toFixed(1) + '</td>' +
        '<td>' + '<button onclick="playSegment(this)" class="btn" id="'+segment.id+'">Play</button></td>' +
        '<td>' + '<button onclick="removeSegment(this)" class="btn" id="'+segment.id+'">Remove</button></td>' +
        //'<td>' + '<a href="#' + segment.id + '" data-action="play-segment" data-id="' + segment.id + '">Play</a>' + '</td>' +
        //'<td>' + '<a href="#' + segment.id + '" data-action="remove-segment" data-id="' + segment.id + '">Remove</a>' + '</td>' +
        '</tr>';

      html += row;
    }

    segmentsContainer.querySelector('tbody').innerHTML = html;

    if (html.length) {
      segmentsContainer.classList = '';
    }
  }

  document.querySelector('[data-action="zoom-in"]').addEventListener('click', function () {
    peaksInstance.zoom.zoomIn();
  });

  document.querySelector('[data-action="zoom-out"]').addEventListener('click', function () {
    peaksInstance.zoom.zoomOut();
  });

  document.querySelector('button[data-action="add-segment"]').addEventListener('click', function () {
    peaksInstance.segments.add({
      startTime: peaksInstance.player.getCurrentTime(),
      endTime: peaksInstance.player.getCurrentTime() + 10,
      labelText: "Test segment",
      editable: true
    });
  });

  document.querySelector('button[data-action="log-data"]').addEventListener('click', function (event) {
    renderSegments(peaksInstance);
  });

  document.querySelector('button[data-action="seek"]').addEventListener('click', function (event) {
    var time = document.getElementById('seek-time').value;
    var seconds = parseFloat(time);

    if (!Number.isNaN(seconds)) {
      peaksInstance.player.seek(seconds);
    }
  });
  
  document.querySelector('body').addEventListener('click', function (event) {
    var element = event.target;
    var action = element.getAttribute('data-action');
    var id = element.getAttribute('data-id');

    if (action === 'play-segment') {
      var segment = peaksInstance.segments.getSegment(id);
      peaksInstance.player.playSegment(segment);
    } else if (action === 'remove-point') {
      peaksInstance.points.removeById(id);
    } else if (action === 'remove-segment') {
      peaksInstance.segments.removeById(id);
    }
  });

}//)(peaks);