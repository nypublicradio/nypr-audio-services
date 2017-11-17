import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import { makeArray } from '@ember/array';
import Service from '@ember/service';
import { moduleFor } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import RSVP from 'rsvp';
import hifiNeeds from 'dummy/tests/helpers/hifi-needs';

moduleFor('service:listen-history', 'Unit | Service | listen-history', {
  // Specify the other units that are required for this test.
  needs: [...hifiNeeds],

  beforeEach() {
    const sessionStub = Service.extend({
      data: {
        listens: makeArray([])
      } // we only really need the data thing
    });

    const hifiStub = Service.extend(Evented, {
    });

    this.register('service:hifi', hifiStub);
    this.inject.service('hifi', { as: 'hifi' });

    this.register('service:session', sessionStub);
    this.inject.service('session', { as: 'session' });
  }
});

test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('on initialize it listens to hifi track changes', function(assert) {
  let done      = assert.async();
  let service   = this.subject();
  let hifi      = service.get('hifi');
  let store     = service.get('store');

  let storyId = 11;

  let story = EmberObject.create();

  let dummySound = new EmberObject({
    metadata: {
      contentModel: story,
      contentModelType: 'story',
      contentModelId: storyId
    }
  });

  this.stub(service, 'addListen').callsFake(function(s) {
    assert.ok(s, "should have been called once");
    assert.equal(s, story, "story gets passed in");
    done();
  });

  this.stub(store, 'findRecord').callsFake(function(model, id) {
    return RSVP.Promise.resolve({storyId: id});
  });

  hifi.trigger('current-sound-changed', dummySound, undefined);
});

test('item can get added to history', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);

  assert.equal(service.get('items').length, 2);
});

test('item can get removed from history by story id', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);
  service.removeListenByStoryPk(1);

  assert.equal(service.get('items').length, 1);
});

test('item can get removed from history by listenId', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);

  let listenId = service.get('items')[1].id;

  service.removeListenByListenId(listenId);

  assert.equal(service.get('items').length, 1);
  assert.equal(service.get('items')[0].story.id, 2);

});

test('history can be cleared', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);
  assert.equal(service.get('items').length, 2);

  service.clearHistory();
  assert.equal(service.get('items').length, 0);
});

test('can return listen history of item', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);
  assert.equal(service.historyFor(1).length, 1);
});

test('can answer if an item has been listened to before', function(assert) {
  let story1 = {id: 1};
  let story2 = {id: 2};
  let service = this.subject();

  service.addListen(story1);
  service.addListen(story2);
  assert.equal(service.hasListenedTo(1), true);
  assert.equal(service.hasListenedTo(5), false);
});
