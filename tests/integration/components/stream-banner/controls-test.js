import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | stream banner/controls', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{stream-banner/controls}}`);

    assert.equal(this.$('button').length, 1);

    // Template block usage:
    await render(hbs`
      {{#stream-banner/controls}}
        template block text
      {{/stream-banner/controls}}
    `);

    assert.equal(this.$().text().trim(), 'template block text');
  });
});
