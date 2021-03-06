import { later, next } from '@ember/runloop';
import Evented from '@ember/object/evented';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import RSVP from 'rsvp';

const TestObject = EmberObject.extend(Evented, { });

module('Unit | Service | action queue', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.owner.lookup('service:action-queue').set('queues', {});
  });

  test('addAction requires that object be Evented', function(assert) {
    let service = this.owner.lookup('service:action-queue');

    assert.throws(function() {
      service.addAction(EmberObject.create({}), 'audio-whatever', {}, function() {});
    }, Error("Assertion Failed: passed in object is not Ember.Evented"));
  });

  test('long running actions work as expected', function(assert) {
    let service = this.owner.lookup('service:action-queue');
    let done    = assert.async();
    let hifiService = new TestObject();
    let called = [];

    service.addAction(hifiService, 'audio-finished', {priority: 1}, function() {
      return new RSVP.Promise((resolve, reject) => {
        called.push(1);
        later(reject, 500);
      });
    });

    service.addAction(hifiService, 'audio-finished', {priority: 2}, function() {
      return new RSVP.Promise((resolve) => {
        called.push(2);
        later(() => {
          resolve(true);
        }, 500);
      });
    });

    service.addAction(hifiService, 'audio-finished', {priority: 2}, function() {
      return new RSVP.Promise((resolve) => {
        called.push(3);
        resolve(false);
      });
    });

    service.afterRun(hifiService, 'audio-finished', function(results) {
      assert.deepEqual(called, [1,2], "first and second actions should have been completed");
      assert.ok(results.failures, "failures array should exist");
      assert.ok(results.success, "success result should exist");
      done();
    });

    hifiService.trigger('audio-finished');
  });

  test('runQueue runs the actions in priority order', function(assert) {
    let service = this.owner.lookup('service:action-queue');
    let done = assert.async();
    let hifiService = new TestObject();

    let called = [];

    service.addAction(hifiService, 'audio-finished', {priority: 1}, function() {
      called.push(1);
    });

    service.addAction(hifiService, 'audio-finished', {priority: 2}, function() {
      called.push(2);
    });

    service.addAction(hifiService, 'audio-finished', {priority: 10}, function() {
      called.push(3);
    });

    service.afterRun(hifiService, 'audio-finished', function() {
      assert.deepEqual(called, [1,2,3], "actions should have been called in priority order");
      done();
    });

    hifiService.trigger('audio-finished');
  });

  test('runQueue only runs actions until one returns true', function(assert) {
    let done = assert.async();
    let service = this.owner.lookup('service:action-queue');
    let hifiService = new TestObject();
    let called = [];

    service.addAction(hifiService, 'audio-finished', {priority: 1, name: ''}, function() {
      called.push(1);
      return true;
    });

    service.addAction(hifiService, 'audio-finished', {priority: 2}, function() {
      called.push(2);
    });

    service.addAction(hifiService, 'audio-finished', {priority: 10}, function() {
      called.push(3);
    });

    service.afterRun(hifiService, 'audio-finished', function() {
      assert.deepEqual(called, [1], "only the highest priority action should have been called");
      done();
    });

    hifiService.trigger('audio-finished');
  });

  test('queue can be run multiple times', function(assert) {
    let done = assert.async();
    let service = this.owner.lookup('service:action-queue');
    let hifiService = TestObject.create();

    let called = [];

    service.addAction(hifiService, 'audio-finished', {priority: 1}, function() {
      called.push(1);
      return true;
    });

    service.addAction(hifiService, 'audio-finished', {priority: 2}, function() {
      called.push(2);
    });

    let callCount = 0;
    var afterRun = function() {
      if (callCount > 0) {
        assert.deepEqual(called, [1, 1], "priority 1 action should have been called twice");
        done();
      }
      callCount = callCount + 1;
    };

    service.afterRun(hifiService, 'audio-finished', afterRun);
    hifiService.trigger('audio-finished');
    next(() => {
      hifiService.trigger('audio-finished');
    });
  });
});
