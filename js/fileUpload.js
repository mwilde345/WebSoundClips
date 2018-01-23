$('#videoTimes').on('submit', function (event) {
    event.preventDefault();
    $.ajax({
      // Your server script to process the upload
      url: 'upload',
      type: 'POST',

      // Form data
      data: new FormData($('#videoTimes')[0]),

      // Tell jQuery not to process data or worry about content-type
      // You *must* include these options!
      cache: false,
      contentType: false,
      processData: false,

      // Custom XMLHttpRequest
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          // For handling the progress of the upload
          myXhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
              $('#uploadProgress').attr({
                value: e.loaded,
                max: e.total,
              });
            }
          }, false);
          myXhr.upload.addEventListener('loadend', function(e) {
            console.log('upload complete');
            
            // When the request has completed (either in success or failure).
            // Just like 'load', even if the server hasn't 
            // responded that it finished processing the request.
          });
          myXhr.onreadystatechange = function() {
            if (myXhr.readyState == XMLHttpRequest.DONE) {
                $("#timeTableBody tr").remove();
                startPressed = false;
                stopPressed = false;
                var times = JSON.parse(myXhr.responseText);
                times.start.forEach(function(item,index){
                  if(item.length){
                    logTime(parseFloat(item));
                  }
                  if(times.end[index]){
                    logTime(parseFloat(times.end[index]));
                  }
                });
            }
          }
        }
        return myXhr;
      },
    });
  });

  $('#segmentTimes').on('submit', function (event) {
    event.preventDefault();
    $.ajax({
      // Your server script to process the upload
      url: 'upload_segments',
      type: 'POST',

      // Form data
      data: new FormData($('#segmentTimes')[0]),

      // Tell jQuery not to process data or worry about content-type
      // You *must* include these options!
      cache: false,
      contentType: false,
      processData: false,

      // Custom XMLHttpRequest
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          // For handling the progress of the upload
          myXhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
              $('#uploadSegmentProgress').attr({
                value: e.loaded,
                max: e.total,
              });
            }
          }, false);
          myXhr.upload.addEventListener('loadend', function(e) {
            console.log('upload complete');
            
            // When the request has completed (either in success or failure).
            // Just like 'load', even if the server hasn't 
            // responded that it finished processing the request.
          });
          myXhr.onreadystatechange = function() {
            if (myXhr.readyState == XMLHttpRequest.DONE) {
                startPressed = false;
                stopPressed = false;
                var newSegments = JSON.parse(JSON.parse(myXhr.responseText));
                console.log(newSegments);
                var oldSegments = peaksInstance.segments.getSegments();
                newSegments.forEach(function(s){delete s.id});
                oldSegments.forEach(function(s){delete s.id});
                peaksInstance.segments.removeAll();
                peaksInstance.segments.add(newSegments);
                renderSegments(peaksInstance);
            }
          }
        }
        return myXhr;
      },
    });
  });