import Component from '@ember/component';
import { inject as service } from '@ember/service';
import {
  reads,
  or,
  and,
  not,
  equal
} from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { songMetadata } from 'nypr-audio-services/helpers/song-metadata';
import layout from '../templates/components/nypr-player-integration';

/* A conglomeration of logic that was baked into the persistent player,
isolated and removed to this component. This component basically translates
our audio logic into dumb arguments for the player to display */

export default Component.extend({
  layout,

  hifi                 : service(),
  dj                   : service(),
  listenAnalytics      : service(),

  /* To determine whether or not to reveal the notification bar. The messaging
    is handled by the autoplay-message component */
  bumper               : service('bumper-state'),
  revealNotificationBar: and('didNotDismiss', 'bumper.revealNotificationBar'),
  didDimiss            : false,
  didNotDismiss        : not('didDismiss'),

  currentSound         : reads('dj.currentSound'),
  currentAudio         : reads('dj.currentContentModel'),
  currentAudioType     : reads('dj.currentContentType'),
  currentAudioId       : reads('dj.currentContentId'),

  currentTitle         : or('currentAudio.title', '_currentTitleFromShow'),
  _currentTitleFromShow: computed('currentAudio', function() {
    return `${this.get('currentAudio.currentShow.showTitle')} on ${this.get('currentAudio.name')}`;
  }),

  story                : or('currentAudio.currentStory', 'currentAudio'),
  storyTitle           : or('currentAudio.title', 'currentAudio.currentShow.episodeTitle'),
  storyUrl             : or('currentAudio.url', 'currentAudio.currentShow.episodeUrl'),

  show                 : reads('currentAudio.headers.brand'),
  showTitle            : or('show.title', 'currentAudio.currentShow.showTitle'),
  showUrl              : or('show.url', 'currentAudio.currentShow.showUrl'),

  catalogEntry         : reads('currentAudio.currentPlaylistItem.catalogEntry'),
  songDetails          : computed('catalogEntry', function() {
    if (this.get('catalogEntry')) {
      return songMetadata([get(this, 'catalogEntry')]);
    }
  }),

  isStream             : equal('currentAudio.audioType', 'livestream'),
  streamName           : reads('currentAudio.name'),
  streamScheduleUrl    : reads('currentAudio.scheduleUrl'),
  streamPlaylistUrl    : computed('currentAudio.playlistUrl', function() {
    if (get(this,'currentAudio.playlistUrl')) {
      return `/playlist-daily/?scheduleStation=${get(this, 'currentAudio.id')}`;
    }
  }),

  autofocus            : true,

  image                : reads('currentAudio.imageMain.url'),
  fallbackImage        : reads('currentAudio.headers.brand.logoImage.url'),
  defaultImageUrl      : '/assets/img/bg/player-background.png',
  backdropImageUrl     : or('image', 'fallbackImage', 'defaultImageUrl'),

  playingAudioType     : 'on_demand', //bumper, livestream, on_demand

  queueLength          : 0,
  showQueue            : false,

  actions: {
    onPlay() {
      // handled by listen analytics
    },
    onPause() {
      // handled by listen analytics
    },
    onFastForward() {
      // handled by listen analytics
    },
    onRewind() {
      // handled by listen analytics
    },
    onSetPosition() {
      // handled by listen analytics
    }
  }
});
