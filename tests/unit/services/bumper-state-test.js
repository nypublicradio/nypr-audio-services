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
    'service:listenAnalytics',
    'service:dj'
  ],

  beforeEach() {
    const FeatureStub = Service.extend({
      isEnabled() {
        return true;
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
    this.inject.service('session');
    this.inject.service('features');
  },

  afterEach() {
    this.server.shutdown();
  }
});

test('getBumperUrl returns the queue bumper url for the queue when pref is set to queue', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

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
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

  let wnycStream;
  sinon.stub(bumper, 'getStream', function(slug) {
    wnycStream = Ember.Object.create({slug: slug, audioBumper: "http://test.example"});
    return wnycStream;
  });

  // force wnyc stream into store so getBumperUrl can call peekRecord successfully
  const actualBumperURL = bumper.getBumperUrl();
  assert.equal(actualBumperURL, wnycStream.audioBumper);
});

test('getBumperUrl returns the wqxr bumper url when the prefs are set to default_stream and wqxr', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

  set(bumper, 'session.data.user-prefs-active-stream', {slug: 'wqxr', name: 'WQXR New York'});

  let retreivedStream;
  sinon.stub(bumper, 'getStream', function(slug) {
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
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

  let retreivedStream;
  sinon.stub(bumper, 'getStream', function(slug) {
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
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

  server.createList('stream', 2);

  set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');
  set(bumper, 'session.data.queue', []);
  let actualState = get(bumper, 'autoplayEnabled');
  assert.equal(actualState, false);
});

test('if the queue is undefined and the preference is set to queue, the bumper service will be disabled', function(assert) {
  const bumper = this.subject({});
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

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
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});

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
  sinon.stub(bumper, 'cacheStreamsInStore', function() {});
  const session = get(bumper, 'session');
  session.set('data.user-prefs-active-autoplay', 'no_autoplay');

  let actualState = get(bumper, 'autoplayEnabled');
  assert.equal(actualState, false);
});
