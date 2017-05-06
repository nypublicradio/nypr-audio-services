import Ember from 'ember';
import service from 'ember-service/inject';
import computed, { reads, or, and, not, equal } from 'ember-computed';
import get from 'ember-metal/get';
import { songMetadata } from 'nypr-audio-services/helpers/song-metadata';
import layout from '../templates/components/nypr-player-integration';

/* A conglomeration of logic that was baked into the persistent player,
isolated and removed to this component. This component basically translates
our audio logic into dumb arguments for the player to display */

export default Ember.Component.extend({
  layout,
  hifi                 : service(),
  listenAnalytics      : service(),
  session              : service(),
  store                : service(),

  /* To determine whether or not to reveal the notification bar. The messaging
    is handled by the autoplay-message component */
  bumper               : service('bumper-state'),
  revealNotificationBar: and('didNotDismiss', 'bumper.revealNotificationBar'),
  didDimiss            : false,
  didNotDismiss        : not('didDismiss'),

  currentSound         : reads('hifi.currentSound'),
  currentAudio         : reads('currentSound.metadata.contentModel'),
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
      return `/streams/${get(this, 'currentAudio.id')}`;
    }
  }),

  image                : reads('currentAudio.imageMain.url'),
  fallbackImage        : reads('currentAudio.headers.brand.logoImage.url'),
  defaultImageUrl      : '/assets/img/bg/player-background.png',
  backdropImageUrl     : or('image', 'fallbackImage', 'defaultImageUrl'),

  playingAudioType     : 'on_demand', //bumper, livestream, on_demand

  queueLength          : 0,
  showQueue            : false,

  actions: {
    onDismissNotification() {
      this.set('didDismiss', true);
      get(this, 'listenAnalytics').trackDismissAutoplayNotification();
    },
    onPlay() {
      // handled by listen analytics
    },
    onPause() {
      // handled by listen analytics
    },
    onFastForward() {
      get(this, 'listenAnalytics').trackFastForward(get(this, 'currentSound'));
    },
    onRewind() {
      get(this, 'listenAnalytics').trackRewind(get(this, 'currentSound'));
    },
    onSetPosition() {
      get(this, 'listenAnalytics').trackPositionChange(get(this, 'currentSound'));
    }
  }
});