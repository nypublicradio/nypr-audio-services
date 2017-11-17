import Component from '@ember/component';
import { readOnly } from '@ember/object/computed';
import { computed } from '@ember/object';
import layout from '../templates/components/queue-listitem';

export default Component.extend({
  layout,
  attributeBindings:  ['data-id'],
  'data-id':          readOnly('dataId'),
  state:              computed('isCurrent', 'playState', function() {
    return this.get('isCurrent') ? this.get('playState') : null;
  })
});
