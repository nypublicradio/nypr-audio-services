import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import wait from 'ember-test-helpers/wait';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import sinon from 'sinon';
const { A, Service } = Ember;
import hifiNeeds from 'dummy/tests/helpers/hifi-needs';

moduleFor('service:bumper-state', 'Unit | Service | bumper state', {
  // Specify the other units that are required for this test.
  needs: [
    ...hifiNeeds,
    'service:listen-queue',
    'service:action-queue',
    'service:listen-analytics',
    'service:dj'
  ],

  beforeEach() {
    const FeatureStub = Service.extend({
      isEnabled() {
        return true;
      }
    });

    const dummyStub = Service.extend({

    });

    const metricsStub = Service.extend({
      trackEvent() {

      }
    });

    const sessionStub = Ember.Service.extend({
      data: {
        'user-prefs-active-autoplay': 'default_stream',
        'user-prefs-active-stream': {slug: 'wnyc-fm939', name: 'WNYC 93.9 FM'},
        'queue': {
          'items': A(),
        }
      },
      authorize: function() {}
    });

    this.server = startMirage();

    this.register('service:features', FeatureStub);
    this.register('service:session', sessionStub);
    this.register('service:data-pipeline', dummyStub);
    this.register('service:metrics', metricsStub);
    this.inject.service('dataPipeline');
    this.inject.service('metrics');
    this.inject.service('session');
    this.inject.service('features');
  },

  afterEach() {
    this.server.shutdown();
  }
});

test('getBumperUrl returns the queue bumper url for the queue when pref is set to queue', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  server.createList('stream', 2);
  const [first, second] = server.createList('story', 2);

  return wait().then(() => {
    set(bumper, 'session.data.queue', [Ember.Object.create(first), Ember.Object.create(second)]);
    set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');

    const expectedBumperURL = 'http://audio-bumper.com/thucyides.mp3';
    const actualBumperURL = bumper.getBumperUrl();

    assert.equal(actualBumperURL, expectedBumperURL);
  });
});

test('getBumperUrl returns the bumper url when the pref is set to default_stream', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  let wnycStream;
  sinon.stub(bumper, 'getStream').callsFake(function(slug) {
    wnycStream = Ember.Object.create({slug: slug, audioBumper: "http://test.example"});
    return wnycStream;
  });

  // force wnyc stream into store so getBumperUrl can call peekRecord successfully
  const actualBumperURL = bumper.getBumperUrl();
  assert.equal(actualBumperURL, wnycStream.audioBumper);
});

test('getBumperUrl returns the wqxr bumper url when the prefs are set to default_stream and wqxr', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  set(bumper, 'session.data.user-prefs-active-stream', {slug: 'wqxr', name: 'WQXR New York'});

  let retreivedStream;
  sinon.stub(bumper, 'getStream').callsFake(function(slug) {
    retreivedStream = Ember.Object.create({slug: slug, audioBumper: "http://test.example"});
    return retreivedStream;
  });

  const actualBumperURL = bumper.getBumperUrl();
  const expectedBumperURL = retreivedStream.audioBumper;

  assert.equal(actualBumperURL, expectedBumperURL);
  assert.equal(retreivedStream.slug, 'wqxr', 'should have retreived wqxr stream')
});

test('getAutoplayItem the default stream slug when pref is default_stream', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  let retreivedStream;
  sinon.stub(bumper, 'getStream').callsFake(function(slug) {
    retreivedStream = Ember.Object.create({slug: slug, audioBumper: "http://test.example"});
    return retreivedStream;
  });

  return wait().then(() => {
    const expectedAudio = 'wnyc-fm939';
    const actualAudio = bumper.getAutoplayItem();
    assert.equal(actualAudio, expectedAudio);
  });
});


test('if the queue is empty and the preference is set to queue, the bumper service will be disabled', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  server.createList('stream', 2);

  set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');
  set(bumper, 'session.data.queue', []);
  let actualState = get(bumper, 'autoplayEnabled');
  assert.equal(actualState, false);
});

test('if the queue is undefined and the preference is set to queue, the bumper service will be disabled', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  server.createList('stream', 2);
  set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');
  set(bumper, 'session.data.queue', undefined);
  return wait().then(() => {
    let actualState = get(bumper, 'autoplayEnabled');
    assert.equal(actualState, false);
  });
});

test('if the queue has items, and the preference is set to queue, the bumper service will be enabled', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

  bumper.set('queue', {
    items: [{id: 1}, {id: 2}],
    nextItem() {
      return this.items.pop()
    }
  });

  set(bumper, 'session.data.queue', A());
  set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');

  let actualState = get(bumper, 'autoplayEnabled');
  assert.equal(actualState, true);
});

test('if the queue is empty and the preference is set to no_autoplay, the bumper service be disabled', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
  const session = get(bumper, 'session');
  session.set('data.user-prefs-active-autoplay', 'no_autoplay');

  let actualState = get(bumper, 'autoplayEnabled');
  assert.equal(actualState, false);
});

test('with the bumper-state enabled, the bumper will act on a finished track event', function(assert) {
  let bumper = this.subject({});

  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
  let playSpy = sinon.stub(bumper.get('dj'), 'play').callsFake(function() {});

  bumper.set('autoplayEnabled', true);
  bumper.set('bumperDidPlay', false);
  let hifi = bumper.get('hifi');

  let dummySound = Ember.Object.create({
    metadata: {
      contentId: "111",
      contentModelType: 'story',
      contentModel: {
        urls: ['/audio.mp3']
      }
    }
  });

  hifi.trigger('audio-ended', dummySound);

  return wait().then(() => {
    assert.equal(playSpy.callCount, 1, "play should have been sent to dj");
    let callArgs = playSpy.args[0];

    assert.equal(callArgs[0].modelName, 'bumper', "play should have been sent to dj");
  });
});

test('after a bumper plays, continuous play will start', function(assert) {
  let bumper = this.subject({});

  sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
  let playSpy = sinon.stub(bumper.get('dj'), 'play').callsFake(function() {});

  bumper.set('autoplayEnabled', true);
  bumper.set('bumperDidPlay', true);
  let hifi = bumper.get('hifi');

  let dummySound = Ember.Object.create({
    metadata: {
      playContext: 'Continuous Play',
      contentId: "111",
      contentModelType: 'bumper',
      contentModel: {
        urls: ['/audio.mp3']
      }
    }
  });

  sinon.stub(bumper, 'getAutoplayItem').callsFake(function() {
    return Ember.Object.create({
      metadata: {
        contentId: 'test'
      }
    })
  });

  hifi.trigger('audio-ended', dummySound);

  return wait().then(() => {
    assert.equal(playSpy.callCount, 1, "play should have been sent to dj");
    let callArgs = playSpy.args[0];

    assert.equal(get(callArgs[0], 'metadata.contentId'), 'test', "play should have been sent to dj");
  });
});
