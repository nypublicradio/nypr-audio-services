import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import layout from '../templates/components/player-queue';

export default Component.extend({
  layout,
  dj:                 service(),
  queue:              service('listen-queue'),
  metrics:            service(),
  isSortingEnabled:   true,
  playingFromQueue:   reads('queue.isPlayingFromQueue'),

  classNames:         ['player-queue'],

  sortHandle: computed('isSortingEnabled', function() {
    if (get(this, 'isSortingEnabled')) {
      return '.queueitem';
    }
    return '.dontdrag';
  }),

  didReceiveAttrs() {
    // if this is a touchscreen, disable dragging until we
    // implement hold-to-drag, because dragging blocks
    // scrolling on touch screens.

    /*globals DocumentTouch*/
    let isTouchScreen = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
    if (isTouchScreen) {
      set(this, 'isSortingEnabled', false);
    }
  },

  actions: {
    removeFromQueue(id) {
      get(this, 'queue').removeFromQueueById(id);
    },
    reorderItems(reorderedItems/*, droppedItem*/) {
      get(this, 'queue').reset(reorderedItems);
    },
    trackShare(data, sharedFrom) {
      let metrics = this.get('metrics');

      let story = data.story;
      let {analyticsCode, type, shareText} = story.get('shareMetadata');

      metrics.trackEvent('GoogleAnalytics', {
        category: 'Persistent Player',
        action: `Shared Story "${shareText}"`,
        label: `Queue|${analyticsCode}|${type}|${sharedFrom}`,
      });
    }
  },
});
