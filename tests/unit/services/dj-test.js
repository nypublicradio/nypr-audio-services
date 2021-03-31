import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';
import EmberObject, { get } from '@ember/object';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import RSVP from 'rsvp';
import { dummyHifi } from 'dummy/tests/helpers/hifi-integration-helpers';

const ONE_MINUTE = 1000 * 60;

let segmentUrl1 = `/good/${ONE_MINUTE}/segment-1`;
let segmentUrl2 = `/good/${ONE_MINUTE}/segment-2`;
let storyUrl    = `/good/${ONE_MINUTE}/story-1`

let dummySegmentedStory, dummyStory;

module('Unit | Service | dj', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    const listenAnalyticsStub = Service.extend({
      trackAllCodecFailures() {},
      trackSoundFailure() {}
    });

    /* TODO: Revisit this. This doesn't feel great, but DJ knows about stories
      and we're testing the playing of segmented stories */

    dummySegmentedStory = EmberObject.create({
      audio: [segmentUrl1, segmentUrl2],
      currentSegment: segmentUrl1,
      modelName: 'story',
      resetSegments: function() {
        return this.currentSegment;
      },
      hasNextSegment: () => true,
      getNextSegment: function() {
        this.set('currentSegment', segmentUrl2);
        return this.currentSegment;
      },
      getCurrentSegment: function() {
         return this.currentSegment;
      },
      segmentedAudio: true
    });

    dummyStory = EmberObject.create({
      audio: storyUrl,
      currentSegment: storyUrl,
      modelName: 'story',
      resetSegments: function() {
        return this.currentSegment;
      },
      hasNextSegment: () => false,
      getCurrentSegment: function() {
         return this.currentSegment;
      },
      segmentedAudio: false
    });


    this.owner.register('service:listen-analytics', listenAnalyticsStub);
    this.listenAnalytics = this.owner.lookup('service:listenAnalytics');
    this.owner.register('service:hifi', dummyHifi);
    this.hifi = this.owner.lookup('service:hifi');
  });

  test('it exists', function(assert) {
    let service = this.owner.lookup('service:dj');
    assert.ok(service);
  });

  test('it correctly identifies a story model', function(assert) {
    let service = this.owner.lookup('service:dj');
    let story = this.server.create('story');
    assert.equal(service.itemModelName(story), 'story');
  });

  test('it correctly identifies a stream model', function(assert) {
    let service = this.owner.lookup('service:dj');
    let stream = this.server.create('stream');
    assert.equal(service.itemModelName(stream), 'stream');
  });

  test('it correctly identifies a stream id', function(assert) {
    let service = this.owner.lookup('service:dj');
    assert.equal(service.itemModelName('wnyc-fm939'), 'stream');
  });

  test('it correctly identifies a story id', function(assert) {
    let service = this.owner.lookup('service:dj');
    assert.equal(service.itemModelName('125125'), 'story');
  });

  test('it correctly returns the item identifier', function(assert) {
    let service = this.owner.lookup('service:dj');
    assert.equal(service.itemId('125125'), '125125');
  });

  test('it correctly returns the item identifier for a model', function(assert) {
    let service = this.owner.lookup('service:dj');
    let story = this.server.create('story');
    assert.equal(service.itemId(story), story.id);
  });

  test('play request sets contentModel after load', function(assert) {
    let done    = assert.async();
    let service = this.owner.lookup('service:dj');
    let stream = this.server.create('stream', {urls: ['/good/stream/1', '/good/stream/2']});

    run(() => {
      stream.forListenAction = () => RSVP.Promise.resolve({});

      sinon.stub(service, 'fetchRecord').callsFake(function() {
        return RSVP.Promise.resolve(stream);
      });

      let itemPK  = "wnyc-fm939";

      service.play(itemPK).then(({sound}) => {
        assert.equal(sound.get('metadata.contentModel'), stream, "should have content model stuffed in there");
        assert.equal(sound.get('metadata.contentModelType'), 'stream', "should have content model type");
        assert.equal(sound.get('metadata.contentId'), itemPK, "should have content id");
        done();
      });
    });
  });

  test('can switch from on demand to stream and vice versa', function(assert) {
    assert.expect(4);
    let done = assert.async();
    let service = this.owner.lookup('service:dj');

    const onDemandUrl = '/good/12500/ok';
    const streamUrl = '/good/stream/yeah'

    let stream = this.server.create('stream', {urls: [streamUrl]});
    let story  = EmberObject.create(assign(this.server.create('story').attrs, {
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
    let service = this.owner.lookup('service:dj');
    let hifi    = service.get('hifi');

    run(() => {
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
    let service = this.owner.lookup('service:dj');
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
    let service = this.owner.lookup('service:dj');
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
    let service = this.owner.lookup('service:dj');
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

  test('can pass extra metadata in a play request along to hifi', function(assert) {
    let service = this.owner.lookup('service:dj');
    assert.expect(3);

    return service.play(dummySegmentedStory, {playContext: 'queue', metadata: {contentModelType: undefined, customInfo: 'secret'}}).then(({sound}) => {
        // play a different sound so it's not the current sound
      assert.equal(sound.get('metadata.playContext'), 'queue', "play context should have been set");
      assert.equal(sound.get('metadata.customInfo'), 'secret', "extra metadata should have been set");
      assert.ok(sound.get('metadata.contentModelType') !== undefined, "it should not overwrite dj's options");
    });
  });

  test('addBrowserId sets up correct listener', function(assert) {
    const ID = 'foo';
    const URLS = ['foo.mp3', 'bar.mp3', {url: 'baz.mp3', mimeType: 'audio/mpeg'}];
    let service = this.owner.lookup('service:dj');
    let hifi = service.get('hifi');
    service.addBrowserId(ID);

    hifi.trigger('pre-load', URLS);

    assert.deepEqual(URLS, ['foo.mp3?nyprBrowserId=foo', 'bar.mp3?nyprBrowserId=foo', {url: 'baz.mp3?nyprBrowserId=foo', mimeType: 'audio/mpeg'}], 'updates values in place');
    assert.deepEqual(URLS, ['foo.mp3?nyprBrowserId=foo', 'bar.mp3?nyprBrowserId=foo', {url: 'baz.mp3?nyprBrowserId=foo', mimeType: 'audio/mpeg'}], 'updates values in place');
  });

  test('addBrowserId does not add a nyprBrowserId param if it already exists', function(assert) {
    const ID = '123';
    const URLS = [`foo.mp3?nyprBrowserId=${ID}`, 'bar.mp3?aisCookie=456', 'baz.mp3?cookie=789?bad=param'];
    let service = this.owner.lookup('service:dj');
    let hifi = service.get('hifi');

    service.addBrowserId(ID);
    hifi.trigger('pre-load', URLS);

    assert.deepEqual(URLS[0], `foo.mp3?nyprBrowserId=${ID}`, 'if a url has a browser id param, a second param is not added');
    assert.deepEqual(URLS[1], `bar.mp3?aisCookie=456&nyprBrowserId=${ID}`, 'if a query param already exists that is not nyprBrowserId, append nyprBrowserId');
    assert.deepEqual(URLS[2], `baz.mp3?cookie=789&bad=param&nyprBrowserId=${ID}`, 'it fixes malformed query params');
  });
});
