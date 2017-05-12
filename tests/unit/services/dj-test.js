import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import startMirage from '../../helpers/setup-mirage-for-integration';
import sinon from 'sinon';
import RSVP from 'rsvp';
import hifiNeeds from '../../../tests/helpers/hifi-needs';

moduleFor('service:dj', 'Unit | Service | dj', {
  // Specify the other units that are required for this test.
  needs: [...hifiNeeds, 'service:poll', 'service:action-queue'],

  beforeEach() {
    startMirage(this.container);
  },

  afterEach() {
    server.shutdown();
  }
});

let dummySound = new Ember.Object({});

const hifiStub = {
  play(urls, {metadata}) {
    dummySound.set('metadata', metadata);
    return Ember.RSVP.Promise.resolve({sound: dummySound});
  },
  pause() {}
};

test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('it correctly identifies a story model', function(assert) {
  let service = this.subject();
  let story = server.create('story');
  assert.equal(service.itemModelName(story), 'story');
});

test('it correctly identifies a stream model', function(assert) {
  let service = this.subject();
  let stream = server.create('stream');
  assert.equal(service.itemModelName(stream), 'stream');
});

test('it correctly identifies a stream id', function(assert) {
  let service = this.subject();
  assert.equal(service.itemModelName('wnyc-fm'), 'stream');
});

test('it correctly identifies a story id', function(assert) {
  let service = this.subject();
  assert.equal(service.itemModelName('125125'), 'story');
});

test('it correctly identifies a stream id', function(assert) {
  let service = this.subject();
  assert.equal(service.itemModelName('wnyc-fm393'), 'stream');
});

test('it correctly returns the item identifier', function(assert) {
  let service = this.subject();
  assert.equal(service.itemId('125125'), '125125');
});

test('it correctly returns the item identifier for a model', function(assert) {
  let service = this.subject();
  let story = server.create('story');
  assert.equal(service.itemId(story), story.id);
});

test('play request sets contentModel after load', function(assert) {
  let done    = assert.async();
  let service = this.subject();
  let stream = server.create('stream', {urls: ['/path/to/nothing', '/path/to/nothing/2']});

  Ember.run(() => {
    service.set('hifi', hifiStub);
    service.set('listenAnalytics', listenAnalyticsStub);

    stream.forListenAction = function() {};

    sinon.stub(service, 'fetchRecord', function() {
      return RSVP.Promise.resolve(stream);
    });

    let itemPK  = "fake-stream";

    service.play(itemPK).then(({sound}) => {
      assert.equal(sound.get('metadata.contentModel'), stream, "should have content model stuffed in there");
      assert.equal(sound.get('metadata.contentModelType'), 'stream', "should have content model type");
      assert.equal(sound.get('metadata.contentId'), 'fake-stream', "should have content id");
      done();
    });
  });
});
