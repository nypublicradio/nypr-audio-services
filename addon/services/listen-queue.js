import { bind } from '@ember/runloop';
import { A as emberArray } from '@ember/array';
import Service, { inject as service } from '@ember/service';
import { match, reads } from '@ember/object/computed';
import { get } from '@ember/object';

export default Service.extend({
  session           : service(),
  store             : service(),
  actionQueue       : service(),
  hifi              : service(),
  dj                : service(),
  items             : reads('session.data.queue'),
  isPlayingFromQueue: match('hifi.currentSound.metadata.playContext', /queue/),

  init() {
    this._super(...arguments);
    this.set('pending', []);
    let actionQueue = this.actionQueue;
    let hifi        = this.hifi;

    actionQueue.addAction(hifi, 'audio-ended', {priority: 2, name: 'queue'},bind(this, this.onTrackFinished));

    hifi.on('audio-played', (sound) => {
      let playContext = get(sound, 'metadata.playContext');
      if (/queue/.test(playContext)) {
        this.removeFromQueueById(get(sound, 'metadata.contentId'));
      }
    });
  },

  onTrackFinished(sound) {
    if (/queue/.test(get(sound, 'metadata.playContext'))) {
      let nextItem = this.nextItem();
      if (nextItem) {
        this.dj.play(nextItem, {playContext: 'queue'});
        return true; // stop the following action queues from running
      }
    }
  },

  findRecord(id) {
    return this.store.findRecord('story', id);
  },

  addToQueueById(id) {
    let pending = this.pending;
    pending.push(id);

    let findPromise = this.findRecord(id);
    findPromise.then(story => {
      if (!pending.includes(id)) {
        // story was removed from the queue before it could be resolved
        return;
      } else {
        this._removePending(id);
      }
      let session = this.session;
      let queue = emberArray(session.getWithDefault('data.queue', []).slice());

      queue.pushObject(story);
      session.set('data.queue', queue);

      return story;
    });

    return findPromise;
  },

  removeFromQueueById(id) {
    let session = this.session;
    let queue = emberArray(session.getWithDefault('data.queue', []));
    let newQueue = emberArray(queue.rejectBy('id', id));

    this._removePending(id);

    if (newQueue.length !== queue.length) {
      session.set('data.queue', newQueue);
    }
  },

  reset(newQueue) {
    let session = this.session;
    session.set('data.queue', newQueue);
  },

  nextItem() {
    let items = this.items || [];

    if (items.length > 0) {
      return get(items, 'firstObject');
    } else {
      return null;
    }
  },

  _removePending(id) {
    let pending = emberArray(this.pending);
    let pendingIndex = pending.indexOf(id);
    if (pendingIndex !== -1) {
      pending.removeAt(pendingIndex);
    }
  }
});
