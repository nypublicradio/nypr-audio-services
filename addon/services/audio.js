import Service from 'ember-service';
import service from 'ember-service/inject';
import get from 'ember-metal/get';
import computed, { readOnly, alias, or } from 'ember-computed';
import RSVP from 'rsvp';
const TWO_MINUTES     = 1000 * 60 * 2;

export default Service.extend({
  discoverQueue:    service(),
  // bumperState:      service(),
  // listens:          service('listen-history'),
  // queue:            service('listen-queue'),
  // // dataPipeline:      service(),
  //
  // hifi:             service(),
  // isReady:          readOnly('hifi.isReady'),
  // isPlaying:        readOnly('hifi.isPlaying'),
  // isLoading:        readOnly('hifi.isLoading'),
  // isMuted:          readOnly('hifi.isMuted'),
  // duration:         readOnly('hifi.duration'),
  // percentLoaded:    readOnly('hifi.percentLoaded'),
  // position:         alias('hifi.position'),
  // volume:           alias('hifi.volume'),
  //
  // // TODO: fix up currentStory/currentAudio interfaces for streams and on demands
  // currentStory:         or('currentAudio.story', 'currentAudio'),
  //
  // currentAudio:     null,
  // currentContext:   null,
  // sessionPing:      TWO_MINUTES,
  //
  // currentId: computed('currentAudio.id', {
  //   get() {
  //     return get(this, 'currentAudio.id');
  //   },
  //   set(k, v) { return v; }
  // }),
  //
  // playState: computed('isPlaying', 'isLoading', function() {
  //   if (get(this, 'isLoading')) {
  //     return 'is-loading';
  //   } else if (get(this, 'isPlaying')) {
  //     return 'is-playing';
  //   } else {
  //     return 'is-paused';
  //   }
  // }),

  /* DISCOVER QUEUE -----------------------------------------------------------*/

  discoverHasNext() {
    return this.get('discoverQueue').nextItem(this.get('currentId'));
  },

  playDiscoverQueue() {
    let nextTrack = this.get('discoverQueue').nextItem(this.get('currentId'));
    if (nextTrack) {
      this.play(get(nextTrack, 'id'), 'discover');
      return true;
    } else {
      return this._flushContext();
    }
  },

});
