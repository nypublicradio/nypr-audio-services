import Component from 'ember-component';
import get from 'ember-metal/get';
import computed, { readOnly } from 'ember-computed';
import { classify as upperCamelize } from 'ember-string';
import layout from '../templates/components/queue-listitem';

export default Component.extend({
  layout,
  attributeBindings:  ['data-id'],
  'data-id':          readOnly('dataId'),
  region: computed('playContext', function() {
    let playContext = get(this, 'playContext');
    if (playContext !== undefined) {
      return upperCamelize(playContext);
    }
  }),
  state: computed('isCurrent', 'playState', function() {
    return this.get('isCurrent') ? this.get('playState') : null;
  })
});
