import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('queue-button', 'Integration | Component | queue button', {
  integration: true,
  beforeEach() {
    const queueStub = Ember.Service.extend({
      items: [],
      removeFromQueueById() {},
      addToQueueById() {}
    });

    this.register('service:listen-queue', queueStub);
    this.inject.service('listen-queue', { as: 'queue' });
  },
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{queue-button}}`);

  assert.equal(this.$().text().trim(), 'Queue');
});

test('queue button "unqueued" state', function(assert) {
  this.set('addToQueue', () => assert.ok('calls addToQueue on click'));
  this.render(hbs`{{queue-button queue=queue}}`);

  assert.equal(this.$('button').attr('data-state'), undefined);

  this.$('button').click();
});

test('queue button "queued" state', function(assert) {
  this.set('removeFromQueueById', () => assert.ok('calls removeFromQueue on click'));

  this.render(hbs`{{queue-button inQueue=true}}`);

  assert.equal(this.$('button').attr('data-state'), 'in-queue');

  this.$('button').click();
});

test('queue buttons inQueue prop updates', function(assert) {

  this.render(hbs`{{queue-button itemPK=1}}`);
  assert.equal(this.$('button').attr('data-state'), undefined);

  Ember.run(() => {
    this.get('queue.items').pushObject({id: 1});
  });
  Ember.run(() => {
    assert.equal(this.$('button').attr('data-state'), 'in-queue');
  });
});
