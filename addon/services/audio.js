import Service from 'ember-service';
import service from 'ember-service/inject';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import computed, { readOnly, alias, or } from 'ember-computed';
import { bind } from 'ember-runloop';
import RSVP from 'rsvp';
import { classify as upperCamelize } from 'ember-string';
import Ember from 'ember';

const FIFTEEN_SECONDS = 1000 * 15;
const TWO_MINUTES     = 1000 * 60 * 2;

export default Service.extend({
  poll:             service(),
  metrics:          service(),
  store:            service(),
  session:          service(),
  discoverQueue:    service(),
  bumperState:      service(),
  listens:          service('listen-history'),
  queue:            service('listen-queue'),
  dataPipeline:      service(),

  hifi:             service(),
  isReady:          readOnly('hifi.isReady'),
  isPlaying:        readOnly('hifi.isPlaying'),
  isLoading:        readOnly('hifi.isLoading'),
  isMuted:          readOnly('hifi.isMuted'),
  duration:         readOnly('hifi.duration'),
  percentLoaded:    readOnly('hifi.percentLoaded'),
  position:         alias('hifi.position'),
  volume:           alias('hifi.volume'),

  // TODO: fix up currentStory/currentAudio interfaces for streams and on demands
  currentStory:         or('currentAudio.story', 'currentAudio'),

  currentAudio:     null,
  currentContext:   null,
  sessionPing:      TWO_MINUTES,

  currentId: computed('currentAudio.id', {
    get() {
      return get(this, 'currentAudio.id');
    },
    set(k, v) { return v; }
  }),

  playState: computed('isPlaying', 'isLoading', function() {
    if (get(this, 'isLoading')) {
      return 'is-loading';
    } else if (get(this, 'isPlaying')) {
      return 'is-playing';
    } else {
      return 'is-paused';
    }
  }),

  /* TRACK LOGIC --------------------------------------------------------------*/


  // playFromPk(id, context) {
  //   this._firstTimePlay();
  //
  //   let prevContext = get(this, 'currentContext');
  //   let newStoryPlaying = get(this, 'currentId') !== id;
  //
  //   console.log('play from PK');
  //   if (newStoryPlaying && this.get('isPlaying')) {
  //     console.log('sending interrupt listen action');
  //     this.sendListenAction(this.get('currentAudio'), 'interrupt');
  //   }
  //
  //   console.log(id);
  //
  //   // set here so UI can update before play resolves
  //   set(this, 'currentId', id);
  //
  //   let story;
  //   let fetchStory = get(this, 'store').findRecord('story', id)
  //
  //   let urlPromise = fetchStory.then(s => {
  //     story = s;
  //     // resetSegments & getCurrentSegment return the audio value if the
  //     // audio is not segmented
  //     return newStoryPlaying ? s.resetSegments() : s.getCurrentSegment();
  //   });
  //
  //   let analyticsData = fetchStory.then(s => {
  //     return s.forListenAction();
  //   });
  //
  //   return this.get('hifi').play(urlPromise, {metadata: {analyticsData}}).then(({sound, failures}) => {
  //     if (newStoryPlaying) {
  //       this._trackOnDemandPlay(story, context);
  //       // this would be a mixin that the button would call
  //
  //
  //     } else {
  //       this.sendListenAction(story, 'resume');
  //     }
  //
  //
  //     // TODO: extract into history service, listen for track changes and then adding
  //     // to history
  //
  //     // add to hifi: add data to the sound and retreive it later
  //     // play() -- add {story: storyId}
  //
  //     // -- listening service
  //     // -- on track change, get storyId of sound and log it
  //     // need: previous sound, current sound
  //
  //     // play story A -
  //     // - play event
  //     // play story B -
  //     // - interrupt story a
  //     // - play story b
  //
  //
  //     // independent of context, if this item is already the first item in your
  //     // listening history, don't bother adding it again
  //     if (get(this, 'listens').indexByStoryPk(id) !== 0) {
  //       this.addToHistory(story);
  //     }
  //
  //     // TODO: isCurrentSegment relies on `currentAudio` to compare incoming sound
  //     // so this needs to run before _setupAudio otherwise currentAudio and sound
  //     // will always match.
  //     let restartingSegment = this._isCurrentSegment(sound) && newStoryPlaying;
  //     this._setupAudio(story, context);
  //
  //     if (this._didJustPlayFrom('queue')) {
  //       this.removeFromQueue(id);
  //     }
  //
  //     // replay current audio from start when:
  //     // * starting it from the queue (while already playing from elsewhere)
  //     // * clicking a play button from earlier history (while already playing that story)
  //     // * clicking a segment (while playing the same segment from an episode)
  //     let restartingFromQueue = this._didJustPlayFrom('queue') && prevContext !== 'queue' && !newStoryPlaying;
  //     let restartingFromHistory = this._didJustPlayFrom('history') && get(this, 'isPlaying') && !newStoryPlaying;
  //
  //     if (restartingFromQueue || restartingFromHistory || restartingSegment) {
  //       this.setPosition(0);
  //     }
  //
  //     this._trackAllCodecFailures(failures, sound);
  //     return {sound, failures};
  //   })
  //   .catch(e => this._trackSoundFailure(e));
  // },


  /* DISCOVER QUEUE -----------------------------------------------------------*/

  discoverHasNext() {
    return this.get('discoverQueue').nextItem(this.get('currentId'));
  },

  playDiscoverQueue() {
    let nextTrack = this.get('discoverQueue').nextItem(this.get('currentId'));
    if (nextTrack) {
      this.play(get(nextTrack, 'id'), 'discover');
      return true;
    } else {
      return this._flushContext();
    }
  },

  /* EVENTS -------------------------------------------------------*/

  finishedTrack() {
    let currentAudio = get(this, 'currentAudio');
    let currentContext = get(this, 'currentContext');
    let autoPlayEnabled = get(this, 'bumperState.autoplayEnabled');

    if (get(currentAudio, 'segmentedAudio') && currentAudio.hasNextSegment()) {
      return this.playNextSegment();
    }
    else if (this._didJustPlayFrom('queue') && this.queueHasNext()) {
      this._trackFinished(currentAudio, currentContext);
      return this.playNextInQueue();
    }
    else if (this._didJustPlayFrom('discover') && this.discoverHasNext()) {
      this._trackFinished(currentAudio, currentContext);
      return this.playDiscoverQueue();
    }
    else if (autoPlayEnabled && !this._didJustPlayFrom('Continuous Play')) {
      this._trackFinished(currentAudio, currentContext);
      return this.playBumper();
    }
    else if (this._didJustPlayFrom('Continuous Play')) {
      return this.playAutoplay();
    } else {
      this._trackFinished(currentAudio, currentContext);
    }
    return null;
  },

  /* ANALYTICS AND LISTEN ACTIONS -------------------------------------------------------*/
  addToHistory(story) {
    this.get('listens').addListen(story);
  },
  
  sendListenAction(storyOrStream, type) {
    let data = {
      current_audio_position: this.get('position')
    };
    storyOrStream.forListenAction(data).then(d => {
      this.get('dataPipeline').reportListenAction(type, d);
    });
  },
  
  _trackPlayerEvent(options) {
    let metrics        = get(this, 'metrics');
    let {action, label, withRegion, region, withAnalytics} = options;
    let analyticsCode  = '';
    let story          = options.story || get(this, 'currentAudio');
    let category       = options.category || 'Persistent Player';

    // Ignore event if it's missing a region but should have one.
    // Assume it was fired from player internals and shouldn't be logged.
    if (withRegion && !region) { return; }
    region = withRegion ? region + ':' : '';
    if (withAnalytics) {
      analyticsCode = get(story, 'analyticsCode');
    }
    if (withRegion || withAnalytics) {
      label = `${region}${analyticsCode}`;
    }
    metrics.trackEvent('GoogleAnalytics', {category, action, label});
  },

  _trackPlayerEventForNpr(options) {
    let metrics = get(this, 'metrics');
    metrics.trackEvent('NprAnalytics', options);
  },

  _trackAllCodecFailures(failures, sound) {
    if (failures && failures.length) {
      failures.forEach(failed => this._trackCodecFailure(failed, sound));
    }
  },

  _trackCodecFailure({connectionName, error, url}, sound) {
    this._trackPlayerEvent({
      action: `Codec Failure | ${connectionName}`,
      label: `reason: ${error} | bad url: ${url} | ${sound ? `good url: ${get(sound, 'url')}` : 'no successful url'}`
    });
  },

  _trackSoundFailure({message, failures}) {
    this.set('hasErrors', true);
    this._trackPlayerEvent({
      action: 'Sound Error',
      label: message
    });
    if (failures && failures.length) {
      failures.forEach(failed => this._trackCodecFailure(failed));
    }
  },

  _trackPing() {
    get(this, 'metrics').trackEvent('GoogleAnalytics', {
      category: 'Persistent Player',
      action: '2 Minute Ping',
      value: get(this, 'isPlaying') ? 1 : 0
    });
  },

  _trackOnDemandPlay(story, context) {
    let action = this.get('position') === 0 ? 'start' : 'resume';
    this.sendListenAction(story, action);
    this._trackPlayerEvent({
      action: `Played Story "${story.get('title')}"`,
      withRegion: true,
      region: upperCamelize(context),
      withAnalytics: true,
      story
    });
    this._trackPlayerEventForNpr({
      category: 'Engagement',
      action: 'On_demand_audio_play',
      label: get(story, 'audio')
    });

    if (context === 'queue' || context === 'history') {
      this._trackPlayerEvent({
        action: 'Played Story from Queue',
        label: story.get('title'),
        story
      });
    }
  },

  _trackStreamPlay(stream, context, prevAudio) {
    let wasStream = prevAudio && get(prevAudio, 'audioType') === 'livestream';
    let prevStreamName = prevAudio && get(prevAudio, 'name');
    let streamName = get(stream, 'name');

    let label = streamName;
    if (context === 'nav' || context === 'Continuous Play') {
      label += `|${this._formatContext(context)}`;
    }
    this._trackPlayerEvent({
      action: 'Launched Stream',
      label,
    });
    this.sendListenAction(stream, 'start');

    this._trackPlayerEventForNpr({
      category: 'Engagement',
      action: 'Stream_Play',
      label: `Streaming_${streamName}`
    });

    if (wasStream) {
      this._trackPlayerEvent({
        action: 'Switched Stream to Stream',
        label: `from ${prevStreamName} to ${streamName}`
      });

      this._trackPlayerEventForNpr({
        category: 'Engagement',
        action: 'Stream_Change',
        label: `Streaming_${streamName}`
      });
    }
  },

  _trackBumperPlay() {
    this._trackPlayerEvent({
      action: 'Continuous Play Notification',
      label: 'Audio Bumper',
    });
  },
  
  _trackAutoplayQueue() {
    this._trackPlayerEvent({
      action: 'Launched Queue',
      label: 'Continuous Play'
    });
  },

  _trackPause(storyOrStream, context) {
    let type = storyOrStream && get(storyOrStream, 'audioType');
    if (type === 'bumper') {
      let bumperSetting = get(this, 'bumperState.autoplayChoice');
      this._trackPlayerEvent({
        action: 'Paused Bumper',
        label: `${bumperSetting}|Continuous Play`
      });
    } else {
      this._trackPlayerEvent({
        story: storyOrStream,
        action: 'Pause',
        withRegion: true,
        region: this._formatContext(context),
      });
    }

    if (type === 'livestream') {
      this._trackPlayerEventForNpr({
        category: 'Engagement',
        action: 'Stream_Pause',
        label: `Streaming_${get(storyOrStream, 'name')}`
      });
    } else if (type === 'on_demand') {
      this._trackPlayerEventForNpr({
        category: 'Engagement',
        action: 'On_demand_audio_pause',
        label: get(storyOrStream, 'audio')
      });
    }

    if (storyOrStream) {
      this.sendListenAction(storyOrStream, 'pause');
    }
  },

  _trackFinished(story, context) {
    this._trackPlayerEvent({
      story,
      action: 'Finished Story',
      withRegion: true,
      region: upperCamelize(context),
    });

    this.sendListenAction(story, 'finish');
  },
  
  // TODO: would like to move this and the rest of the above
  // into an audio analytics service
  trackStreamData() {
    let stream = this.get('currentAudio');
    let showTitle = get(stream, 'currentShow.show_title') || get(stream, 'currentShow.title');
    let streamName = get(stream, 'name');
    
    RSVP.Promise.resolve(get(stream, 'story')).then(story => {
      let storyTitle = story ? get(story, 'title') : 'no title';
      
      this._trackPlayerEvent({
        action: `Streamed Show "${showTitle}" on ${streamName}`,
        label: storyTitle
      });
      
      if (story) {
        this._trackPlayerEvent({
          action: `Streamed Story "${storyTitle}" on "${streamName}"`,
          withAnalytics: true,
          story
        });
      }
    });
  },

  /* HELPERS -------------------------------------------------------*/

  _isCurrentSegment(sound) {
    let prevStory = get(this, 'currentAudio');
    if (!prevStory) {
      return false;
    }
    let isOnDemand = prevStory.get('audioType') !== 'livestream';
    let isSegmented = get(prevStory, 'segmentedAudio');
    // put `getCurrentSegment` behind the and gates b/c sometimes prevStory is a stream model, which doesn't have `getCurrentSegment`
    if (isOnDemand && isSegmented && prevStory.getCurrentSegment() === sound.get('url')) {
      return true;
    } else {
      return false;
    }
  },

});
