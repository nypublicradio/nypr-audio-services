import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../../templates/components/listen-button/ui';

const ICON_SUFFIXES = {
  'red-hollow':  '-circle',
  'blue-hollow':  '-circle',
  'white-hollow': '-circle',
  'white-hollow-small': '-hollow-small',
  'red-hollow-small':   '-hollow-small'
};

export default Component.extend({
  layout,
  classNames: ['listen-ui'],
  iconSuffix: computed('type', function() {
    return ICON_SUFFIXES[this.type] || '';
  }),
  playIcon: computed('iconSuffix', function() {
    return `play${this.iconSuffix}`;
  }),
  pauseIcon: computed('iconSuffix', function() {
    return `pause${this.iconSuffix}`;
  })
});
