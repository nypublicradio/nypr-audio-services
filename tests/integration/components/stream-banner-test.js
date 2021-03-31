import { module, skip, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | stream banner', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{stream-banner}}`);
    assert.dom('.stream-banner').exists({ count: 1 }, 'it should render');
  });

  skip('it renders a dropdown of the given stream options');

  skip('it yields the activeStream');

  skip('takes a background image');
});
