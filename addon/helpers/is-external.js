import { helper } from 'ember-helper';

export function isExternal([ url ]) {
  let urlParser = document.createElement('a');
  url = url || '';
  urlParser.href = url;
  return (urlParser.host !== window.location.host);
}

export default helper(isExternal);
