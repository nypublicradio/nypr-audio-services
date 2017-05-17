import Service from 'ember-service';
import service from 'ember-service/inject';
import get from 'ember-metal/get';
import Ember from 'ember';

export default Service.extend({
  /* TODO: Move all this along with disover */

  discoverQueue:    service(),
  dj:               service(),
  hifi:             service(),
  actionQueue:      service(),

  init() {
    let hifi        = get(this, 'hifi');
    let actionQueue = get(this, 'actionQueue');

    actionQueue.addAction(hifi, 'audio-ended', {priority: 2, name: 'discover-queue'}, Ember.run.bind(this, this.onTrackFinished));
  },

  /* DISCOVER QUEUE -----------------------------------------------------------*/

  onTrackFinished(sound) {
    if (get(sound, 'metadata.playContext') === 'discover') {
      let nextTrack = this.get('discoverQueue').nextItem(get(this, 'dj.currentContentId'));
      if (nextTrack) {
        let dj = this.get('dj');
        dj.play(get(nextTrack, 'id'), 'discover');
        return true;
      }
    }
  }

});
