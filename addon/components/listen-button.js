import { A } from '@ember/array';
import { getWithDefault } from '@ember/object';
import Component from '@ember/component';
import {
  readOnly,
  not,
  match,
  and
} from '@ember/object/computed';
import { get, set, getProperties, computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { schedule } from '@ember/runloop';
import { inject as service } from '@ember/service';
import layout from '../templates/components/listen-button';
import diffAttrs from 'ember-diff-attrs';

const STATES = {
  PLAYING:  'is-playing',
  PAUSED:   'is-paused',
  LOADING:  'is-loading'
};

const EXPANDABLE_BUTTONS = /(blue|gray|red)-(minion|boss)|white-hollow-block/;

export default Component.extend({
  layout,
  dj:                   service(),
  disabled:             not('dj.isReady'),

  isCurrentSound:       computed('dj.currentContentId', 'itemPK', function() {
    return get(this, 'itemPK') === get(this, 'dj.currentContentId');
  }),

  isPlaying:            and('dj.isPlaying', 'isCurrentSound'),
  _hifiPaused:          not('dj.isPlaying'),
  isPaused:             and('_hifiPaused', 'isCurrentSound'),
  isLoading:            computed('isCurrentSound', 'buttonLoading', 'dj.{currentSound.isLoading,currentlyLoadingIds}', function() {
    let currentlyLoadingIds = A(getWithDefault(this, 'dj.currentlyLoadingIds', []));

    return get(this, 'buttonLoading') ||
           currentlyLoadingIds.includes(String(get(this, 'itemPK'))) ||
           (get(this, 'isCurrentSound') && get(this, 'dj.currentSound.isLoading'));
  }),

  isExpandable:         match('type', EXPANDABLE_BUTTONS),
  'aria-label':         readOnly('title'),
  'data-test-selector': 'listen-button',

  tagName:              'button',
  classNames:           ['listen-button', 'gtm__click-tracking'],
  classNameBindings:    ['isHovering', 'type', 'isCurrentSound', 'isErrored', 'playState', 'isCurrentSound', 'isLive'],
  attributeBindings:    ['aria-label', 'title', 'disabled', 'data-test-selector', 'style', 'data-action', 'data-label'],

  // override in the template for streams and other action types
  'data-action': computed('playContext', function() {
    return `Clicked Play/Pause On Demand: ${this.get('playContext')}`;
  }),
  'data-label': computed('itemTitle', 'itemShow', function() {
    return `${this.get('itemTitle')} | ${this.get('itemShow')}`
  }),

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
      return STATES.PAUSED; // consider it paused until we measure so we get full width of natural state
    }

    if (get(this, 'isLoading')) {
      return STATES.LOADING;
    }
    else if (get(this, 'isPlaying')) {
      return STATES.PLAYING;
    }
    else if (get(this, 'isPaused')){
      return STATES.PAUSED;
    } else {
      return STATES.PAUSED; // JIC
    }
  }),

  width: computed('playState', 'contentWidth', 'isExpandable', function() {
    if (typeof FastBoot !== 'undefined' || !this.element || !get(this, 'isExpandable')) {
      return false;
    }

    let state = get(this, 'playState');
    if (state === STATES.PLAYING || state === STATES.LOADING) {
      return Math.ceil(this.element.getBoundingClientRect().height); // make it a circle, set width = height
    } else {
      return get(this, 'contentWidth');
    }
  }),

  didUpdateAttrs: diffAttrs('isLive', function(changedAttrs, ...args) {
    this._super(...args);
    let updateSize = this.get('isLive') || changedAttrs && changedAttrs.isLive && changedAttrs.isLive[0];

    if (updateSize) {
      schedule('afterRender', this, () => {
        let contentWidth = this.element.scrollWidth + parseInt(this.$().css('paddingLeft'), 10) + parseInt(this.$().css('paddingRight'), 10);
        set(this, 'contentWidth', contentWidth);
      });
    }
  }),

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
    let playContext     = get(this, 'playContext');
    let itemPk          = get(this, 'itemPK');
    let metadata        = {fromClick: true};
    set(this, 'buttonLoading', true);
    get(this,'dj').play(itemPk, {playContext, metadata}).then(() => {
      set(this, 'buttonLoading', false);
    }).catch(() => {
      set(this, 'buttonLoading', false);
      set(this, 'isErrored', true);
    });
  },

  click() {
    let dj = get(this, 'dj');
    if (get(this, 'isPlaying')) {
      dj.pause();
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
