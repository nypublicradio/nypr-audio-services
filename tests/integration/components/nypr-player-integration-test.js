import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | nypr player integration', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{nypr-player-integration}}`);

    assert.dom(this.element).hasText('');

    // Template block usage:
    await render(hbs`
      {{#nypr-player-integration}}
        template block text
      {{/nypr-player-integration}}
    `);

    assert.dom(this.element).hasText('template block text');
  });
});
