import Component from 'ember-component';
import computed, { readOnly } from 'ember-computed';
import layout from '../templates/components/queue-listitem';

export default Component.extend({
  layout,
  attributeBindings:  ['data-id'],
  'data-id':          readOnly('dataId'),
  state:              computed('isCurrent', 'playState', function() {
    return this.get('isCurrent') ? this.get('playState') : null;
  })
});
