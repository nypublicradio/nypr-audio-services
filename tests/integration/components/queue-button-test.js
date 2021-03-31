import { run } from '@ember/runloop';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | queue button', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    const queueStub = Service.extend({
      removeFromQueueById() {},
      addToQueueById() {},

      init() {
        this._super(...arguments);
        this.items = [];
      }
    });

    this.owner.register('service:listen-queue', queueStub);
    this.queue = this.owner.lookup('service:listen-queue');
  });

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{queue-button}}`);

    assert.dom(this.element).hasText('Queue');
  });

  test('queue button "unqueued" state', async function(assert) {
    this.set('addToQueue', () => assert.ok('calls addToQueue on click'));
    await render(hbs`{{queue-button queue=queue}}`);

    assert.dom('button').doesNotHaveAttribute('data-state');

    await click('button');
  });

  test('queue button "queued" state', async function(assert) {
    this.set('removeFromQueueById', () => assert.ok('calls removeFromQueue on click'));

    await render(hbs`{{queue-button inQueue=true}}`);

    assert.dom('button').hasAttribute('data-state', 'in-queue');

    await click('button');
  });

  test('queue buttons inQueue prop updates', async function(assert) {
    await render(hbs`{{queue-button itemPK=1}}`);
    assert.dom('button').doesNotHaveAttribute('data-state');

    run(() => {
      this.get('queue.items').pushObject({id: 1});
    });
    run(() => {
      assert.dom('button').hasAttribute('data-state', 'in-queue');
    });
  });
});
