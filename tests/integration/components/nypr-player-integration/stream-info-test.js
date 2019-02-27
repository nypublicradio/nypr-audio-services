import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | nypr player integration/stream info', function(hooks) {
  setupRenderingTest(hooks);

  test('it shows streamPlaylistUrl if provided', async function(assert) {
    this.set('streamPlaylistUrl', 'http://streamsplaylist/');
    await render(hbs`{{nypr-player-integration/stream-info streamPlaylistUrl=streamPlaylistUrl}}`);

    assert.equal(this.$('a[title="Music Play History"]')[0].href, "http://streamsplaylist/");

    this.set('streamPlaylistUrl', false);
    assert.equal(this.$('a[title="Music Play History"]').length, 0);
  });

  test('it shows streamScheduleUrl', async function(assert) {
    this.set('streamScheduleUrl', 'http://streamsschedule/');
    await render(hbs`{{nypr-player-integration/stream-info streamScheduleUrl=streamScheduleUrl}}`);

    assert.equal(this.$('a[title="Schedule"]')[0].href, "http://streamsschedule/");
  });
});
