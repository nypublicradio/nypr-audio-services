import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import sinon from 'sinon';
import RSVP from 'rsvp';
import hifiNeeds from 'dummy/tests/helpers/hifi-needs';
import { dummyHifi } from 'dummy/tests/helpers/hifi-integration-helpers';
import get from 'ember-metal/get';

const ONE_MINUTE = 1000 * 60;

let segmentUrl1 = `/good/${ONE_MINUTE}/segment-1`;
let segmentUrl2 = `/good/${ONE_MINUTE}/segment-2`;
let storyUrl    = `/good/${ONE_MINUTE}/story-1`

let dummySegmentedStory, dummyStory;

moduleFor('service:dj', 'Unit | Service | dj', {
  // Specify the other units that are required for this test.
  needs: [...hifiNeeds, 'service:poll', 'service:action-queue', 'service:listen-analytics'],

  beforeEach() {
    this.server = startMirage();

    const listenAnalyticsStub = Ember.Service.extend({
      trackAllCodecFailures: () => {},
      trackSoundFailure: () => {}
    });

    /* TODO: Revisit this. This doesn't feel great, but DJ knows about stories
      and we're testing the playing of segmented stories */

    dummySegmentedStory = Ember.Object.create({
      audio: [segmentUrl1, segmentUrl2],
      currentSegment: segmentUrl1,
      modelName: 'story',
      resetSegments: function() {
        return this.get('currentSegment')
      },
      hasNextSegment: () => true,
      getNextSegment: function() {
        this.set('currentSegment', segmentUrl2);
        return this.get('currentSegment')
      },
      getCurrentSegment: function() {
         return this.get('currentSegment')
      },
      segmentedAudio: true
    });

    dummyStory = Ember.Object.create({
      audio: storyUrl,
      currentSegment: storyUrl,
      modelName: 'story',
      resetSegments: function() {
        return this.get('currentSegment')
      },
      hasNextSegment: () => false,
      getCurrentSegment: function() {
         return this.get('currentSegment')
      },
      segmentedAudio: false
    });


    this.register('service:listen-analytics', listenAnalyticsStub);
    this.inject.service('listenAnalytics');
    this.register('service:hifi', dummyHifi);
    this.inject.service('hifi');
  },

  afterEach() {
    this.server.shutdown();
  }
});

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
  let stream = server.create('stream', {urls: ['/good/stream/1', '/good/stream/2']});

  Ember.run(() => {
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

test('can switch from on demand to stream and vice versa', function(assert) {
  assert.expect(4);
  let done = assert.async();
  let service = this.subject();

  const onDemandUrl = '/good/12500/ok';
  const streamUrl = '/good/stream/yeah'

  let stream = server.create('stream', {urls: [streamUrl]});
  let story  = Ember.Object.create(Ember.assign(server.create('story').attrs, {
    modelName: 'story',
    resetSegments: () => onDemandUrl,
    getCurrentSegment: () => onDemandUrl
  }));

  return service.play(story).then(({sound}) => {
    assert.equal(sound.get('url'), onDemandUrl, 'story played OK');

    return service.play(stream).then(({sound}) => {
      assert.equal(sound.get('url'), streamUrl, 'switched to stream OK');

      return service.play(story).then(({sound}) => {
        assert.equal(sound.get('url'), onDemandUrl, 'story played OK');

        return service.play(stream).then(({sound}) => {
          assert.equal(sound.get('url'), streamUrl, 'stream played ok');
          done();
        });
      });
    });
  });
});

test('playing segmented audio plays the segments in order', function(assert) {
  let done = assert.async();
  let service = this.subject();
  let hifi    = service.get('hifi');

  Ember.run(() => {
    hifi.on('current-sound-changed', function(currentSound, previousSound) {
      if (!previousSound) {
        return;
      }
      assert.equal(currentSound.get('url'), segmentUrl2, 'second audio should be playing');
      assert.equal(currentSound.get('position'), 0, 'second audio should start at 0');
    });

    service.play(dummySegmentedStory).then(() => {
      assert.equal(service.get('hifi.currentSound.url'), segmentUrl1, 'first audio should be playing');
      hifi.fastForward(20000); // this will end the audio
      done();
    });
  });
});

test('pausing audio picks up from where it left off', function(assert) {
  let service = this.subject();
  let hifi = service.get('hifi');

  return service.play(dummyStory).then(() => {
    hifi.set('position', (ONE_MINUTE / 2));
    assert.equal(get(hifi, 'position'), (ONE_MINUTE / 2), 'position on episode audio successfully set');
    return service.play(dummyStory).then(() => {
      assert.equal(get(hifi, 'position'), (ONE_MINUTE / 2), 'audio picks up where it left off');
    });
  });
});

test('pausing segmented audio picks up from where it left off', function(assert) {
  let service = this.subject();
  let hifi = service.get('hifi');

  return service.play(dummySegmentedStory).then(() => {
    hifi.set('position', (ONE_MINUTE / 2));
    assert.equal(get(hifi, 'position'), (ONE_MINUTE / 2), 'position on episode audio successfully set');
    return service.play(dummySegmentedStory).then(() => {
      assert.equal(get(hifi, 'position'), (ONE_MINUTE / 2), 'audio picks up where it left off');
    });
  });
});

test('can play a segmented story all the way through more than once', function(assert) {
  let service = this.subject();
  let hifi = service.get('hifi');
  assert.expect(1);

  return service.play(dummySegmentedStory).then(({sound}) => {
    hifi.set('position', ONE_MINUTE/2);
    sound.stop();
      // play a different sound so it's not the current sound
    return service.play(dummySegmentedStory).then((results) => {
      assert.equal(sound.get('url'), results.sound.get('url'), 'can play twice')
    });
  });
});
