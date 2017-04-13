import Ember from 'ember';
import RSVP from 'rsvp';
import PromiseRace from 'ember-hifi/utils/promise-race';
const { get, getWithDefault, set } = Ember;

export default Ember.Service.extend({
  queues: {},

  addAction(queueName, info, callback) {
    let queue = getWithDefault(get(this, 'queues'), queueName, []);
    queue.push(Ember.assign(info, {callback: callback}));
    set(this, `queues.${queueName}`, queue);
  },

  runQueue(queueName) {
    let queues = get(this, 'queues');
    let orderedQueue = Ember.A(getWithDefault(queues, queueName, [])).sortBy('priority').slice(); // copy, bro

    let runPromise = new RSVP.Promise((resolve) => {
      PromiseRace.start(orderedQueue, function(nextAction, returnSuccess, markFailure) {
        return RSVP.Promise.resolve(nextAction.callback()).then(result => {
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

    return runPromise;
  }
});
