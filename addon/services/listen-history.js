import { A } from '@ember/array';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';

export default Service.extend({
  session: service(),
  store  : service(),
  items  : readOnly('session.data.listens'),
  hifi   : service(),

  init() {
    this.listenForTrackChanges();
    this._super(...arguments);
  },

  listenForTrackChanges() {
    this.hifi.on('current-sound-changed', (currentSound) => {
      let contentModelType = get(currentSound, 'metadata.contentModelType');
      let contentModel     = get(currentSound, 'metadata.contentModel');

      if (contentModel && contentModelType === 'story') {
        this.addListen(contentModel);
      }
    });
  },

  addListen(story) {
    let session  = this.session;
    let listens  = A(session.getWithDefault('data.listens', []).slice());

    let listen = {
      id: `listen${Date.now()}-${(Math.random() * 100).toFixed()}`,
      story: story
    };

    listens.unshiftObject(listen);
    session.set('data.listens', listens);
  },

  removeListenByListenId(id) {
    let session = this.session;
    let listens = A(session.getWithDefault('data.listens', []).slice());

    let listen = listens.findBy('id', id);
    listens.removeObject(listen);
    session.set('data.listens', listens);
  },

  removeListenByStoryPk(pk) {
    let session = this.session;
    let listens = A(session.getWithDefault('data.listens', []).slice());

    let listen = listens.findBy('story.id', pk);
    listens.removeObject(listen);
    session.set('data.listens', listens);
  },

  clearHistory() {
    let session = this.session;
    session.set('data.listens', []);
  },

  hasListenedTo(id) {
    return this.historyFor(id).length > 0;
  },

  historyFor(id) {
    let session = this.session;
    let listens = A(session.getWithDefault('data.listens', []));
    return listens.filterBy('story.id', id);
  },

  indexByStoryPk(pk) {
    let session = this.session;
    let listens = A(session.getWithDefault('data.listens', []));
    let listen = listens.findBy('story.id', pk);

    return listens.indexOf(listen);
  }
});
