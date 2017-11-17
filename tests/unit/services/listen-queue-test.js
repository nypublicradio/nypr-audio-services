import { run } from '@ember/runloop';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import hifiNeeds from 'dummy/tests/helpers/hifi-needs';
import { get } from '@ember/object';
import RSVP from 'rsvp';
import sinon from 'sinon';

moduleFor('service:listen-queue', 'Unit | Service | listen queue', {
  needs: [
    ...hifiNeeds,
    'service:session',
    'service:action-queue',
    'service:listen-analytics',
    'service:bumper-state',
    'service:dj'
  ],
  beforeEach() {
    this.server = startMirage();

    const sessionStub = Service.extend({
      data: {},
      authorize: function() {}
    });

    const dummyStub = Service.extend({

    });

    this.register('service:dj', dummyStub);
    this.inject.service('dj', { as: 'dj'  });

    this.register('service:data-pipeline', dummyStub);
    this.inject.service('data-pipeline', { as: 'dataPipeline'  });

    this.register('service:metrics', dummyStub);
    this.inject.service('metrics', { as: 'metrics'  });

    this.register('service:session', sessionStub);
    this.inject.service('session', { as: 'session'  });
  },
  afterEach() {
    this.server.shutdown();
  }
});

const findRecordStub = function(id) {
  return RSVP.Promise.resolve({
    id: id,
    title: `title-${id}`
  });
}

test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('a story can be added to the queue by id', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  this.server.createList('story', 2);

  run(() => {
    service.addToQueueById(1);
    service.addToQueueById(2);
  });

  assert.equal(service.get('items').length, 2);
});

test('addToQueueById returns a Promise that resolves to the added story', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  service.addToQueueById(1)
      .then(story => assert.equal(get(story, 'title'), 'title-1'));
});

test('a story can be removed from the queue by id', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  let [ story1, story2 ] = this.server.createList('story', 2);

  run(() => {
    service.addToQueueById(story1.id);
    service.addToQueueById(story2.id);
    service.removeFromQueueById(story1.id);
  });

  assert.equal(service.get('items').length, 1);
});

test('a story already loaded can be removed from the queue by id', function(assert) {
  let service = this.subject();

  let session = service.get('session');
  session.set('data.queue', [ {id: 1} ]);

  run(() => {
    service.removeFromQueueById(1);
  });

  assert.equal(service.get('items').length, 0);
});

test('hyperactive adds and removes should still work', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  let [s1, s2, s3, s4, s5] = this.server.createList('story', 5);

  run(() => {
    service.addToQueueById(s1.id);
    service.addToQueueById(s2.id);
    service.addToQueueById(s3.id);
    service.removeFromQueueById(s3.id);
    service.addToQueueById(s4.id);
    service.removeFromQueueById(s2.id);
    service.addToQueueById(s5.id);
    service.removeFromQueueById(s1.id);
    service.addToQueueById(s2.id);
  });

  let queue = service.get('items');
  assert.equal(queue.length, 3);
  // assert.equal(queue[0].id, s4.id)
  // assert.equal(queue[1].id, s5.id)
  // assert.equal(queue[2].id, s2.id)
});

test('can replace the queue in one action', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  let [ story1, story2, story3 ] = this.server.createList('story', 3);
  let newOrder = [ story3, story2, story1 ];

  run(() => {
    service.addToQueueById(story1.id);
    service.addToQueueById(story2.id);
    service.addToQueueById(story3.id);
  });

  run(() => {
    service.reset(newOrder);
  });
  assert.deepEqual(service.get('items'), newOrder);
});

test('can retrieve the next item', function(assert) {
  let service = this.subject({
    findRecord: findRecordStub
  });

  let story1 = this.server.create('story');

  run(() => {
    service.addToQueueById(story1.id);
  });

  let nextUp = service.nextItem();
  assert.equal(nextUp.id, story1.id);
});

test('find record calls into the store with correct arguments', function(assert) {
  let service = this.subject({});

  let mock = sinon.mock(service.get('store'));
  mock.expects("findRecord").once().withArgs('story', 1);

  service.findRecord(1);

  assert.ok(mock.verify());
});
