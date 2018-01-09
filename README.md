# WebSoundClips
turn youtube videos into nicely formatted sound clips for alexa skills.

Audio Timeline: Convert video to mp3 and download Split mp3 into clips and put in folder Load clip in audacity and adjust trim and loudness. Export from audacity to mp3 in another folder. Compress those clips into 48k. Upload to s3.

ffmpeg -i -ss 00:00:35 -to 00:00:41 -c copy

ffmpeg -i -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 <output-file.mp3>

you need a new naming schema for generating the files via commands. Also when open an audacity project to edit files, don't make it called a filename, then they're all appended with 1, 2, 3 etc.

So yeah looks like ffmpeg lets you adjust loudness programmatically too https://developer.amazon.com/docs/flashbriefing/normalizing-the-loudness-of-audio-content.html#additional-tools

Also, use youtube to get the times programmatically (insert marker a second before the button is pressed) https://developers.google.com/youtube/iframe_api_reference?csw=1

https://stackoverflow.com/questions/6970013/getting-current-youtube-video-time

If there is a gui to trim the files then you can use millisecond trimming in ffmpeg: https://stackoverflow.com/questions/23171937/ffmpeg-video-editing-command-in-milliseconds-timestamp

Ghetto but what I'm goin for: https://github.com/meowtec/audio-cutter

Read: https://stackoverflow.com/questions/8621078/can-i-use-javascript-to-split-up-an-mp3-file-into-smaller-mp3-files

1. input youtube video url
2. open iframe with video
3. record starts and stops (save this data to a file?)
4. send youtube url and time data to nodejs function on the server
5. download mp3
6. split into files
7. adjust loudness
  a. upload those clips to temp s3 folder
8. present user with folder of their clips (from s3. so their clips will have to be tagged somehow with session var)
9. Go through and trim each in browser. (save trim times)
10. send array of clips with the trim times to server.
11. ffmpeg trim
12. return to user
  a. download
  b. send to swanson bucket
  c. send to trivia bucket w/ tag for that user
  d. so if i run it, no tag. (need passwd?)
