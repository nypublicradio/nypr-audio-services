import { moduleForComponent, test } from 'ember-qunit';
import { copy } from 'ember-metal/utils';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

moduleForComponent('player-queue', 'Integration | Component | player queue', {
  integration: true
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

test('it renders', function(assert) {
  this.render(hbs`{{player-queue}}`);

  assert.ok(this.$('.player-queue').length, 'should render');
});

test('it renders with an empty queue', function(assert) {
  this.set('queue', emptyQueue);
  this.render(hbs`{{player-queue queue=queue}}`);

  assert.notOk(this.$('.list-item').length, 'should not render any queue list items');
  assert.ok(this.$('.queuelist-empty').length, 'should render an empty queue message div');
});

test('it renders a list of items', function(assert) {
  this.set('queue', queueWithItems);
  this.render(hbs`{{player-queue queue=queue}}`);

  assert.equal(this.$('.list-item').length, 3, 'should render list items');
  assert.ok(this.$('.list-item:contains(listitem-a)').length, 'should render title of list item 1');
  assert.ok(this.$('.list-item:contains(listitem-b)').length, 'should render title of list item 2');
  assert.ok(this.$('.list-item:contains(listitem-c)').length, 'should render title of list item 3');
  assert.notOk(this.$('.queuelist-empty').length, 'should not render an empty queue message div');
});

test('it renders the now playing item when playing from queue', function(assert) {
  this.set('queue', nowPlayingWithItems);
  this.set('dj', DJ);
  this.render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=true}}`);

  assert.equal(this.$('.list-item[data-test-name="now-playing-item"]').length, 1, 'should render one now playing item');
  assert.equal(this.$('.list-item[data-test-name="now-playing-item"]:contains(listitem-a)').length, 1, 'should render title of the now playing item');
  assert.ok(this.$('.list-item:contains(listitem-b)').length, 'should render title of list item 2');
  assert.ok(this.$('.list-item:contains(listitem-c)').length, 'should render title of list item 3');
});

test('it does not render the now playing item when not playing from queue', function(assert) {
  this.set('queue', nowPlayingWithItems);
  this.set('dj', DJ);
  this.render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=false}}`);

  assert.equal(this.$('.list-item[data-test-name="now-playing-item"]').length, 0, 'should not render now playing item');
});

test('it does not render the empty message when list is empty but now playing from queue', function(assert) {
  this.set('queue', nowPlayingEmpty);
  this.set('dj', DJ);
  this.render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=true}}`);

  assert.equal(this.$('.list-item[data-test-name="now-playing-item"]').length, 1, 'should render now playing item');
  assert.notOk(this.$('.queuelist-empty').length, 'should not render an empty queue message div');
});

test('it should call removeFromQueue action with the correct id', function(assert) {
  assert.expect(1);
  let myQueueWithItems = copy(queueWithItems);
  myQueueWithItems.removeFromQueueById = function(id) {
     assert.equal(id, 2, 'should pass 2nd item id');
  };

  this.set('queue', myQueueWithItems);
  this.render(hbs`{{player-queue queue=queue}}`);

  this.$('.queueitem-deletebutton')[1].click();
});

test('it sends the share action up', function(assert) {
  let receivedFrom, receivedInfo
  let shareAction = function(info, from) {
    receivedInfo = info;
    receivedFrom = from;
  }
  this.set('queue', nowPlayingEmpty);
  this.set('dj', DJ);
  this.set('shareAction', shareAction)

  this.render(hbs`{{player-queue queue=queue dj=dj playingFromQueue=true shareAction=(action shareAction)}}`);

  this.$('.nypr-popupmenu-button')[0].click();

  wait().then(() => {
    this.$('button:contains(Twitter)')[0].click();
  });

  return wait().then(() => {
    assert.equal(receivedFrom, 'Twitter', "should have received from Twitter");
    assert.ok(receivedInfo, "should have received info");
  });
});
