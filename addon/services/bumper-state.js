import Ember from 'ember';
import service from 'ember-service/inject';
import computed, { readOnly, not, or, and} from 'ember-computed';
import get, { getProperties } from 'ember-metal/get';
import ENV from 'ember-get-config';

/* TODO: this needs a refactor. */

export default Ember.Service.extend({
  init() {
    this._super(...arguments);

    let actionQueue = get(this, 'actionQueue');
    let hifi = get(this, 'hifi');
    actionQueue.addAction(hifi, 'audio-ended', {priority: 4, name: 'bumper-play'}, Ember.run.bind(this, this.playBumperAction));
    actionQueue.addAction(hifi, 'audio-ended', {priority: 5, name: 'continuous-play'}, Ember.run.bind(this, this.autoplayAction));

    Ember.run.next(() => {
      this.cacheStreamsInStore();
    })
  },

  actionQueue    : service(),
  queue          : service('listen-queue'),
  session        : service(),
  store          : service(),
  hifi           : service(),
  dj             : service(),

  _autoplayPref : readOnly('session.data.user-prefs-active-autoplay'),
  _autoplaySlug : readOnly('session.data.user-prefs-active-stream.slug'),

  _autoplayPrefDefault: 'default_stream',
  _autoplaySlugDefault: 'wnyc-fm939',

  autoplayPref : or('_autoplayPref', '_autoplayPrefDefault'),
  autoplaySlug : or('_autoplaySlug', '_autoplaySlugDefault'),

  durationLoaded: computed.gt('hifi.currentSound.duration', 0),
  audioLoaded   : not('hifi.isLoading'),
  bumperLoaded  : and('durationLoaded', 'audioLoaded'),
  bumperPlaying: computed.and('bumperLoaded', 'bumperStarted'),
  bumperDidPlay: false,
  bumperStarted: false,
  revealNotificationBar: computed.or('bumperPlaying', 'bumperDidPlay'),
  autoplayEnabled: computed('autoplayPref', 'queue.items.length', function() {
    const { autoplayPref, queue } = getProperties(this, 'autoplayPref', 'queue');
    // only play the bumper and the continuous play if autoplay pref is enabled
    // and option is stream, or if auto play pref is enabled, option is queue,
    // and there are items in the queue

    if (autoplayPref === 'queue') {
      return !!(queue && queue.nextItem()); // only enable if there are items left
    }
    else {
      return autoplayPref !== 'no_autoplay';
    }
  }),

  autoplayChoice: computed('autoplayPref', 'autoplaySlug', function() {
    const autoplaySlug = get(this, 'autoplaySlug');
    const autoplayPref = get(this, 'autoplayPref');

    if (autoplayPref === 'default_stream') {
      let stream = this.getStream(autoplaySlug);
      return get(stream, 'name');
    } else {
      return 'Queue';
    }
  }),

  playBumperAction(sound) {
    let playContext = get(sound, 'metadata.playContext');
    let autoPlayChoice = get(this, 'autoplayChoice');
    if (this.get('autoplayEnabled') && playContext !== 'Continuous Play') {
      let bumperUrl = this.getBumperUrl();
      let playContext = 'Continuous Play';
      this.set('bumperStarted', true);
      let bumper = Ember.Object.create({modelName: 'bumper', urls: bumperUrl});
      get(this, 'dj').play(bumper, {playContext, autoPlayChoice});
      return true;
    }
  },

  autoplayAction(sound) {
    let playContext = get(sound, 'metadata.playContext');
    const autoplayPref = get(this, 'autoplayPref');

    if (this.get('autoplayEnabled') && playContext === 'Continuous Play'){
      this.set('bumperDidPlay', true);
      let playContext = autoplayPref === 'default_stream' ? 'Continuous Play' : 'queue';
      let nextItem    = this.getAutoplayItem();
      get(this, 'dj').play(nextItem, {playContext});
      return true;
    }
  },

  getAutoplayItem() {
    const autoplaySlug = get(this, 'autoplaySlug');
    const autoplayPref = get(this, 'autoplayPref');

    if (autoplayPref === 'default_stream') {
      return autoplaySlug;
    }
    else {
      const queue = get(this, 'queue');
      return queue.nextItem();
    }
  },

  getBumperUrl() {
    const autoplaySlug = get(this, 'autoplaySlug');
    const autoplayPref = get(this, 'autoplayPref');

    let nextItem;
    if (autoplayPref === 'default_stream') {
      let stream = this.getStream(autoplaySlug);
      if (stream) {
        nextItem = get(stream, 'audioBumper');
        return nextItem;
      }
    }

    // default
    return ENV.queueAudioBumperURL;
  },

  getStream(slug) {
    return get(this, 'store').peekRecord('stream', slug);
  },

  cacheStreamsInStore() {
    get(this, 'store').findAll('stream');
  }
});
