import Component from '@ember/component';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const stub = Component.extend({
  layout: hbs`{{text}}`,
});

module('Integration | Component | text crawl', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('component:test-stub', stub);
  });

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{text-crawl}}`);

    assert.ok(this.$('.text-crawl-scroll').length);

    // Template block usage:
    await render(hbs`
      {{#text-crawl}}
        template block text
      {{/text-crawl}}
    `);

    assert.equal(this.$().text().trim(), 'template block text');
  });

  test('it updates the isScrolling property if text is too long', async function(assert) {
    assert.expect(1);

    this.set('longText', Array(10000).join('foo'));
    await render(hbs`
      {{#text-crawl watch=longText}}
        {{longText}}
      {{/text-crawl}}
    `);

    assert.ok(this.$().find('.is-scrolling').length, 'animation has begun');
  });
});
