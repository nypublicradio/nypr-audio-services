import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

module('Integration | Component | queue listitem', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{queue-listitem}}`);

    assert.dom('.queueitem').exists({ count: 1 });
  });

  test('it displays the correct metadata', async function(assert) {
    this.set('story', {
      headers: {brand: {title: 'Show Title', url: '/'}},
      title: 'Story Title',
      showTitle: 'Show Title',
      audioDurationReadable: '3 min'
    });
    await render(hbs`{{queue-listitem story=story}}`);

    assert.dom('.queueitem-itemtitle').hasText('Story Title');
    assert.dom('.queueitem-showtitle').hasText('Show Title');
    assert.dom('.queueitem-duration').hasText('3 min');
  });

  test('it calls the removeAction with the story id', async function(assert) {
    let remove = sinon.spy();
    this.set('story', {id: 5});
    this.set('removeAction', remove);
    await render(hbs`{{queue-listitem story=story removeAction=removeAction}}`);

    await click('.queueitem-deletebutton');

    assert.ok(remove.calledOnce);
    assert.ok(remove.calledWith(5));
  });

  test('it renders html in metadata', async function(assert) {
    this.set('story', {
      headers: {brand: {title: 'The <em>New</em> Show', url: '/'}},
      title: 'The <strong>Big</strong> Story',
      showTitle: 'The <em>New</em> Show',
    });
    await render(hbs`{{queue-listitem story=story}}`);

    assert.dom('.queueitem-itemtitle').hasText('The Big Story');
    assert.dom('.queueitem-showtitle').hasText('The New Show');
    assert.dom('.queueitem-itemtitle strong').exists({ count: 1 });
    assert.dom('.queueitem-showtitle em').exists({ count: 1 });
  });

  test('it shows the now playing if it is the current item when playing from queue', async function(assert) {
    this.set('playContext', 'queue');
    await render(hbs`{{queue-listitem playContext=playContext isCurrent=true}}`);

    assert.dom('.queueitem-playingicon').exists({ count: 1 });
  });
});
