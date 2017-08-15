import Component from 'ember-component';
import service from 'ember-service/inject';
import { readOnly } from 'ember-computed';
import layout from '../templates/components/player-history';

export default Component.extend({
  layout,
  dj:             service(),
  listenHistory:  service(),
  metrics:        service(),

  listens:        readOnly('listenHistory.items'),

  classNames:     ['player-history'],

  actions: {
    removeFromHistory(pk) {
      this.get('listenHistory').removeListenByStoryPk(pk);
    },
    trackShare(data, sharedFrom) {
      let metrics = this.get('metrics');

      let story = data.story;
      let {analyticsCode, type, shareText} = story.get('shareMetadata');

      metrics.trackEvent('GoogleAnalytics', {
        category: 'Persistent Player',
        action: `Shared Story "${shareText}"`,
        label: `History|${analyticsCode}|${type}|${sharedFrom}`,
      });
    }
  },
});
