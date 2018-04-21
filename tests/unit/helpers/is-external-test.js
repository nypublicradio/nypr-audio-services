import { isExternal } from 'dummy/helpers/is-external';
import { module, test } from 'qunit';

module('Unit | Helper | is external', function() {
  test('an external url returns true', function(assert) {
    let result = isExternal(["http://google.com"]);
    assert.ok(result, "google.com is an external url");
  });

  test('an internal url returns false', function(assert) {
    let result = isExternal(["/stories"]);
    assert.ok(!result, "/stories is an internal url");
  });

  test('a fully formed url the same with the same host returns false', function(assert) {
    let url = `${window.host}/test`
    let result = isExternal([url]);
    assert.ok(!result, "same host should return false");
  });
});
