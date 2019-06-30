var assert = require('assert');
var stringifyPartial = require('../src/js/jsonUtils').stringifyPartial;

describe('jsonUtils', function () {

  it('should stringify a small object', function () {
    var json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [ 1, 2, 3],
      f: { g: 'h' }
    };

    assert.strictEqual(stringifyPartial(json), '{"a":2,"b":"foo","c":null,"d":false,"e":[1,2,3],"f":{"g":"h"}}');
  });

  it('should stringify a small object with formatting', function () {
    var json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [ 1, 2, 3],
      f: { g: 'h' }
    };

    assert.strictEqual(stringifyPartial(json, 2),
        '{\n' +
        '  "a": 2,\n' +
        '  "b": "foo",\n' +
        '  "c": null,\n' +
        '  "d": false,\n' +
        '  "e": [\n' +
        '    1,\n' +
        '    2,\n' +
        '    3\n' +
        '  ],\n' +
        '  "f": {\n' +
        '    "g": "h"\n' +
        '  }\n' +
        '}');

    assert.strictEqual(stringifyPartial(json, '    '), '{\n' +
        '    "a": 2,\n' +
        '    "b": "foo",\n' +
        '    "c": null,\n' +
        '    "d": false,\n' +
        '    "e": [\n' +
        '        1,\n' +
        '        2,\n' +
        '        3\n' +
        '    ],\n' +
        '    "f": {\n' +
        '        "g": "h"\n' +
        '    }\n' +
        '}');
  });

  it('should limit stringified output', function () {
    var json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [ 1, 2, 3],
      f: { g: 'h' }
    };

    var all = '{"a":2,"b":"foo","c":null,"d":false,"e":[1,2,3],"f":{"g":"h"}}';
    var limit = 20;

    assert.strictEqual(stringifyPartial(json, undefined, limit),
        all.slice(0, limit));

    assert.strictEqual(stringifyPartial([1,2,3,4,5,6,7,8,9,10], undefined, 10),
        '[1,2,3,4,5');
  });

});