import Component from 'ember-component';
import { reads } from 'ember-computed';
import layout from '../templates/components/stream-banner';

export default Component.extend({
  classNames: ['stream-banner'],
  layout,

  activeStream: reads('streams.firstObject')
});
