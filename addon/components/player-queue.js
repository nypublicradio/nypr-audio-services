import { set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import layout from '../templates/components/player-queue';

export default Component.extend({
  layout,
  dj:                 service(),
  queue:              service('listen-queue'),
  isSortingEnabled:   true,
  playingFromQueue:   reads('queue.isPlayingFromQueue'),

  classNames:         ['player-queue'],

  sortHandle: computed('isSortingEnabled', function() {
    if (this.isSortingEnabled) {
      return '.queueitem';
    }
    return '.dontdrag';
  }),

  didInsertElement() {
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
      this.queue.removeFromQueueById(id);
    },
    reorderItems(reorderedItems/*, droppedItem*/) {
      this.queue.reset(reorderedItems);
    },
  },
});
