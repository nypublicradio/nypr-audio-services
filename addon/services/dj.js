import Ember from 'ember';
import service from 'ember-service/inject';
import RSVP from 'rsvp';
import get from 'ember-metal/get';
import set from 'ember-metal/set';

// DJ knows how to play anything. Pass it a stream/story PK, or pass it a stream/story model
// and DJ will queue it up on the hifi with the appropriate metadata inserted

export default Ember.Service.extend({
  hifi: service(),
  store: service(),

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
      return get(itemIdOrItem, '_internalModel.modelName');
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
    return get(this, 'hifi.currentSound.metadata.contentId') === this.itemId(itemIdOrItem);
  },

  play(itemIdOrItem, {playContext}) {
    let itemModelName   = this.itemModelName(itemIdOrItem);
    let recordRequest   = this.fetchRecord(itemIdOrItem);
    let newPlay         = this.isNewPlay(itemIdOrItem);

    let audioUrlPromise = recordRequest.then(s => {
      // TODO: Make this consistent between models
      if (itemModelName === 'story') {
        return newPlay ? s.resetSegments() : s.getCurrentSegment();
      }
      else {
        return s.get('urls');
      }
    });

    let analyticsData = recordRequest.then(s => s.forListenAction());
    let metadata = {
      contentId: this.itemId(itemIdOrItem),
      contentModelType: itemModelName,
      playContext: playContext,
      analyticsData
    };

    let playRequest = get(this, 'hifi').play(audioUrlPromise, {metadata});
    playRequest.then(() => {
      recordRequest.then(story => set(metadata, 'contentModel', story));

      //   TODO, maybe. These are the items that the persistent player needs
      //   We could extract them right here and remove all that cruft from nypr-player-integration

      // {
      //   showTitle             : "",
      //   showUrl               : "",
      //   storyTitle            : "",
      //   storyUrl              : "",
      //   songDetails           : "",
      //   streamScheduleUrl     : "",
      //   streamPlaylistUrl     : "",
      //   streamUrl             : "",
      //   streamName            : "",
      //   backdropImageUrl      : ""
      // };

    });

    return playRequest;
  }
});
