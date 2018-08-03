import EmberObject, { get, set } from '@ember/object';
import { A } from '@ember/array';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import sinon from 'sinon';

module('Unit | Service | bumper state', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    const dummyStub = Service.extend({

    });

    const sessionStub = Service.extend({
      init() {
        this._super(...arguments);
        this.data = {
          'user-prefs-active-autoplay': 'default_stream',
          'user-prefs-active-stream': {slug: 'wnyc-fm939', name: 'WNYC 93.9 FM'},
          'queue': {
            'items': A(),
          }
        };
      },
      authorize: function() {}
    });

    this.owner.register('service:session', sessionStub);
    this.owner.register('service:data-pipeline', dummyStub);
    this.dataPipeline = this.owner.lookup('service:dataPipeline');
    this.session = this.owner.lookup('service:session');
  });

  test('getBumperUrl returns the queue bumper url for the queue when pref is set to queue', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    this.server.createList('stream', 2);
    const [first, second] = this.server.createList('story', 2);

    return settled().then(() => {
      set(bumper, 'session.data.queue', [EmberObject.create(first), EmberObject.create(second)]);
      set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');

      const expectedBumperURL = 'http://audio-bumper.com/thucyides.mp3';
      const actualBumperURL = bumper.getBumperUrl();

      assert.equal(actualBumperURL, expectedBumperURL);
    });
  });

  test('getBumperUrl returns the bumper url when the pref is set to default_stream', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    let wnycStream;
    sinon.stub(bumper, 'getStream').callsFake(function(slug) {
      wnycStream = EmberObject.create({slug: slug, audioBumper: "http://test.example"});
      return wnycStream;
    });

    // force wnyc stream into store so getBumperUrl can call peekRecord successfully
    const actualBumperURL = bumper.getBumperUrl();
    assert.equal(actualBumperURL, wnycStream.audioBumper);
  });

  test('getBumperUrl returns the wqxr bumper url when the prefs are set to default_stream and wqxr', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    set(bumper, 'session.data.user-prefs-active-stream', {slug: 'wqxr', name: 'WQXR New York'});

    let retreivedStream;
    sinon.stub(bumper, 'getStream').callsFake(function(slug) {
      retreivedStream = EmberObject.create({slug: slug, audioBumper: "http://test.example"});
      return retreivedStream;
    });

    const actualBumperURL = bumper.getBumperUrl();
    const expectedBumperURL = retreivedStream.audioBumper;

    assert.equal(actualBumperURL, expectedBumperURL);
    assert.equal(retreivedStream.slug, 'wqxr', 'should have retreived wqxr stream')
  });

  test('getAutoplayItem the default stream slug when pref is default_stream', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    let retreivedStream;
    sinon.stub(bumper, 'getStream').callsFake(function(slug) {
      retreivedStream = EmberObject.create({slug: slug, audioBumper: "http://test.example"});
      return retreivedStream;
    });

    return settled().then(() => {
      const expectedAudio = 'wnyc-fm939';
      const actualAudio = bumper.getAutoplayItem();
      assert.equal(actualAudio, expectedAudio);
    });
  });


  test('if the queue is empty and the preference is set to queue, the bumper service will be disabled', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    this.server.createList('stream', 2);

    set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');
    set(bumper, 'session.data.queue', []);
    let actualState = get(bumper, 'autoplayEnabled');
    assert.equal(actualState, false);
  });

  test('if the queue is undefined and the preference is set to queue, the bumper service will be disabled', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});

    this.server.createList('stream', 2);
    set(bumper, 'session.data.user-prefs-active-autoplay', 'queue');
    set(bumper, 'session.data.queue', undefined);
      let actualState = get(bumper, 'autoplayEnabled');
      assert.equal(actualState, false);
    });

  test('if the queue has items, and the preference is set to queue, the bumper service will be enabled', function(assert) {
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
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
    const bumper = this.owner.factoryFor('service:bumper-state').create({});
    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
    const session = get(bumper, 'session');
    session.set('data.user-prefs-active-autoplay', 'no_autoplay');

    let actualState = get(bumper, 'autoplayEnabled');
    assert.equal(actualState, false);
  });

  test('with the bumper-state enabled, the bumper will act on a finished track event', function(assert) {
    let bumper = this.owner.factoryFor('service:bumper-state').create({});

    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
    sinon.stub(bumper, 'getStream').callsFake(function() { return {name: 'wnyc-stream '}});
    let playSpy = sinon.stub(bumper.get('dj'), 'play').callsFake(function() {});

    bumper.set('autoplayEnabled', true);
    bumper.set('bumperDidPlay', false);
    let hifi = bumper.get('hifi');

    let dummySound = EmberObject.create({
      metadata: {
        contentId: "111",
        contentModelType: 'story',
        contentModel: {
          urls: ['/audio.mp3']
        }
      }
    });

    hifi.trigger('audio-ended', dummySound);

    return settled().then(() => {
      assert.equal(playSpy.callCount, 1, "play should have been sent to dj");
      let callArgs = playSpy.args[0];

      assert.equal(callArgs[0].modelName, 'bumper', "play should have been sent to dj");
    });
  });

  test('after a bumper plays, continuous play will start', function(assert) {
    let bumper = this.owner.factoryFor('service:bumper-state').create({});

    sinon.stub(bumper, 'cacheStreamsInStore').callsFake(function() {});
    sinon.stub(bumper, 'getStream').callsFake(function() { return {name: 'wnyc-stream '}});

    let playSpy = sinon.stub(bumper.get('dj'), 'play').callsFake(function() {});

    bumper.set('autoplayEnabled', true);
    bumper.set('bumperDidPlay', true);
    let hifi = bumper.get('hifi');

    let dummySound = EmberObject.create({
      metadata: {
        playContext: 'audio-bumper',
        contentId: "111",
        contentModelType: 'bumper',
        contentModel: {
          urls: ['/audio.mp3']
        }
      }
    });

    sinon.stub(bumper, 'getAutoplayItem').callsFake(function() {
      return EmberObject.create({
        metadata: {
          contentId: 'test'
        }
      });
    });

    hifi.trigger('audio-ended', dummySound);

    return settled().then(() => {
      assert.equal(playSpy.callCount, 1, "play should have been sent to dj");
      let callArgs = playSpy.args[0];

      assert.equal(get(callArgs[0], 'metadata.contentId'), 'test', "play should have been sent to dj");
    });
  });
});
