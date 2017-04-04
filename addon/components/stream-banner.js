import Component from 'ember-component';
import { readOnly } from 'ember-computed';
import layout from '../templates/components/stream-banner';

export default Component.extend({
  classNames: ['stream-banner'],
  layout,

  activeStream: computed.reads('streams.firstObject')
});
