import RSVP from 'rsvp';
import PromiseRace from 'ember-hifi/utils/promise-race';
import { assert } from '@ember/debug';
import { get, set } from '@ember/object';
import { getOwner } from '@ember/application';
import { dasherize } from '@ember/string'
import Service from '@ember/service';
import Evented from '@ember/object/evented';
import { A } from '@ember/array';

export default Service.extend(Evented, {
  init() {
    this.set('queues', {});
    this._super(...arguments);
  },

  /* eslint-disable */
  debug(message) {
    // TODO: set up a better nypr-audio-services debugger.
    // console.log(message);
  },
  /* eslint-enable */

  addAction(thing, eventName, info, callback) {
    if (typeof(thing) === 'string') {
      thing = getOwner(this).lookup(thing);
    }

    assert("passed in object is not Ember.Evented", (thing && thing.on && thing.trigger));

    let queueName   = this._queueName(thing, eventName);
    let queues      = get(this, 'queues');
    let queue       = get(queues, queueName) || [];
    queue.push(Object.assign(info, {callback: callback}));

    if (!get(queues, queueName)) {
      let _this = this;
      thing.on(eventName, function(data) { _this._runQueue(queueName, data); });
    }

    set(queues, queueName, queue);
    return {queueName};
  },

  _relayEvent(eventName, sound) {
    this.trigger(eventName, sound);
  },

  afterRun(thing, eventName, callback) {
    let queueName  = this._queueName(thing, eventName);
    this.on(`after:${queueName}`, callback);
  },

  _queueName(thing, eventName) {
    let objectName = dasherize(`${thing}`);
    return `${objectName}:${eventName}`;
  },

  _queueExists(queueName) {
    return !!get(this, `queues.${queueName}`);
  },

  _runQueue(queueName, eventData = {}) {
    let queues = get(this, 'queues');
    let orderedQueue = A(get(queues, queueName) || []).sortBy('priority').slice(); // copy, bro

    this.debug(`[action-queue] Trying action queue of ${orderedQueue.length}`);
    let _this = this;
    let actionIndex = 0;
    let runPromise = new RSVP.Promise((resolve) => {
      PromiseRace.start(orderedQueue, function(nextAction, returnSuccess, markFailure) {

        try {
          return RSVP.Promise.resolve(nextAction.callback(eventData)).then(result => {
            if (result) {
              _this.debug(`[action-queue] [✓] ${nextAction.name} @priority ${nextAction.priority}`);
              returnSuccess(result);
            }
            else {
              _this.debug(`[action-queue] [x] ${nextAction.name} @priority ${nextAction.priority}`);
              markFailure(nextAction);
            }
            actionIndex = actionIndex + 1;
          }).catch(e => {
            _this.debug(`[action-queue] [!] ${nextAction.name} @priority ${nextAction.priority} ${e}`);
            markFailure(e);
          });
        }
        catch(e) {
          _this.debug(`[action-queue] [!] ${nextAction.name} @priority ${nextAction.priority} ${e}`);
        }
      })
      .then((results) => resolve(results))
      .catch((results) => resolve(results));
    });

    runPromise.then((results) => {
      orderedQueue.slice(actionIndex).forEach(nextAction => {
        this.debug(`[action-queue] [ ] ${nextAction.name} @priority ${nextAction.priority}`);
      });
      this.trigger(`after:${queueName}`, results);
    });

    return runPromise;
  }
});
