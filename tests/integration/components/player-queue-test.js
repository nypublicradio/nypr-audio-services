import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import { copy } from '@ember/object/internals';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | player queue', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {

    const sessionStub = Service.extend({
      init() {
        this._super(...arguments);
        this.data = {};
      }
    });

    this.owner.register('service:session', sessionStub);
    this.session = this.owner.lookup('service:session');
  });


  const emptyQueue = {
    items: []
  };

  const queueWithItems = {
    items: [
      {id: 1, title: 'listitem-a'},
      {id: 2, title: 'listitem-b'},
      {id: 3, title: 'listitem-c'}
    ]
  };

  const nowPlayingEmpty = {
    queue: { items: []}
  };

  const nowPlayingWithItems = {
    isPlayingFromQueue: true,
    items: [
      {id: 2, title: 'listitem-b'},
      {id: 3, title: 'listitem-c'}
    ]
  };

  let story = {id: 1, title: 'listitem-a'}

  let DJ = {
    isPlaying: true,
    currentContentModel : story,
    currentContentId    : story.id,
    currentContentType  : 'story'
  }

  test('it renders', async function(assert) {
    await render(hbs`{{player-queue}}`);

    assert.ok(findAll('.player-queue').length, 'should render');
  });

  test('it renders with an empty queue', async function(assert) {
    this.set('queue', emptyQueue);
    await render(hbs`{{player-queue queue=queue}}`);

    assert.notOk(findAll('.list-item').length, 'should not render any queue list items');
    assert.ok(findAll('.queuelist-empty').length, 'should render an empty queue message div');
  });

  test('it renders a list of items', async function(assert) {
    this.set('queue', queueWithItems);
    await render(hbs`{{player-queue queue=queue}}`);

    assert.dom('.list-item').exists({ count: 3 }, 'should render list items');
    assert.ok(this.$('.list-item:contains(listitem-a)').length, 'should render title of list item 1');
    assert.ok(this.$('.list-item:contains(listitem-b)').length, 'should render title of list item 2');
    assert.ok(this.$('.list-item:contains(listitem-c)').length, 'should render title of list item 3');
    assert.notOk(findAll('.queuelist-empty').length, 'should not render an empty queue message div');
  });

  test('it renders the now playing item when playing from queue', async function(assert) {
    this.set('queue', nowPlayingWithItems);
    this.set('dj', DJ);
    await render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=true}}`);

    assert.dom('.list-item[data-test-name="now-playing-item"]').exists({ count: 1 }, 'should render one now playing item');
    assert.equal(this.$('.list-item[data-test-name="now-playing-item"]:contains(listitem-a)').length, 1, 'should render title of the now playing item');
    assert.ok(this.$('.list-item:contains(listitem-b)').length, 'should render title of list item 2');
    assert.ok(this.$('.list-item:contains(listitem-c)').length, 'should render title of list item 3');
  });

  test('it does not render the now playing item when not playing from queue', async function(assert) {
    this.set('queue', nowPlayingWithItems);
    this.set('dj', DJ);
    await render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=false}}`);

    assert.dom('.list-item[data-test-name="now-playing-item"]').doesNotExist('should not render now playing item');
  });

  test('it does not render the empty message when list is empty but now playing from queue', async function(assert) {
    this.set('queue', nowPlayingEmpty);
    this.set('dj', DJ);
    await render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=true}}`);

    assert.dom('.list-item[data-test-name="now-playing-item"]').exists({ count: 1 }, 'should render now playing item');
    assert.notOk(findAll('.queuelist-empty').length, 'should not render an empty queue message div');
  });

  test('it should call removeFromQueue action with the correct id', async function(assert) {
    assert.expect(1);
    let myQueueWithItems = copy(queueWithItems);
    myQueueWithItems.removeFromQueueById = function(id) {
       assert.equal(id, 2, 'should pass 2nd item id');
    };

    this.set('queue', myQueueWithItems);
    await render(hbs`{{player-queue queue=queue}}`);

    this.$('.queueitem-deletebutton')[1].click();
  });
});
