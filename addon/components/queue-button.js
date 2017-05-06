import { animate } from 'liquid-fire';
import service from 'ember-service/inject';
import Component from 'ember-component';
import computed, { readOnly, not } from 'ember-computed';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import layout from '../templates/components/queue-button';

export default Component.extend({
  layout,
  queue:              service('listen-queue'),
  audio:              service(),
  disabled:           not('audio.isReady'),
  'aria-label':       readOnly('title'),

  tagName:            'button',
  classNames:         ['queue-button'],
  classNameBindings:  ['type', 'isHovering'],
  attributeBindings:  ['aria-label', 'title', 'disabled', 'data-state'],

  inQueue: computed('queue.items.[]', {
    get() {
      let queue = this.getWithDefault('queue.items', []);
      let inQueue = queue.findBy('id', get(this, 'itemPK'));
      return inQueue ? true : false;
    },
    set(k, v) { return v; }
  }),
  'data-state': computed('inQueue', function() {
    return get(this, 'inQueue') ? 'in-queue' : null;
  }),

  title: computed('inQueue', function() {
    if (get(this, 'inQueue')) {
      return `Remove ${get(this, 'itemTitle')} from Your Queue`;
    } else {
      return `Add ${get(this, 'itemTitle')} to Your Queue`;
    }
  }),

  click() {
    if (get(this, 'isErrored')) {
      return;
    }
    let newWidth;
    let oldWidth;

    if (get(this, 'inQueue')) {
      get(this, 'queue').removeFromQueueById(get(this, 'itemPK'));
      newWidth = 98;
      oldWidth = 106;
    } else {
      // TODO: addToQueue is potentially async, so we update UI synchronously,
      // but there must be a better/embery way
      set(this, 'inQueue', true);
      get(this, 'queue').addToQueueById(get(this, 'itemPK'), get(this, 'region'));
      newWidth = 106;
      oldWidth = 98;
    }
    if (get(this, 'type') !== 'small-blue') {
      animate(this.$(), {
        width: [newWidth, oldWidth]
      }, {
        easing: [0.17,0.89,0.39,1.25],
        duration: 200
      });
    }
  },
  mouseLeave() {
    this.set('isHovering', false);
  },
  mouseEnter() {
    this.set('isHovering', true);
  }
});