import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import layout from '../templates/components/clear-history';

export default Component.extend({
  layout,
  listens:            service('listen-history'),

  isConfirming:       false,

  classNames:         ['clearhistory'],
  classNameBindings:  ['isConfirming'],

  actions: {
    showConfirmation() {
      set(this, 'isConfirming', true);
    },
    cancel() {
      set(this, 'isConfirming', false);
    },
    clearHistory() {
      get(this, 'listens').clearHistory();
      set(this, 'isConfirming', false);
    }
  }
});
