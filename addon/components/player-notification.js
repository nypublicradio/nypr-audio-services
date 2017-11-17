import Component from '@ember/component';
import { get } from '@ember/object';
import layout from '../templates/components/player-notification';

export default Component.extend({
  layout,
  didAnimate: false,
  classNames: ['player-notification', 'js-player-notification'],
  actions   : {
    dismiss() {
      get(this, 'onDismiss')();
    }
  }
});
