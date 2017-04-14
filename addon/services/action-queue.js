import Ember from 'ember';
import RSVP from 'rsvp';
import PromiseRace from 'ember-hifi/utils/promise-race';
const { get, getWithDefault, set, assert } = Ember;

export default Ember.Service.extend(Ember.Evented, {
  queues: {},

  addAction(thing, eventName, info, callback) {
    assert("passed in object is not Ember.Evented", (thing && thing.on && thing.trigger));

    if (typeof(thing) === 'string') {
      thing = Ember.getOwner(this).lookup(thing);
    }

    let queueName   = this._queueName(thing, eventName);
    let queues      = get(this, 'queues');
    let queue       = getWithDefault(queues, queueName, []);
    queue.push(Ember.assign(info, {callback: callback}));

    if (!get(queues, queueName)) {
      let _this = this;
      thing.on(eventName, function(data) { _this._runQueue(queueName, data); });
    }

    set(queues, queueName, queue);
    return {queueName};
  },

  runQueue() {

  },

  _relayEvent(eventName, sound) {
    this.trigger(eventName, sound);
  },

  afterRun(thing, eventName, callback) {
    let queueName  = this._queueName(thing, eventName);
    this.on(`after:${queueName}`, callback);
  },

  _queueName(thing, eventName) {
    let objectName = Ember.String.dasherize(Ember.toString(thing));
    return `${objectName}:${eventName}`;
  },

  _queueExists(queueName) {
    return !!get(this, `queues.${queueName}`);
  },

  _runQueue(queueName, eventData = {}) {
    let queues = get(this, 'queues');
    let orderedQueue = Ember.A(getWithDefault(queues, queueName, [])).sortBy('priority').slice(); // copy, bro

    let runPromise = new RSVP.Promise((resolve) => {
      PromiseRace.start(orderedQueue, function(nextAction, returnSuccess, markFailure) {
        return RSVP.Promise.resolve(nextAction.callback(eventData)).then(result => {
          if (result) {
            returnSuccess(result);
          }
          else {
            markFailure(nextAction);
          }
        }).catch(e => {
          markFailure(e);
        });
      })
      .then((results) => resolve(results))
      .catch((results) => resolve(results));
    });

    runPromise.then((results) => {
      this.trigger(`after:${queueName}`, results);
    });

    return runPromise;
  }
});
