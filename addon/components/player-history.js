import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';
import layout from '../templates/components/player-history';

export default Component.extend({
  layout,
  dj:             service(),
  listenHistory:  service(),

  listens:        readOnly('listenHistory.items'),

  classNames:     ['player-history'],

  actions: {
    removeFromHistory(pk) {
      this.listenHistory.removeListenByStoryPk(pk);
    },
  },
});
