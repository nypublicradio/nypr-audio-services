'use strict';

module.exports = function(environment /* , appConfig */) {
  if (environment === 'test') {
    return {
      queueAudioBumperURL: 'http://audio-bumper.com/thucyides.mp3'
    }
  }
  else {
    return {
      queueAudioBumperURL: 'http://audio.wnyc.org/streambumper/streambumper000008_audio_queue.mp3'
    };
  }

};
