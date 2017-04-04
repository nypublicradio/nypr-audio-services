import Ember from 'ember';
import get from 'ember-metal/get';
import layout from '../templates/components/player-notification';

export default Ember.Component.extend({
  layout,
  didAnimate: false,
  classNames: ['player-notification', 'js-player-notification'],
  actions   : {
    dismiss() {
      get(this, 'onDismiss')();
    }
  }
});
