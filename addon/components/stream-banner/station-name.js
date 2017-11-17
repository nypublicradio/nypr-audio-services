import Component from '@ember/component';
import layout from '../../templates/components/stream-banner/station-name';

export default Component.extend({
  layout,
  tagName: 'span',
  classNames: ['stream-banner__active-stream']
});
