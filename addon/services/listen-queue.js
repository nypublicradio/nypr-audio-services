import Service from 'ember-service';
import service from 'ember-service/inject';
import { readOnly, equal } from 'ember-computed';
import get from 'ember-metal/get';
import Ember from 'ember';

export default Service.extend({
  session           : service(),
  store             : service(),
  actionQueue       : service(),
  hifi              : service(),
  dj                : service(),
  listenAnalytics   : service(),
  items             : readOnly('session.data.queue'),
  isPlayingFromQueue: equal('hifi.currentSound.metadata.playContext', 'queue'),

  init() {
    this.set('pending', []);
    let actionQueue = get(this, 'actionQueue');
    let hifi        = get(this, 'hifi');

    actionQueue.addAction(hifi, 'audio-ended', {priority: 2, name: 'queue'}, Ember.run.bind(this, this.onTrackFinished));
  },

  onTrackFinished(sound) {
    if (get(sound, 'metadata.playContext') === 'queue') {
      this.removeFromQueueById(get(sound, 'metadata.contentId'));
      let nextItem = this.nextItem();
      if (nextItem) {
        return get(this, 'dj').play(nextItem, {playContext: 'queue'});
      }
    }
  },

  addToQueueById(id, region) {
    let pending = this.get('pending');
    pending.push(id);

    let findPromise = get(this, 'store').findRecord('story', id);

    findPromise.then(story => {
      if (!pending.includes(id)) {
        // story was removed from the queue before it could be resolved
        return;
      } else {
        this._removePending(id);
      }
      let session = get(this, 'session');
      let queue = session.getWithDefault('data.queue', []).slice();

      queue.pushObject(story);
      session.set('data.queue', queue);

      this.get('listenAnalytics').trackAddToQueue(story, region);

      return story;
    });

    return findPromise;
  },

  removeFromQueueById(id) {
    let session = get(this, 'session');
    let queue = session.getWithDefault('data.queue', []);
    let newQueue = queue.rejectBy('id', id);

    this._removePending(id);

    if (newQueue.length !== queue.length) {
      session.set('data.queue', newQueue);
    }
  },

  reset(newQueue) {
    let session = get(this, 'session');
    session.set('data.queue', newQueue);
  },

  nextItem() {
    let session = get(this, 'session');
    let queue = session.getWithDefault('data.queue', []);

    if (queue.length > 0) {
      return get(queue, 'firstObject');
    } else {
      return null;
    }
  },

  _removePending(id) {
    let pending = this.get('pending');
    let pendingIndex = pending.indexOf(id);
    if (pendingIndex !== -1) {
      pending.removeAt(pendingIndex);
    }
  }
});
