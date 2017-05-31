import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import RSVP from 'rsvp';

const djStub = Ember.Service.extend({
  isReady: true,
  currentlyLoadingIds: []
});

moduleForComponent('listen-button', 'Integration | Component | listen button', {
  integration: true,

  beforeEach() {
    this.register('service:dj', djStub);
    this.inject.service('dj');
  }
});

test('it renders', function(assert) {
  this.render(hbs`{{listen-button}}`);
  assert.equal(this.$('button').length, 1);
});

test('it shows as playing only when current sound', function(assert) {
  let DJ = Ember.Object.create({
    isReady: true,
    isPlaying: true,
    currentContentId: 6444
  });

  this.set('dj', DJ);

  this.render(hbs`{{listen-button dj=dj itemPK=6444}}`);
  assert.equal(this.$('.is-playing').length,  1, 'button should have is-playing class if playing and current sound');
  assert.equal(this.$('.is-paused').length,  0, 'button should not have is-paused class if playing and current sound');
  assert.equal(this.$('.is-loading').length,  0, 'button should not have is-loading class if playing and current sound');

  Ember.run(() => {
    DJ.set('currentContentId', 1);
  });

  assert.equal(this.$('.is-playing').length,  0, 'button should not have is-playing if not current sound');
  assert.equal(this.$('.is-paused').length,  0, 'button should not have is-paused if not current sound');
});

test('it shows as loading when in djs list of loading ids', function(assert) {
  let DJ = Ember.Object.create({
    isReady: true,
    currentlyLoadingIds: ["6444"]
  });

  this.set('dj', DJ);

  this.render(hbs`{{listen-button dj=dj itemPK=6444}}`);
  assert.equal(this.$('.is-playing').length,  0, 'button should have is-playing class if playing and current sound');
  assert.equal(this.$('.is-paused').length,  0, 'button should not have is-paused class if playing and current sound');
  assert.equal(this.$('.is-loading').length,  1, 'button should not have is-loading class if playing and current sound');
});

test('button can be set to inactive manually, where it will not change state on the current sound', function(assert) {
  let DJ = Ember.Object.create({
    isReady: true,
    isPlaying: true,
    currentContentId: 6444
  });

  this.set('dj', DJ);

  this.render(hbs`{{listen-button dj=dj itemPK=6444 isCurrentSound=false}}`);
  assert.equal(this.$('.is-playing').length,  0, 'button should not have is-playing class');
  assert.equal(this.$('.is-paused').length,  0, 'button should not have is-paused class');
  assert.equal(this.$('.is-loading').length,  0, 'button should not have is-loading class');
});

test('it shows as paused when current sound is paused', function(assert) {
  let DJ = Ember.Object.create({
    isReady: true,
    isPlaying: false,
    currentContentId: 6444
  });

  this.set('dj', DJ);

  this.render(hbs`{{listen-button dj=dj itemPK=6444}}`);
  assert.equal(this.$('.is-playing').length,  0, 'button should not have is-playing class if paused and current sound');
  assert.equal(this.$('.is-paused').length,  1, 'button should have is-paused class if paused and current sound');
  assert.equal(this.$('.is-loading').length,  0, 'button should not have is-loading class if paused and current sound');
});

test('it renders as disabled when hifi is not ready', function(assert) {
  this.set('dj', Ember.Object.create({
    isReady: false
  }));

  this.render(hbs`{{listen-button dj=dj}}`);
  assert.equal(this.$('[disabled]').length,  1, 'button should be disabled');
});

test('it calls play on dj with info', function(assert) {
  assert.expect(2);

  let itemIdentifier = 'test-pk';
  let itemPlayContext = 'queue';

  let DJ = Ember.Object.create({
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

  this.render(hbs`{{listen-button dj=dj itemPK=itemPK playContext=playContext}}`);
  this.$('button').click();
});
