import Component from '@ember/component';
import layout from '../../templates/components/nypr-player-integration/stream-info';

export default Component.extend({
  layout,
  tagName                : '',
  streamScheduleUrl      : null,
  streamPlaylistUrl      : null,
  streamName             : null,
});
