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
      assert.equal(util.sanitize('{a: 2}'), '{"a": 2}');
      assert.equal(util.sanitize('{\n  a: 2\n}'), '{\n  "a": 2\n}');
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

    it('should replace special white characters', function () {
      assert.equal(util.sanitize('{"a":\u00a0"foo\u00a0bar"}'), '{"a": "foo\u00a0bar"}');
      assert.equal(util.sanitize('{"a":\u2009"foo"}'), '{"a": "foo"}');
    });

    it('should escape unescaped control characters', function () {
      assert.equal(util.sanitize('"hello\bworld"'), '"hello\\bworld"')
      assert.equal(util.sanitize('"hello\fworld"'), '"hello\\fworld"')
      assert.equal(util.sanitize('"hello\nworld"'), '"hello\\nworld"')
      assert.equal(util.sanitize('"hello\rworld"'), '"hello\\rworld"')
      assert.equal(util.sanitize('"hello\tworld"'), '"hello\\tworld"')
      assert.equal(util.sanitize('{"value\n": "dc=hcm,dc=com"}'), '{"value\\n": "dc=hcm,dc=com"}')
    })

    it('should replace left/right quotes', function () {
      assert.equal(util.sanitize('\u2018foo\u2019'), '"foo"')
      assert.equal(util.sanitize('\u201Cfoo\u201D'), '"foo"')
      assert.equal(util.sanitize('\u0060foo\u00B4'), '"foo"')
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

    it('should strip trailing zeros', function () {
      // matching
      assert.equal(util.sanitize('[1,2,3,]'), '[1,2,3]');
      assert.equal(util.sanitize('[1,2,3,\n]'), '[1,2,3\n]');
      assert.equal(util.sanitize('[1,2,3,  \n  ]'), '[1,2,3  \n  ]');
      assert.equal(util.sanitize('{"a":2,}'), '{"a":2}');

      // not matching
      assert.equal(util.sanitize('"[1,2,3,]"'), '"[1,2,3,]"');
      assert.equal(util.sanitize('"{a:2,}"'), '"{a:2,}"');
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

  describe('getIndexForPosition', function () {
    var el = {
      value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    };

    it('happy flows - row and column in range', function () {
      assert.equal(util.getIndexForPosition(el, 1, 1), 0);
      assert.equal(util.getIndexForPosition(el, 2, 1), 124);
      assert.equal(util.getIndexForPosition(el, 3, 8), 239);
      assert.equal(util.getIndexForPosition(el, 4, 22), 356);
    });

    it('if range exceeds it should be considered as if it is last row or column length', function () {
      assert.equal(util.getIndexForPosition(el, 1, 100000), 123);
      assert.equal(util.getIndexForPosition(el, 100000, 1), 335);
      assert.equal(util.getIndexForPosition(el, 100000, 100000), 445);
    });

    it('missing or wrong input sould return -1', function () {
      assert.equal(util.getIndexForPosition(el), -1);
      assert.equal(util.getIndexForPosition(el, undefined, 1), -1);
      assert.equal(util.getIndexForPosition(el, 1, undefined), -1);
      assert.equal(util.getIndexForPosition(el, -2, -2), -1);
    });

  })
  // TODO: thoroughly test all util methods
});