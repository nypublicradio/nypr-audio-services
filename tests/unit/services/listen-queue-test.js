import { run } from '@ember/runloop';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import { get } from '@ember/object';
import RSVP from 'rsvp';
import sinon from 'sinon';

module('Unit | Service | listen queue', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.server = startMirage();

    const sessionStub = Service.extend({
      init() {
        this._super(...arguments);
        this.data = {};
      },
      authorize: function() {}
    });

    const dummyStub = Service.extend({

    });

    this.owner.register('service:dj', dummyStub);
    this.dj = this.owner.lookup('service:dj');

    this.owner.register('service:data-pipeline', dummyStub);
    this.dataPipeline = this.owner.lookup('service:data-pipeline');

    this.owner.register('service:metrics', dummyStub);
    this.metrics = this.owner.lookup('service:metrics');

    this.owner.register('service:session', sessionStub);
    this.session = this.owner.lookup('service:session');
  });

  hooks.afterEach(function() {
    this.server.shutdown();
  });

  const findRecordStub = function(id) {
    return RSVP.Promise.resolve({
      data: {
        id: id,
        attributes: {
          title: `title-${id}`
        }
      }
    });
  }

  test('it exists', function(assert) {
    let service = this.owner.lookup('service:listen-queue');
    assert.ok(service);
  });

  test('a story can be added to the queue by id', function(assert) {
    let service = this.owner.factoryFor('service:listen-queue').create({
      findRecord: findRecordStub,
      store: {
        peekRecord: sinon.mock().twice()
      }
    });

    this.server.createList('story', 2);

    run(() => {
      service.addToQueueById(1);
      service.addToQueueById(2);
    });

    assert.equal(service.get('items').length, 2);
  });

  test('addToQueueById returns a Promise that resolves to the added story', function(assert) {
    let service = this.owner.factoryFor('service:listen-queue').create({
      findRecord: findRecordStub,
      store: {
        peekRecord: sinon.mock().once()
      }
    });

    service.addToQueueById(1)
        .then(story => assert.equal(get(story, 'data.attributes.title'), 'title-1'));
  });

  test('a story can be removed from the queue by id', function(assert) {
    let service = this.owner.factoryFor('service:listen-queue').create({
      findRecord: findRecordStub,
      store: {
        peekRecord: sinon.mock().twice()
      }
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
    let service = this.owner.lookup('service:listen-queue');

    let session = service.get('session');
    session.set('data.queue', [ {id: 1} ]);

    run(() => {
      service.removeFromQueueById(1);
    });

    assert.equal(service.get('items').length, 0);
  });

  test('hyperactive adds and removes should still work', function(assert) {
    let service = this.owner.factoryFor('service:listen-queue').create({
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
    let service = this.owner.factoryFor('service:listen-queue').create({
      findRecord: findRecordStub,
      store: {
        peekRecord: sinon.mock().thrice().returnsArg(1)
      }
    });

    let [ story1, story2, story3 ] = this.server.createList('story', 3);
    let newOrder = [ story3, story2, story1 ].map(s => this.server.serializerOrRegistry.serialize(s));

    run(() => {
      service.addToQueueById(story1.id);
      service.addToQueueById(story2.id);
      service.addToQueueById(story3.id);
    });

    run(() => {
      service.reset(newOrder);
    });
  });

  assert.deepEqual(service.get('items'), newOrder.map(s => s.data.id));
  test('can retrieve the next item', function(assert) {
    let story1 = this.server.create('story');

    let service = this.owner.factoryFor('service:listen-queue').create({
      findRecord: findRecordStub,
      store: {
        peekRecord: sinon.stub().returns({data: {id: story1.id}})
      }
    });

    run(() => {
      service.addToQueueById(story1.id);
    });

    let nextUp = service.nextItem();
    assert.equal(nextUp.data.id, story1.id);
  });

  test('find record calls into the store with correct arguments', function(assert) {
    let service = this.owner.factoryFor('service:listen-queue').create({});

    let mock = sinon.mock(service.get('store'));
    mock.expects("findRecord").once().withArgs('story', 1);

    service.findRecord(1);

    assert.ok(mock.verify());
  });
});
