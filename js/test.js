var horizon = require('horizon-youtube-mp3');
var path = require('path');

var downloadPath = path.join(__dirname);
module.exports = {
  download: function(){
    horizon.downloadToLocal(
      'https://www.youtube.com/watch?v=Tch4v0L0GHA',
      downloadPath,
      'swanson.mp3',
      null,
      null,
      onConvertVideoComplete,
      null
    );
  }
}

function onConvertVideoComplete(err, result) {

    console.log(err, result);
    // Will return...
    //null, conversionFileComplete
  }
  
  function onConvertVideoProgress(percent, timemark, targetSize) {
    console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
    // Will return...
    // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
    // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
    // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
  }