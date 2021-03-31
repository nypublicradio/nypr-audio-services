import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setBreakpoint } from 'ember-responsive/test-support';

module('Integration | Component | nypr player integration/track info', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{nypr-player-integration/track-info media=media}}`);

    assert.dom(this.element).hasText('');
  });

  test('it displays story title and show title for medium and up', async function(assert) {
    setBreakpoint('nyprPlayerMediumAndUp');

    this.set('storyTitle', "The Story");
    this.set('storyUrl', "http://thestory/");
    this.set('showTitle', "The Show");
    this.set('showUrl', "http://theshow/");

    await render(
      hbs`{{nypr-player-integration/track-info showTitle=showTitle storyTitle=storyTitle showUrl=showUrl storyUrl=storyUrl media=media}}`
    );

    const expected = 'The Show - The Story';
    const actual = this.element.textContent.trim().replace(/\s+/g,' ');

    assert.equal(actual, expected, "overall text should be the same");

    assert.equal(this.$('a')[0].href, 'http://theshow/');
    assert.equal(this.$('a')[0].innerHTML, 'The Show');

    assert.equal(this.$('a')[1].href, 'http://thestory/');
    assert.equal(this.$('a')[1].innerHTML, 'The Story');
  });

  test('it reverses metadata order on small screens', async function(assert) {
    setBreakpoint('nyprPlayerSmallOnly');
    this.set('storyTitle', "The Story");
    this.set('storyUrl', "http://thestory/");
    this.set('showTitle', "The Show");
    this.set('showUrl', "http://theshow/");

    await render(
      hbs`{{nypr-player-integration/track-info showTitle=showTitle storyTitle=storyTitle showUrl=showUrl storyUrl=storyUrl media=media}}`
    );

    const expected = 'The Story - The Show';
    const actual = this.element.textContent.trim().replace(/\s+/g,' ');

    assert.equal(actual, expected, "overall text should be the same");

    assert.equal(this.$('a')[1].href, 'http://theshow/');
    assert.equal(this.$('a')[1].innerHTML, 'The Show');

    assert.equal(this.$('a')[0].href, 'http://thestory/');
    assert.equal(this.$('a')[0].innerHTML, 'The Story');
  });

  test('it displays song details as plain text', async function(assert) {
    setBreakpoint('nyprPlayerMediumAndUp');

    this.set('showTitle', "The Song Show");
    this.set('showUrl', "http://thesongshow/");
    this.set('songDetails', "title, composer, musician (instrument)");

    await render(
      hbs`{{nypr-player-integration/track-info showTitle=showTitle showUrl=showUrl songDetails=songDetails media=media}}`
    );

    const expected = 'The Song Show - title, composer, musician (instrument)';
    const actual = this.element.textContent.trim().replace(/\s+/g,' ');

    assert.equal(actual, expected, "overall text should be the same");

    assert.equal(this.$('a')[0].href, 'http://thesongshow/');
    assert.equal(this.$('a')[0].innerHTML, 'The Song Show');
  });

  test('it renders html tags in metadata', async function(assert) {
    setBreakpoint('nyprPlayerMediumAndUp');

    this.set('storyTitle', "The <strong>Big</strong> Story");
    this.set('showTitle', "The <em>New</em> Show");

    await render(hbs`{{nypr-player-integration/track-info showTitle=showTitle storyTitle=storyTitle media=media}}`);

    const expected = 'The New Show - The Big Story';
    const actual = this.element.textContent.trim().replace(/\s+/g,' ');

    assert.equal(actual, expected);
    assert.dom('em').exists({ count: 1 });
    assert.dom('strong').exists({ count: 1 });
  });
});
