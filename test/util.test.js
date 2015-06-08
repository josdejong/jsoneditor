var assert = require('assert');
var util = require('../src/js/util');

describe('util', function () {

  describe('sanitize', function () {

    it('should leave valid JSON as is', function () {
      assert.equal(util.sanitize('{"a":2}'), '{"a":2}');
    });

    it('should replace JavaScript with JSON', function () {
      assert.equal(util.sanitize('{a:2}'), '{"a":2}');
      assert.equal(util.sanitize('{\'a\':2}'), '{"a":2}');
      assert.equal(util.sanitize('{a:\'foo\'}'), '{"a":"foo"}');

      // should leave string content untouched
      assert.equal(util.sanitize('"{a:b}"'), '"{a:b}"');
    });

    it('should add/remove escape characters', function () {
      assert.equal(util.sanitize('"foo\'bar"'), '"foo\'bar"');
      assert.equal(util.sanitize('"foo\\"bar"'), '"foo\\"bar"');
      assert.equal(util.sanitize('\'foo"bar\''), '"foo\\"bar"');
      assert.equal(util.sanitize('\'foo\\\'bar\''), '"foo\'bar"');
      assert.equal(util.sanitize('"foo\\\'bar"'), '"foo\'bar"');
    });

    it('remove comments', function () {
      assert.equal(util.sanitize('/* foo */ {}'), ' {}');

      // should not remove comments in string
      assert.equal(util.sanitize('{"str":"/* foo */"}'), '{"str":"/* foo */"}');
    });

    it('should strip JSONP notation', function () {
      // matching
      assert.equal(util.sanitize('callback_123({});'), '{}');
      assert.equal(util.sanitize('callback_123([]);'), '[]');
      assert.equal(util.sanitize('callback_123(2);'), '2');
      assert.equal(util.sanitize('callback_123("foo");'), '"foo"');
      assert.equal(util.sanitize('callback_123(null);'), 'null');
      assert.equal(util.sanitize('callback_123(true);'), 'true');
      assert.equal(util.sanitize('callback_123(false);'), 'false');
      assert.equal(util.sanitize('/* foo bar */ callback_123 ({})'), '{}');
      assert.equal(util.sanitize('/* foo bar */ callback_123 ({})'), '{}');
      assert.equal(util.sanitize('/* foo bar */\ncallback_123({})'), '{}');
      assert.equal(util.sanitize('/* foo bar */ callback_123 (  {}  )'), '  {}  ');
      assert.equal(util.sanitize('  /* foo bar */   callback_123 ({});  '), '{}');
      assert.equal(util.sanitize('\n/* foo\nbar */\ncallback_123 ({});\n\n'), '{}');

      // non-matching
      assert.equal(util.sanitize('callback abc({});'), 'callback abc({});');
      assert.equal(util.sanitize('callback {}'), 'callback {}');
      assert.equal(util.sanitize('callback({}'), 'callback({}');
    });

  });

  // TODO: thoroughly test all util methods
});