import Component from 'ember-component';
import computed, { readOnly, not, equal, match } from 'ember-computed';
import get, { getProperties } from 'ember-metal/get';
import set from 'ember-metal/set';
import { htmlSafe } from 'ember-string';
import { schedule } from 'ember-runloop';
import layout from '../templates/components/listen-button';
import service from 'ember-service/inject';

const STATES = {
  PLAYING:  'is-playing',
  PAUSED:   'is-paused',
  LOADING:  'is-loading'
};

export default Component.extend({
  layout,
  hifi:                 service(),
  dj:                   service(),
  store:                service(),

  disabled:             not('hifi.isReady'),

  isCurrentSound:      computed('hifi.currentSound.metadata.contentId', 'itemPK', function() {
    return get(this, 'itemPK') === get(this, 'hifi.currentSound.metadata.contentId');
  }),

  currentSound:         computed.readOnly('hifi.currentSound'),

  _hifiPaused:          computed.not('hifi.isPlaying'),
  isPlaying:            computed.and('hifi.isPlaying', 'isCurrentSound'),
  isPaused:             computed.and('_hifiPaused', 'isCurrentSound'),
  isLoading:            computed('buttonLoading', 'currentSound.isLoading', function() {
    if (get(this, 'isCurrentSound')) {
      return (get(this, 'buttonLoading') || get(this, 'currentSound.isLoading'));
    }

    return (get(this, 'buttonLoading'));
  }),

  isExpandable:         match('type', /(blue|gray|red)-(minion|boss)/),
  'aria-label':         readOnly('title'),
  'data-test-selector': 'listen-button',

  tagName:              'button',
  classNames:           ['listen-button'],
  classNameBindings:    ['isHovering', 'type', 'isCurrentSound', 'isErrored', 'playState'],
  attributeBindings:    ['aria-label', 'title', 'disabled', 'data-test-selector', 'style'],

  title: computed('itemTitle', function() {
    return `Listen to ${get(this, 'itemTitle')}`;
  }),

  style: computed('width', function() {
    let width = get(this, 'width');
    return width ? htmlSafe(`width: ${width}px;`) : null;
  }),

  playState: computed('isPlaying', 'isPaused', 'isLoading', 'wasMeasured', 'isExpandable', function() {
    let { wasMeasured, isExpandable } = getProperties(this, 'wasMeasured', 'isExpandable');
    if (isExpandable && !wasMeasured) {
      return; // consider it stateless until we measure so we get full width of paused state
    }

    if (get(this, 'isPlaying')) {
      return STATES.PLAYING;
    }
    else if (get(this, 'isPaused')){
      return STATES.PAUSED;
    }
    else if (get(this, 'isLoading')) {
      return STATES.LOADING;
    }
  }),

  width: computed('playState', 'contentWidth', function() {
    if (!this.element || !get(this, 'isExpandable')) {
      return false;
    }

    let state = get(this, 'playState');
    if (state === STATES.PLAYING || state === STATES.LOADING) {
      return Math.ceil(this.element.getBoundingClientRect().height); // make it a circle, set width = height
    } else {
      return get(this, 'contentWidth');
    }
  }),

  didUpdateAttrs({ oldAttrs, newAttrs }) {
    if (newAttrs.isLive && newAttrs.isLive.value) {
      schedule('afterRender', this, () => {
        let contentWidth = this.element.scrollWidth + parseInt(this.$().css('paddingLeft'), 10) + parseInt(this.$().css('paddingRight'), 10);
        set(this, 'contentWidth', contentWidth);
      });
    }
  },

  didRender() {
    let { wasMeasured, isExpandable } = getProperties(this, 'wasMeasured', 'isExpandable');
    if (isExpandable && !wasMeasured) {
      schedule('afterRender', this, () => {
        let contentWidth = Math.ceil(this.element.getBoundingClientRect().width);
        set(this, 'wasMeasured', true);
        set(this, 'contentWidth', contentWidth);
      });
    }
  },

  play() {
    let playContext     = get(this, 'playContext') || get(this, 'region');
    let itemPk          = get(this, 'itemPK');
    set(this, 'buttonLoading', true);
    get(this,'dj').play(itemPk, {playContext}).then(() => {
      set(this, 'buttonLoading', false);
    }).catch(() => {
      set(this, 'buttonLoading', false);
      set(this, 'isErrored', true);
    });
  },

  click() {
    // if (get(this, 'isErrored')) {
    //   return;
    // }

    let hifi = get(this, 'hifi');
    if (get(this, 'isPlaying')) {
      hifi.pause();
    } else {
      this.play();
    }
  },

  mouseLeave() {
    set(this, 'isHovering', false);
  },
  mouseEnter() {
    set(this, 'isHovering', true);
  },
});
