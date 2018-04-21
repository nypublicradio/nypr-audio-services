import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import hbs from 'htmlbars-inline-precompile';

const sessionStub = Service.extend({
  init() {
    this._super(...arguments);
    this.data = {
      'user-prefs-active-stream': {slug: 'wnyc-fm939', name: 'WNYC 93.9 FM'},
      'user-prefs-active-autoplay': 'default_stream'
    }
  },
});

module('Integration | Component | player notification/autoplay message', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  hooks.beforeEach(function() {
    this.owner.register('service:session', sessionStub);
    this.session = this.owner.lookup('service:session');
    this.server = startMirage();
  });

  hooks.afterEach(function() {
    this.server.shutdown();
  });

  test('it renders with the bumper duration countdown with stream message if stream is enabled', async function(assert) {
    this.server.create('stream', { slug: 'wnyc-fm939', name: 'WNYC 93.9FM', audioBumper: 'blergh' });
    this.setProperties({
      duration: 15000,
      position: 0,
      audioType: 'bumper',
      preferredStreamStub: {
        name: 'WNYC 93.9 FM'
      },
      streamEnabledStub: true
    });

    this.actions.dismiss = function() {
      assert.equal(this.$('.player-notification').length, 0);
    };

    await render(
      hbs`{{player-notification/autoplay-message preferredStream=preferredStreamStub streamEnabled=streamEnabledStub duration=duration position=position audioType=audioType}}`
    );

    let actualText = this.$().text().trim().replace(/\s{2,}/gm, ' ');
    let expectedText = 'Your episode is over. In 15 seconds, we\'ll tune you to WNYC 93.9 FM. Login to change settings.';
    assert.equal(actualText, expectedText);
  });

  test('it renders after the bumper duration countdown with stream message if stream is enabled', async function(assert) {
    this.server.create('stream', { slug: 'wnyc-fm939', name: 'WNYC 93.9FM', audioBumper: 'blerg' });
    this.setProperties({
      duration: 15000,
      position: 15500,
      audioType: 'bumper',
      preferredStreamStub: {
        name: 'WNYC 93.9 FM'
      },
      streamEnabledStub: true
    });

    this.actions.dismiss = function() {
      assert.equal(this.$('.player-notification').length, 0);
    };

    await render(
      hbs`{{player-notification/autoplay-message preferredStream=preferredStreamStub streamEnabled=streamEnabledStub duration=duration position=position audioType=audioType}}`
    );

    let actualElapsedText = this.$().text().trim().replace(/\s{2,}/gm, ' ');
    let expectedElapsedText = 'We tuned you to WNYC 93.9 FM after your episode ended. Login to change settings.';
    assert.equal(actualElapsedText, expectedElapsedText);
  });

  test('it renders with the bumper duration countdown with queue message if stream is disabled', async function(assert) {
    this.server.create('stream', { slug: 'wnyc-fm939', name: 'WNYC 93.9FM', audioBumper: 'blergh' });
    this.setProperties({
      duration: 15000,
      position: 0,
      audioType: 'bumper',
      preferredStreamStub: {
        name: 'WNYC 93.9 FM'
      },
      streamEnabledStub: false
    });

    this.actions.dismiss = function() {
      assert.equal(this.$('.player-notification').length, 0);
    };

    await render(
      hbs`{{player-notification/autoplay-message preferredStream=preferredStreamStub streamEnabled=streamEnabledStub duration=duration position=position audioType=audioType}}`
    );

    let actualText = this.$().text().trim().replace(/\s{2,}/gm, ' ');
    let expectedText = 'Your episode is over. In 15 seconds, your audio queue will begin to play. Login to change settings.';
    assert.equal(actualText, expectedText);
  });

  test('it renders after the bumper duration countdown with queue message if stream is disabled', async function(assert) {
    this.server.create('stream', { slug: 'wnyc-fm939', name: 'WNYC 93.9FM', audioBumper: 'blerg' });
    this.setProperties({
      duration: 15000,
      position: 15500,
      audioType: 'bumper',
      preferredStreamStub: {
        name: 'WNYC 93.9 FM'
      },
      streamEnabledStub: false
    });

    this.actions.dismiss = function() {
      assert.equal(this.$('.player-notification').length, 0);
    };

    await render(
      hbs`{{player-notification/autoplay-message preferredStream=preferredStreamStub streamEnabled=streamEnabledStub duration=duration position=position audioType=audioType}}`
    );

    let actualElapsedText = this.$().text().trim().replace(/\s{2,}/gm, ' ');
    let expectedElapsedText = 'We began playing your audio queue after your episode ended. Login to change settings.';
    assert.equal(actualElapsedText, expectedElapsedText);
  });

  test('it renders with the bumper duration countdown with stream message if stream is enabled when logged in', async function(assert) {
    this.server.create('stream', { slug: 'wnyc-fm939', name: 'WNYC 93.9FM', audioBumper: 'blergh' });
    this.setProperties({
      isLoggedIn: true,
      duration: 15000,
      position: 0,
      audioType: 'bumper',
      preferredStreamStub: {
        name: 'WNYC 93.9 FM'
      },
      streamEnabledStub: true
    });

    this.actions.dismiss = function() {
      assert.equal(this.$('.player-notification').length, 0);
    };

    await render(
      hbs`{{player-notification/autoplay-message preferredStream=preferredStreamStub streamEnabled=streamEnabledStub duration=duration position=position audioType=audioType isLoggedIn=isLoggedIn}}`
    );

    let actualText = this.$().text().trim().replace(/\s{2,}/gm, ' ');
    let expectedText = 'Your episode is over. In 15 seconds, we\'ll tune you to WNYC 93.9 FM. Change Settings';
    assert.equal(actualText, expectedText);
  });
});
