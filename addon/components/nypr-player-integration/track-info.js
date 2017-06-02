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

     if(changedAttrs && changedAttrs.showTitle) {
       let oldTitle = changedAttrs.showTitle[0],
           newTitle = changedAttrs.showTitle[1];
       if (newTitle === oldTitle) { return; }

       if (this.attrs.trackStreamData) {
         this.attrs.trackStreamData();
       }
     }
   })
});
