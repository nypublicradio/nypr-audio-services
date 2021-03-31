import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | stream banner/station name', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    this.set('activeStream', {name: 'foo'});
    await render(hbs`{{stream-banner/station-name activeStream=activeStream}}`);

    assert.dom(this.element).hasText('foo');

    // // Template block usage:
    // this.render(hbs`
    //   {{#stream-banner/station-name}}
    //     template block text
    //   {{/stream-banner/station-name}}
    // `);
    // 
    // assert.equal(this.$().text().trim(), 'template block text');
  });
});
