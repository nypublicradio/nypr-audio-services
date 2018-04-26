import Component from '@ember/component';
import layout from '../templates/components/player-notification';

export default Component.extend({
  layout,
  didAnimate: false,
  classNames: ['player-notification', 'js-player-notification'],
});
