import EmberObject from '@ember/object';
import { bind, next } from '@ember/runloop';
import Service, { inject as service } from '@ember/service';
import { readOnly, not, or, and, gt } from '@ember/object/computed';
import { get, getProperties, computed } from '@ember/object';
import ENV from 'ember-get-config';

/* TODO: this needs a refactor. */

export default Service.extend({
  init() {
    this._super(...arguments);

    let actionQueue = this.actionQueue;
    let hifi = this.hifi;
    actionQueue.addAction(hifi, 'audio-ended', {priority: 4, name: 'bumper-play'}, bind(this, this.playBumperAction));
    actionQueue.addAction(hifi, 'audio-ended', {priority: 5, name: 'continuous-play'}, bind(this, this.autoplayAction));

    next(() => {
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

  durationLoaded: gt('hifi.currentSound.duration', 0),
  audioLoaded   : not('hifi.isLoading'),
  bumperLoaded  : and('durationLoaded', 'audioLoaded'),
  bumperPlaying: and('bumperLoaded', 'bumperStarted'),
  bumperDidPlay: false,
  bumperStarted: false,
  revealNotificationBar: or('bumperPlaying', 'bumperDidPlay'),
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
    const autoplaySlug = this.autoplaySlug;
    const autoplayPref = this.autoplayPref;

    if (autoplayPref === 'default_stream') {
      let stream = this.getStream(autoplaySlug);
      return get(stream, 'name');
    } else {
      return 'Queue';
    }
  }),

  playBumperAction(sound) {
    let playContext = get(sound, 'metadata.playContext');
    let autoPlayChoice = this.autoplayChoice;
    if (this.autoplayEnabled && playContext !== 'audio-bumper') {
      let bumperUrl = this.getBumperUrl();
      let playContext = 'audio-bumper';
      this.set('bumperStarted', true);
      let bumper = EmberObject.create({modelName: 'bumper', urls: bumperUrl});
      this.dj.play(bumper, {playContext, autoPlayChoice});
      return true;
    }
  },

  autoplayAction(sound) {
    let playContext = get(sound, 'metadata.playContext');
    const autoplayPref = this.autoplayPref;

    if (this.autoplayEnabled && playContext === 'audio-bumper'){
      this.set('bumperDidPlay', true);
      let playContext = autoplayPref === 'default_stream' ? 'continuous-stream' : 'continuous-queue';
      let nextItem    = this.getAutoplayItem();
      this.dj.play(nextItem, {playContext});
      return true;
    }
  },

  getAutoplayItem() {
    const autoplaySlug = this.autoplaySlug;
    const autoplayPref = this.autoplayPref;

    if (autoplayPref === 'default_stream') {
      return autoplaySlug;
    }
    else {
      const queue = this.queue;
      return queue.nextItem();
    }
  },

  getBumperUrl() {
    const autoplaySlug = this.autoplaySlug;
    const autoplayPref = this.autoplayPref;

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
    return this.store.peekRecord('stream', slug);
  },

  cacheStreamsInStore() {
    this.store.findAll('stream');
  }
});
