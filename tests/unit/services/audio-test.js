import Ember from 'ember';
import { moduleFor, skip } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import wait from 'ember-test-helpers/wait';
import hifiNeeds from 'dummy/tests/helpers/hifi-needs';
import sinon from 'sinon';

import DummyConnection from 'ember-hifi/hifi-connections/dummy-connection';


let server;

moduleFor('service:dj', 'Unit | Service | audio', {
  // Specify the other units that are required for this test.
  needs: [...hifiNeeds,
          'service:dj',
          'service:bumper-state',
          'service:poll',
          'service:listen-queue',
          'service:listen-history',
          'service:action-queue'],

  beforeEach() {
    const sessionStub = Ember.Service.extend({
      data: {browserId: 'secrets'}, // we only really need the data thing
      authorize: function() {},
    });
    const metricsStub = Ember.Service.extend({
      trackEvent() {}
    });
    const bumperStub = Ember.Service.extend({
      autoplayEnabled: false
    });

    const dummyStub = Ember.Service.extend({

    });

    const featuresStub = Ember.Service.extend({

    });

    this.register('service:data-pipeline', dummyStub);
    this.inject.service('data-pipeline', { as: 'dataPipeline'  });

    this.register('service:session', sessionStub);
    this.inject.service('session');

    this.register('service:features', featuresStub);
    this.inject.service('features');

    this.register('service:metrics', metricsStub);
    this.inject.service('metrics');

    this.register('service:bumper-state', bumperStub);
    this.inject.service('bumper-state');

    this.server = startMirage();
    server = this.server;
  },
  afterEach() {
    this.server.shutdown();
  }
});

const hifiStub = {
  play(promise) {
    return Ember.RSVP.Promise.resolve(promise);
  },
  pause() {}
};

