import Ember from 'ember';
import layout from '../../templates/components/nypr-player-integration/track-info';
export default Ember.Component.extend({
  layout,
  tagName       : '',

  showTitle     : null,
  showUrl       : null,

  storyTitle    : null,
  storyUrl      : null,

  audioId       : null,
  songDetails   : null,

  didReceiveAttrs({oldAttrs, newAttrs}) {
    this._super(...arguments);
    if (!this.get('isStream')) { return; }
    if (oldAttrs && oldAttrs.showTitle.value === newAttrs.showTitle.value) { return; }

    if (this.attrs.trackStreamData) {
      this.attrs.trackStreamData();
    }
  }
});
