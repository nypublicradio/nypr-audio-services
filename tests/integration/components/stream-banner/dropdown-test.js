import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | stream banner/dropdown', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{stream-banner/dropdown}}`);

    assert.equal(this.$().text().trim(), 'Change stream');

    // // Template block usage:
    // this.render(hbs`
    //   {{#stream-banner/dropdown}}
    //     template block text
    //   {{/stream-banner/dropdown}}
    // `);
    // 
    // assert.equal(this.$().text().trim(), 'template block text');
  });
});
