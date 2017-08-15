import QueueButton from 'nypr-audio-services/components/queue-button';
import computed from 'ember-computed';
import get from 'ember-metal/get';

function wnycEmbeddedAttr() {
  return computed('embeddedAttrs', {
    get(k) {
      return get(this, `embeddedAttrs.${k}`);
    },
    set(k, v) {
      return v;
    }
  });
}

export default QueueButton.extend({
  itemPK:      wnycEmbeddedAttr(),
  itemTitle:   wnycEmbeddedAttr(),
  type:        wnycEmbeddedAttr(),
  playContext: wnycEmbeddedAttr()
});
