var assert = require('assert');
var util = require('../src/js/util');

// console.log('TEST', util.parsePath('.items[3].name'));
// console.log('TEST', util.parsePath('.items[*].name'));

describe('util', function () {

  describe('sanitize', function () {

    it('should leave valid JSON as is', function () {
      assert.equal(util.sanitize('{"a":2}'), '{"a":2}');
    });

    it('should replace JavaScript with JSON', function () {
      assert.equal(util.sanitize('{a:2}'), '{"a":2}');
      assert.equal(util.sanitize('{\'a\':2}'), '{"a":2}');
      assert.equal(util.sanitize('{a:\'foo\'}'), '{"a":"foo"}');
      assert.equal(util.sanitize('{a:\'foo\',b:\'bar\'}'), '{"a":"foo","b":"bar"}');

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
      assert.equal(util.sanitize('/* foo */ {}'), ' {}');
      assert.equal(util.sanitize('{a:\'foo\',/*hello*/b:\'bar\'}'), '{"a":"foo","b":"bar"}');
      assert.equal(util.sanitize('{\na:\'foo\',//hello\nb:\'bar\'\n}'), '{\n"a":"foo",\n"b":"bar"\n}');

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

  describe('jsonPath', function () {

    it ('should parse a json path', function () {
      assert.deepEqual(util.parsePath(''), []);
      assert.deepEqual(util.parsePath('.foo'), ['foo']);
      assert.deepEqual(util.parsePath('.foo.bar'), ['foo', 'bar']);
      assert.deepEqual(util.parsePath('.foo[2]'), ['foo', 2]);
      assert.deepEqual(util.parsePath('.foo[2].bar'), ['foo', 2, 'bar']);
      assert.deepEqual(util.parsePath('.foo["prop with spaces"]'), ['foo', 'prop with spaces']);
      assert.deepEqual(util.parsePath('.foo[\'prop with single quotes as outputted by ajv library\']'), ['foo', 'prop with single quotes as outputted by ajv library']);
      assert.deepEqual(util.parsePath('.foo[*].bar'), ['foo', '*', 'bar']);
    });

    it ('should throw an exception in case of an invalid path', function () {
      assert.throws(function () {util.parsePath('.')}, /Error/);
      assert.throws(function () {util.parsePath('[')}, /Error/);
      assert.throws(function () {util.parsePath('[]')}, /Error/);
      assert.throws(function () {util.parsePath('.[]')}, /Error/);
      assert.throws(function () {util.parsePath('["23]')}, /Error/);
      assert.throws(function () {util.parsePath('.foo bar')}, /Error/);
    });

  });

  // TODO: thoroughly test all util methods
});