import { run } from '@ember/runloop';
import EmberObject from '@ember/object';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import RSVP from 'rsvp';

const djStub = Service.extend({
  isReady: true,

  init() {
    this._super(...arguments);
    this.currentlyLoadingIds = [];
  }
});

module('Integration | Component | listen button', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:dj', djStub);
    this.dj = this.owner.lookup('service:dj');
  });

  test('it renders', async function(assert) {
    await render(hbs`{{listen-button}}`);
    assert.dom('button').exists({ count: 1 });
  });

  test('it shows as playing only when current sound', async function(assert) {
    let DJ = EmberObject.create({
      isReady: true,
      isPlaying: true,
      currentContentId: 6444
    });

    this.set('dj', DJ);

    await render(hbs`{{listen-button dj=dj itemPK=6444}}`);
    assert.dom('.is-playing').exists(
      { count: 1 },
      'button should have is-playing class if playing and current sound'
    );
    assert.dom('.is-current-sound').exists({ count: 1 }, 'button should have is-current-sound if current sound');
    assert.dom('.is-paused').doesNotExist('button should not have is-paused class if playing and current sound');
    assert.dom('.is-loading').doesNotExist('button should not have is-loading class if playing and current sound');

    run(() => {
      DJ.set('currentContentId', 1);
    });

    assert.dom('.is-playing').doesNotExist('button should not have is-playing if not current sound');
    assert.dom('.is-paused').exists({ count: 1 }, 'button should have is-paused if not current sound');
    assert.dom('.is-current-sound').doesNotExist('button should not have is-current-sound if not current sound');
  });

  test('it shows as loading when in djs list of loading ids', async function(assert) {
    let DJ = EmberObject.create({
      isReady: true,
      currentlyLoadingIds: ["6444"]
    });

    this.set('dj', DJ);

    await render(hbs`{{listen-button dj=dj itemPK=6444}}`);
    assert.dom('.is-playing').doesNotExist('button should have is-playing class if loading and current sound');
    assert.dom('.is-paused').doesNotExist('button should not have is-paused class if loading and current sound');
    assert.dom('.is-loading').exists(
      { count: 1 },
      'button should have is-loading class if loading and current sound'
    );
    assert.dom('.is-current-sound').doesNotExist('button should not have is-current-sound if loading and not current sound');
  });

  test('button can be set to inactive manually, where it will not change state on the current sound', async function(assert) {
    let DJ = EmberObject.create({
      isReady: true,
      isPlaying: true,
      currentContentId: 6444
    });

    this.set('dj', DJ);

    await render(hbs`{{listen-button dj=dj itemPK=6444 isCurrentSound=false}}`);
    assert.dom('.is-playing').doesNotExist('button should not have is-playing class');
    assert.dom('.is-paused').exists({ count: 1 }, 'button should have is-paused class');
    assert.dom('.is-loading').doesNotExist('button should not have is-loading class');
    assert.dom('.is-current-sound').doesNotExist('button should not have is-current-sound class');
  });

  test('it shows as paused when current sound is paused', async function(assert) {
    let DJ = EmberObject.create({
      isReady: true,
      isPlaying: false,
      currentContentId: 6444
    });

    this.set('dj', DJ);

    await render(hbs`{{listen-button dj=dj itemPK=6444}}`);
    assert.dom('.is-playing').doesNotExist('button should not have is-playing class if paused and current sound');
    assert.dom('.is-paused').exists(
      { count: 1 },
      'button should have is-paused class if paused and current sound'
    );
    assert.dom('.is-loading').doesNotExist('button should not have is-loading class if paused and current sound');
    assert.dom('.is-current-sound').exists(
      { count: 1 },
      'button should have is-current-sound if paused and current sound'
    );
  });

  test('it renders as disabled when hifi is not ready', async function(assert) {
    this.set('dj', EmberObject.create({
      isReady: false
    }));

    await render(hbs`{{listen-button dj=dj}}`);
    assert.dom('[disabled]').exists({ count: 1 }, 'button should be disabled');
  });

  test('it calls play on dj with info', async function(assert) {
    assert.expect(2);

    let itemIdentifier = 'test-pk';
    let itemPlayContext = 'queue';

    let DJ = EmberObject.create({
      isReady: true,
      play(itemIdOrItem, options) {
        assert.equal(itemIdOrItem, itemIdentifier, "item identifier should be test identifier");
        assert.equal(options.playContext, itemPlayContext, "play context should be expected play context");

        return RSVP.Promise.resolve({});
      },
    });

    this.set('playContext', itemPlayContext);
    this.set('itemPK', itemIdentifier);
    this.set('dj', DJ);

    await render(hbs`{{listen-button dj=dj itemPK=itemPK playContext=playContext}}`);
    await click('button');
  });
});
