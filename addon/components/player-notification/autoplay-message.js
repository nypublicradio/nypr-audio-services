import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { gte, equal, and } from '@ember/object/computed';
import layout from '../../templates/components/player-notification/autoplay-message';

export default Component.extend({
  layout,
  tagName        : '',

  duration       : null,
  position       : null,
  audioType      : null,

  remaining      : computed('{duration,position}', function(){
    const difference = get(this, 'duration') - get(this, 'position');
    return Math.floor(difference / 1000);
  }),

  store          : service(),
  bumperState    : service(),

  streamEnabled  : computed('bumperState.autoplayPref', function(){
    const pref = get(this, 'bumperState.autoplayPref');
    return pref === 'default_stream';
  }),

  preferredStream: computed('bumperState.autoplaySlug', function(){
    const slug = get(this, 'bumperState.autoplaySlug');
    return get(this, 'store').peekRecord('stream', slug);
  }),

  timeRemaining  : gte('remaining', 0),
  bumperPlaying  : equal('audioType', 'bumper'),
  preSwitch      : and('bumperPlaying', 'timeRemaining'),
  didAnimate     : false,

  notificationMessage: computed('preSwitch', function() {
    if (get(this, 'preSwitch')) {
      return get(this, 'notificationMessagePreSwitch');
    }
    else {
      return get(this, 'notificationMessagePostSwitch');
    }
  }),

  notificationMessagePreSwitch: computed('streamEnabled', 'preferredStream.name', 'remaining', function() {
    let remaining = get(this, 'remaining');

    if (get(this, 'streamEnabled')) {
      let streamName = get(this, 'preferredStream.name');
      return `Your episode is over. In ${remaining} seconds, we'll tune you to ${streamName}.`;
    }
    else {
      return `Your episode is over. In ${remaining} seconds, your audio queue will begin to play.`;
    }
  }),

  notificationMessagePostSwitch: computed('streamEnabled', 'preferredStream.name', function() {
    if (get(this, 'streamEnabled')) {
      let streamName = get(this, 'preferredStream.name');
      return `We tuned you to ${streamName} after your episode ended.`;
    }
    else {
      return `We began playing your audio queue after your episode ended.`;
    }
  })

});
