import Component from '@ember/component';
import layout from '../../templates/components/nypr-player-integration/track-info';
import diffAttrs from 'ember-diff-attrs';

export default Component.extend({
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
    let isBumper = this.get('currentSound.metadata.playContext') === 'audio-bumper';

    let showTitleChanged = changedAttrs
      && changedAttrs.showTitle
      && changedAttrs.showTitle[0] !== changedAttrs.showTitle[1];

    if (this.get('currentAudio') && isInitialRender || showTitleChanged && !isBumper) {
     if (this.get('titleDidChange')) {
       this.get('titleDidChange')();
     }
    }
  })
});
