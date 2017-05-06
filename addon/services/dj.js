import Ember from 'ember';
import service from 'ember-service/inject';
import RSVP from 'rsvp';
import get from 'ember-metal/get';
import set from 'ember-metal/set';

/* DJ knows how to play anything. Pass it a stream/story PK, or pass it a
stream/story model and DJ will queue it up on the hifi with the appropriate
metadata inserted */

export default Ember.Service.extend({
  hifi           : service(),
  store          : service(),
  actionQueue    : service(),
  listenAnalytics: service(),

  init() {
    let actionQueue = get(this, 'actionQueue');
    let hifi        = get(this, 'hifi');
    hifi.on('current-sound-changed', () => this.set('playedOnce', true));

    actionQueue.addAction(hifi, 'audio-ended', {priority: 1, name: 'segmented-audio'}, Ember.run.bind(this, this.playSegmentedAudio));
  },

  playSegmentedAudio(sound) {
    let story    = get(sound, 'metadata.contentModel');

    if (get(story, 'segmentedAudio') && story.hasNextSegment()) {
      story.getNextSegment(); // trigger next segment
      this.play(story, {position: 0});
      return true;
    }
  },

  fetchRecord(itemIdOrItem) {
    let modelName = this.itemModelName(itemIdOrItem);
    if (typeof(itemIdOrItem) === 'string') {
      return get(this, 'store').findRecord(modelName, itemIdOrItem);
    }
    else {
      return RSVP.Promise.resolve(itemIdOrItem);
    }
  },

  itemModelName(itemIdOrItem) {
    if (typeof(itemIdOrItem) === 'string') {
      return (/^\d*$/.test(itemIdOrItem) ? 'story' : 'stream');
    }
    else { // could be a model, detect if model or stream
      return (get(itemIdOrItem, 'constructor.modelName') || get(itemIdOrItem, 'modelName'));
    }
  },

  itemId(itemIdOrItem) {
    if (typeof(itemIdOrItem) === 'string') {
      return itemIdOrItem;
    }
    else {
      return itemIdOrItem.id;
    }
  },

  isNewPlay(itemIdOrItem) {
    return get(this, 'hifi.currentSound.metadata.contentId') !== this.itemId(itemIdOrItem);
  },

  play(itemIdOrItem, {playContext, position} = {}) {
    let itemModelName   = this.itemModelName(itemIdOrItem);
    let recordRequest   = this.fetchRecord(itemIdOrItem);
    let newPlay         = this.isNewPlay(itemIdOrItem);

    let audioUrlPromise = recordRequest.then(s => {
      // TODO: Make this consistent between models
      if (itemModelName === 'story') {
        return newPlay ? s.resetSegments() : s.getCurrentSegment();
      }
      else {
        return get(s, 'urls');
      }
    });

    let analyticsData = recordRequest.then(s => {
      if (s && s.forListenAction) {
        return s.forListenAction();
      }
    });

    let listenAnalytics = get(this, 'listenAnalytics');

    let metadata = {
      contentId: this.itemId(itemIdOrItem),
      contentModelType: itemModelName,
      playContext: playContext,
      analyticsData
    };

    let playRequest = get(this, 'hifi').play(audioUrlPromise, {metadata, position});
    // This should resolve around the same time, and then set the metadata
    recordRequest.then(story => set(metadata, 'contentModel', story));
    playRequest.then(({sound, failures}) => {
      listenAnalytics.trackAllCodecFailures(failures, sound);
    }).catch(e => {
      this.set('hasErrors', true);
      listenAnalytics.trackSoundFailure(e);
    });

    return playRequest;
  }
});