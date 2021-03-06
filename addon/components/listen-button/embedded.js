import ListenButton from '../listen-button';
import { get, computed } from '@ember/object';
import hbs from 'htmlbars-inline-precompile';

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

export default ListenButton.extend({
  itemPK:       wnycEmbeddedAttr(),
  itemTitle:    wnycEmbeddedAttr(),
  itemShow:     wnycEmbeddedAttr(),
  duration:     wnycEmbeddedAttr(),
  playContext:  wnycEmbeddedAttr(),
  type:         wnycEmbeddedAttr(),
  content:      wnycEmbeddedAttr(),

  layout: hbs`
    {{listen-button/ui type=type}}
    {{#unless content}}
      {{#if (eq type 'blue-boss')}}Listen{{#if duration}} <span class="text--small dimmed">{{duration}}</span>{{/if}}{{/if}}
    {{else}}
      {{content}}
    {{/unless}}`
});
