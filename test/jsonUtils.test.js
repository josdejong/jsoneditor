import assert from 'assert'
import { stringifyPartial, containsArray } from '../src/js/jsonUtils'

describe('jsonUtils', () => {
  it('should stringify a small object', () => {
    const json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [1, 2, 3],
      f: { g: 'h' }
    }

    assert.strictEqual(stringifyPartial(json), '{"a":2,"b":"foo","c":null,"d":false,"e":[1,2,3],"f":{"g":"h"}}')
  })

  it('should stringify a small object with formatting', () => {
    const json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [1, 2, 3],
      f: { g: 'h' }
    }

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
        '}')

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
        '}')
  })

  it('should limit stringified output', () => {
    const json = {
      a: 2,
      b: 'foo',
      c: null,
      d: false,
      e: [1, 2, 3],
      f: { g: 'h' }
    }

    const all = '{"a":2,"b":"foo","c":null,"d":false,"e":[1,2,3],"f":{"g":"h"}}'
    const limit = 20

    assert.strictEqual(stringifyPartial(json, undefined, limit),
      all.slice(0, limit) + '...')

    assert.strictEqual(stringifyPartial(json, undefined, all.length), all)

    assert.strictEqual(stringifyPartial([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], undefined, 10),
      '[1,2,3,4,5...')

    assert.strictEqual(stringifyPartial(12345678, undefined, 4), '1234...')
  })

  it('should count array items', () => {
    // assert.strictEqual(countArrayItems('[1,2,3]'), 3)
    assert.strictEqual(containsArray('[]'), true)
    assert.strictEqual(containsArray(' []'), true)
    assert.strictEqual(containsArray(' \t  []'), true)
    assert.strictEqual(containsArray(' \t\n  []'), true)
    assert.strictEqual(containsArray('"["'), false)
    assert.strictEqual(containsArray('2'), false)
    assert.strictEqual(containsArray('null'), false)
    assert.strictEqual(containsArray('{}'), false)
  })
})
