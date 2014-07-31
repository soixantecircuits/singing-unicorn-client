'use strict';
var address = 'singingunicorn.meteor.com',
  unicorn,
  playlist,
  playlistRQ,
  pingy,
  pingyRQ,
  player = undefined,
  currenTitle = '',
  isPlaying = false,
  mp3List = [],
  _ = require('lodash'),
  mp3 = require('youtube-mp3'),
  Asteroid = require("asteroid"),
  fs = require('fs-extra'),
  yttmal = require('yttmal'),
  Player = require('player');

var playSound = function(videoId, sound, collectionID) {
  // create player instance

  player = new Player('./' + sound);

  // play now and callback when playend
  updatePlayStart(collectionID);
  player.play(function(err, player) {
    console.log('playend!');
  });

  player.on('playing', function(item) {
    console.log('im playing... src:');
    currenTitle = item.src.split('.')[1].substr(1, item.src.split('.')[1].length);
    console.log(item.src);
    isPlaying = true;
  });

  // event: on playend
  player.on('playend', function(item) {
    // return a playend item
    console.log('src:' + item.src + ' play done, switching to next one if some exist...');
    updatePlayEnd(item.src.split('.')[1].substr(1, item.src.split('.')[1].length));
  });

  player.on('stopped', function(item) {
    console.log('src:' + item.src + ' stopped, should stop...');
    updatePlayEnd(item.src.split('.')[1].substr(1, item.src.split('.')[1].length));
  });

  // event: on error
  player.on('error', function(err) {
    // when error occurs
    console.log('Error occured : ');
    console.log(err);
  });
};

var updatePlayEnd = function(_id) {
  console.log('[ ] ** Play end:');
  console.log('curentTitle _id: ' + _id);
  isPlaying = false;
  var method = unicorn.call('updatePlayEnd', _id);
  var outer = method.result.then(function onResolve(result) {
    console.log('Response: ' + result);
  }).catch(function onReject(err) {
    console.error('FAILED', err)
  });
}

var updatePlayStart = function(_id) {
  console.log('[ > ** Play start:');
  console.log('curentTitle _id: ' + _id);
  isPlaying = true;
  var method = unicorn.call('updatePlayStart', _id);

  var outer = method.result.then(function onResolve(result) {
    console.log('Response:' + result);
  }).catch(function onReject(err) {
    console.error('FAILED', err)
  });
}

//not used right now
var download = function(videoId, fileName) {
  var url = 'https://www.youtube.com/watch?v=' + videoId;
  mp3.download(url, fileName, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Download completed! :' + fileName);
      //playSound(fileName);
    }
  });
};

var downloadYTanPlay = function(videoId, fileName, collectionID) {
  fs.exists('./' + fileName, function(exists) {
    if (exists) {
      console.log('File exist');
      playSound(videoId, fileName, collectionID);
    } else {
      yttmal.convert(videoId, function(err, info, req) {
        if (err) {
          updatePlayEnd(collectionID);
          console.log('Error while downloading');
          console.log(err);
          downloadAndPlaySound();
        } else {
          console.log('Title: ' + info.title);
          console.log('Thumbnail: ' + info.image);
          console.log('Length in minutes: ' + info.length);
          var file = require('fs').createWriteStream(encodeURI(fileName));
          req.pipe(file);
          file.on('finish', function() {
            console.log('file downloaded to ', fileName);
            playSound(videoId, fileName, collectionID);
          });
        }
      });
    }
  });
};

var downloadAndPlaySound = function() {
  if (playlistRQ.result.length > 0) {
    console.log('Try to start the play');
    isPlaying = true;
    var index = _.random(0, playlistRQ.result.length - 1);
    var videoId = playlistRQ.result[index].videoId;
    var fileName = mp3List[index]._id + '.mp3';
    downloadYTanPlay(videoId, fileName, mp3List[index]._id);
  }
}

var tryToPlay = function(){
  if (!isPlaying) {
      console.log('Start new play !');
      downloadAndPlaySound();
    } else {
      console.log('Playing track... wait for your turn');
    }
}

var connectUnicorn = function() {
  unicorn = new Asteroid(address, false, function handlerSocket(err) {
    //console.error('Socket event: ');
    //console.error(err);
  });
  unicorn.on('error', function(err) {
    console.error('Error: ');
    console.error(err);
  });

  unicorn.subscribe('playlist');
  playlist = unicorn.getCollection('playlist');
  playlistRQ = playlist.reactiveQuery({});

  playlistRQ.on('change', function() {
    console.log('Changes on playlist --------------');
    console.log(new Date());
    mp3List = playlistRQ.result;
  });

  unicorn.subscribe('pingy');
  pingy = unicorn.getCollection('pingy');
  pingyRQ = pingy.reactiveQuery({});

  pingyRQ.on('change', function() {
    console.log('Some one on Soixante circuits--------------');
    console.log(new Date());
    tryToPlay();
  });

  /*setInterval(function() {
    tryToPlay();
  }, 5000);*/
}

connectUnicorn();