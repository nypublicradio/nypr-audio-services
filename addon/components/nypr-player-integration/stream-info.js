import Ember from 'ember';
import layout from '../../templates/components/nypr-player-integration/stream-info';

export default Ember.Component.extend({
  layout,
  tagName                : '',
  streamScheduleUrl      : null,
  streamPlaylistUrl      : null,
  streamName             : null,
});