skip('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

skip('episodes played from the queue do not continue to the next item until the episode has finished all its segments', function(assert) {
  let url1 = '/url1.mp3';
  let audio1 = DummyConnection.create({ url: url1 });
  let url2 = '/url2.mp3';
  let audio2 = DummyConnection.create({ url: url2 });
  let url3 = '/url3.mp3';
  let audio3 = DummyConnection.create({ url: url3 });
  let episodeToQueue = server.create('story', {
    audio: [url1, url2]
  });
  let nextStory = server.create('story', { audio: url3 });

  let service = this.subject();
  service.get('hifi.soundCache').cache(audio1);
  service.get('hifi.soundCache').cache(audio2);
  service.get('hifi.soundCache').cache(audio3);

  let hifiSpy = sinon.spy(service.get('hifi'), 'play');
  let queueSpy = sinon.spy(service, 'playNextInQueue');
  let audio3Spy = sinon.spy(audio3, 'play');

  Ember.run(() => {
    service.addToQueue(episodeToQueue.id);
    service.addToQueue(nextStory.id);

    service.play(episodeToQueue.id, 'queue').then(() => {
      assert.equal(service.get('hifi.currentSound.url'), url1, 'first audio file should be playing');
      audio1.trigger('audio-ended');
    });

    audio2.on('audio-played', function() {
      assert.equal(hifiSpy.callCount, 2, 'should only call play twice');
      assert.equal(audio3Spy.callCount, 0, 'audio3 should not be played');
      assert.equal(queueSpy.callCount, 0, 'nothing new should be queued by now');

      Ember.run.next(() => audio2.trigger('audio-ended'));
    });

    audio2.on('audio-ended', function() {
      audio2.ended = true;
    });

    audio3.on('audio-played', function() {
      assert.equal(hifiSpy.callCount, 3, 'play called 3 times');
      assert.equal(audio3Spy.callCount, 1, 'audio3 should be played once');
      assert.equal(queueSpy.callCount, 1, 'audio should have been qeueued up');
      assert.ok(audio2.ended, 'audio2 should have ended before starting');
    });

  });

  return wait();

});

skip('service passes correct attrs to data pipeline to report an on_demand listen action', function(assert) {

  let done = assert.async();
  let audio = DummyConnection.create({
    url: '/audio.mp3',
    duration: 30 * 60 * 1000
  });
  let audio2 = DummyConnection.create({
    url: '/audio2.mp3',
    duration: 30 * 60 * 1000
  });
  let story = server.create('story', { audio: '/audio.mp3' });
  let story2 = server.create('story', { audio: '/audio2.mp3' });
  let reportStub = sinon.stub();
  let service = this.subject({
      dataPipeline: {
        reportListenAction: reportStub
      }
  });
  service.get('hifi.soundCache').cache(audio);
  service.get('hifi.soundCache').cache(audio2);
  let expected = {
    audio_type: 'on_demand',
    cms_id: story.id,
    current_audio_position: 0,
    item_type: story.itemType,
  };

  Ember.run(() => {
    service.play(story.id).then(() => {
      let forwardPosition = {current_audio_position: service.get('position')};
      service.fastForward();
      let rewindPosition = {current_audio_position: service.get('position')};
      service.rewind();
      let setPosition = {current_audio_position: service.get('position')};
      service.setPosition(0.5);
      service.pause();
      let pausePosition = {current_audio_position: service.get('position')};
      service.play(story.id).then(() => {
        service.play(story2.id).then(() => {
          let setPosition2 = {current_audio_position: service.get('position')};
          service.setPosition(0.75);
          service.finishedTrack();
          let finishedPosition = {current_audio_position: service.get('position')};
          wait().then(() => {
            assert.equal(reportStub.callCount, 10);

            assert.deepEqual(
              reportStub.getCall(0).args,
              ['start', expected]
            );

            assert.deepEqual(
              reportStub.getCall(1).args,
              ['forward_15', Object.assign(expected, forwardPosition)],
              'current_audio_position should be time when action happened, not target time'
            );

            assert.deepEqual(
              reportStub.getCall(2).args,
              ['back_15', Object.assign(expected, rewindPosition)],
              'current_audio_position should be time when action happened, not target time'
            );

            assert.deepEqual(
              reportStub.getCall(3).args,
              ['position', Object.assign(expected, setPosition)],
              'current_audio_position should be time when action happened, not target time'
            );

            assert.deepEqual(
              reportStub.getCall(4).args,
              ['pause', Object.assign(expected, pausePosition)]
            );

            assert.deepEqual(
              reportStub.getCall(5).args,
              ['resume', Object.assign(expected, pausePosition)]
            );

            assert.deepEqual(
              reportStub.getCall(6).args,
              ['interrupt', Object.assign(expected, pausePosition)]
            );

            // now we're dealing with story 2
            assert.deepEqual(
              reportStub.getCall(7).args,
              ['start', Object.assign(expected, {cms_id: story2.id, current_audio_position: 0})]
            );

            assert.deepEqual(
              reportStub.getCall(8).args,
              ['position', Object.assign(expected, setPosition2)],
              'current_audio_position should be time when action happened, not target time'
            );

            assert.deepEqual(
              reportStub.getCall(9).args,
              ['finish', Object.assign(expected, finishedPosition)]
            );

            done();
          });
        });
      });
    });
  });
});

skip('service reports a resume when returning to playing a story', function(assert) {
  let done = assert.async();
  let audio = DummyConnection.create({
    url: '/audio.mp3',
    duration: 30 * 60 * 1000
  });
  let audio2 = DummyConnection.create({
    url: '/audio2.mp3',
    duration: 30 * 60 * 1000
  });
  let story = server.create('story', { audio: '/audio.mp3' });
  let story2 = server.create('story', { audio: '/audio2.mp3' });
  let reportStub = sinon.stub();
  let service = this.subject({
      dataPipeline: {
        reportListenAction: reportStub
      }
  });
  service.get('hifi.soundCache').cache(audio);
  service.get('hifi.soundCache').cache(audio2);
  let expected = {
    audio_type: 'on_demand',
    cms_id: story.id,
    current_audio_position: 0,
    item_type: story.itemType,
  };

  Ember.run(() => {
    service.play(story.id).then(() => {
      let setPosition = {current_audio_position: service.get('position')};
      service.setPosition(0.5);
      let story1Position = {current_audio_position: service.get('position')};
      service.play(story2.id).then(() => {
        service.play(story.id).then(() => {
          wait().then(() => {
            assert.deepEqual(reportStub.getCall(0).args, ['start', expected]);
            assert.deepEqual(
              reportStub.getCall(1).args,
              ['position', Object.assign(expected, setPosition)]
            );
            assert.deepEqual(
              reportStub.getCall(2).args,
              ['interrupt', Object.assign(expected, story1Position)]
            );
            assert.deepEqual(
              reportStub.getCall(3).args,
              ['start', Object.assign(expected, {cms_id: story2.id, current_audio_position: 0})]
            );
            assert.deepEqual(
              reportStub.getCall(4).args,
              ['interrupt', expected]
            );
            assert.deepEqual(
              reportStub.getCall(5).args,
              ['resume', Object.assign(expected, story1Position, {cms_id: story.id})]
            );
            done();
          });
        });
      });
    });
  });

});

skip('service passes correct attrs to data pipeline to report a livestream listen action', function(assert) {

  let done = assert.async();
  let reportStub = sinon.stub();
  let service = this.subject({
      dataPipeline: {
        reportListenAction: reportStub
      }
  });
  let currentStory = server.create('story');
  let stream = server.create('stream');
  server.create('whats-on', {
    current_show: { episode_pk: currentStory.id }
  });
  let audio = DummyConnection.create({ url: stream.attrs.urls.rtsp });

  let expected = {
    audio_type: 'livestream',
    cms_id: currentStory.id,
    item_type: currentStory.itemType,
    stream_id: Number(stream.id),
    current_audio_position: 0
  };

  service.get('hifi.soundCache').cache(audio);

  Ember.run(() => {
    service.play(stream.slug).then(() => {
      service.position = 500;
      service.pause();
      service.play(stream.slug).then(() => {
        wait().then(() => {
          assert.equal(reportStub.callCount, 3);
          assert.deepEqual(reportStub.getCall(0).args, ['start', expected], 'should have received proper attrs');
          assert.deepEqual(reportStub.getCall(1).args, ['pause', expected], 'should have received proper attrs');
          assert.deepEqual(reportStub.getCall(2).args, ['resume', expected], 'should have received proper attrs');
          done();
        });
      });
    });
  });
});

skip('it calls the GoogleAnalytics ping event', function(assert) {
  let done = assert.async();
  let service = this.subject();
  let story = server.create('story');
  let metricsStub = {
    trackEvent() {
      assert.ok(true, 'trackEvent was called');
      done();
    }
  };

  service.set('metrics', metricsStub);
  service.set('sessionPing', 500);
  service.set('hifi', hifiStub);
  Ember.run(() => service.play(story.id));
});




// TODO: skip until we merge in stream mirage factories
// moduleFor('service:audio', 'Unit | Service | Audio Analytics', {
//   // Specify the other units that are required for this test.
//   needs: ['model:story','adapter:story','serializer:story',
//           'model:discover/stories',
//           'service:poll',
//           'service:metrics',
//           'service:listen-history'],
//
//   beforeEach() {
//     const sessionStub = Ember.Service.extend({
//       data: {} // we only really need the data thing
//     });
//     const listenActionsStub = Ember.Service.extend({
//       sendPause: function(){},
//       sendComplete: function(){},
//       sendPlay: function(){},
//       sendSkip: function(){},
//       sendDelete: function(){}
//     });
//     startMirage(this.container);
//
//     this.register('service:session', sessionStub);
//     this.inject.service('session', { as: 'session' });
//   },
//   afterEach() {
//     server.shutdown();
//     delete window.ga;
//   }
// });
//
// test('it sends npr events', function(assert) {
//   window.ga = function() {
//     debugger;
//   }
//   let stream = server.create('stream');
//
//   Ember.run(() => {
//     service.playStream(stream.slug);
//   })
//
// });
