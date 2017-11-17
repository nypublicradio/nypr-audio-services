import QueueButton from 'nypr-audio-services/components/queue-button';
import { get, computed } from '@ember/object';

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
