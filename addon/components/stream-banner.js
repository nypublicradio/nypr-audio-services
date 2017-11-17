import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import layout from '../templates/components/stream-banner';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  classNames: ['stream-banner'],
  layout,
  
  activeStream: reads('streams.firstObject'),
  style: computed('background', function() {
    return htmlSafe(`background-image: url(${this.get('background')});`);
  })
});
