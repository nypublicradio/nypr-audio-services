import Component from 'ember-component';
import service from 'ember-service/inject';
import { readOnly } from 'ember-computed';
import layout from '../templates/components/player-history';

export default Component.extend({
  layout,
  dj:             service(),
  listenHistory:  service(),

  listens:        readOnly('listenHistory.items'),

  classNames:     ['player-history'],

  actions: {
    removeFromHistory(pk) {
      this.get('listenHistory').removeListenByStoryPk(pk);
    },
  },
});
