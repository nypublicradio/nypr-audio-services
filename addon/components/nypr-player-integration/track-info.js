import Ember from 'ember';
import layout from '../../templates/components/nypr-player-integration/track-info';
import diffAttrs from 'ember-diff-attrs';

export default Ember.Component.extend({
  layout,
  tagName       : '',

  showTitle     : null,
  showUrl       : null,

  storyTitle    : null,
  storyUrl      : null,

  audioId       : null,
  songDetails   : null,

  didReceiveAttrs: diffAttrs('showTitle', function(changedAttrs, ...args) {
    this._super(...args);
    let isInitialRender = changedAttrs === null;

    let showTitleChanged = changedAttrs
      && changedAttrs.showTitle
      && changedAttrs.showTitle[0] !== changedAttrs.showTitle[1];

    if (isInitialRender || showTitleChanged) {
     if (this.attrs.titleDidChange) {
       this.attrs.titleDidChange();
     }
    }
  })
});
