import assert from 'assert'
import {
  compileJSONPointer,
  findUniqueName,
  formatSize,
  get,
  getChildPaths,
  getIndexForPosition,
  isObject,
  isTimestamp,
  isValidationErrorChanged,
  limitCharacters,
  makeFieldTooltip,
  parsePath,
  parseString,
  removeReturnsAndSurroundingWhitespace,
  sort,
  sortObjectKeys,
  stringifyPath,
  uniqueMergeArrays
} from '../src/js/util'

describe('util', () => {
  describe('jsonPath', () => {
    it('should stringify an array of paths', () => {
      assert.deepStrictEqual(stringifyPath([]), '')
      assert.deepStrictEqual(stringifyPath(['foo']), '.foo')
      assert.deepStrictEqual(stringifyPath(['foo', 'bar']), '.foo.bar')
      assert.deepStrictEqual(stringifyPath(['foo', 2]), '.foo[2]')
      assert.deepStrictEqual(stringifyPath(['foo', 2, 'bar']), '.foo[2].bar')
      assert.deepStrictEqual(stringifyPath(['foo', 2, 'bar_baz']), '.foo[2].bar_baz')
      assert.deepStrictEqual(stringifyPath([2]), '[2]')
      assert.deepStrictEqual(stringifyPath(['foo', 'prop-with-hyphens']), '.foo["prop-with-hyphens"]')
      assert.deepStrictEqual(stringifyPath(['foo', 'prop with spaces']), '.foo["prop with spaces"]')
    })

    it('should parse a json path', () => {
      assert.deepStrictEqual(parsePath(''), [])
      assert.deepStrictEqual(parsePath('.foo'), ['foo'])
      assert.deepStrictEqual(parsePath('.foo.bar'), ['foo', 'bar'])
      assert.deepStrictEqual(parsePath('.foo[2]'), ['foo', 2])
      assert.deepStrictEqual(parsePath('.foo[2].bar'), ['foo', 2, 'bar'])
      assert.deepStrictEqual(parsePath('.foo["prop with spaces"]'), ['foo', 'prop with spaces'])
      assert.deepStrictEqual(parsePath('.foo[\'prop with single quotes as outputted by ajv library\']'), ['foo', 'prop with single quotes as outputted by ajv library'])
      assert.deepStrictEqual(parsePath('.foo["prop with . dot"]'), ['foo', 'prop with . dot'])
      assert.deepStrictEqual(parsePath('.foo["prop with ] character"]'), ['foo', 'prop with ] character'])
      assert.deepStrictEqual(parsePath('.foo[*].bar'), ['foo', '*', 'bar'])
      assert.deepStrictEqual(parsePath('[2]'), [2])
    })

    it('should throw an exception in case of an invalid path', () => {
      assert.throws(() => { parsePath('.') }, /Invalid JSON path: property name expected at index 1/)
      assert.throws(() => { parsePath('[') }, /Invalid JSON path: unexpected end, character ] expected/)
      assert.throws(() => { parsePath('[]') }, /Invalid JSON path: array value expected at index 1/)
      assert.throws(() => { parsePath('.foo[  ]') }, /Invalid JSON path: array value expected at index 7/)
      assert.throws(() => { parsePath('.[]') }, /Invalid JSON path: property name expected at index 1/)
      assert.throws(() => { parsePath('["23]') }, /Invalid JSON path: unexpected end, character " expected/)
      assert.throws(() => { parsePath('.foo bar') }, /Invalid JSON path: unexpected character " " at index 4/)
    })
  })

  describe('getIndexForPosition', () => {
    const el = {
      value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }

    it('happy flows - row and column in range', () => {
      assert.strictEqual(getIndexForPosition(el, 1, 1), 0)
      assert.strictEqual(getIndexForPosition(el, 2, 1), 124)
      assert.strictEqual(getIndexForPosition(el, 3, 8), 239)
      assert.strictEqual(getIndexForPosition(el, 4, 22), 356)
    })

    it('if range exceeds it should be considered as if it is last row or column length', () => {
      assert.strictEqual(getIndexForPosition(el, 1, 100000), 123)
      assert.strictEqual(getIndexForPosition(el, 100000, 1), 335)
      assert.strictEqual(getIndexForPosition(el, 100000, 100000), 445)
    })

    it('missing or wrong input sould return -1', () => {
      assert.strictEqual(getIndexForPosition(el), -1)
      assert.strictEqual(getIndexForPosition(el, undefined, 1), -1)
      assert.strictEqual(getIndexForPosition(el, 1, undefined), -1)
      assert.strictEqual(getIndexForPosition(el, -2, -2), -1)
    })
  })

  describe('isValidationErrorChanged', () => {
    const err1 = { keyword: 'enum', dataPath: '.gender', schemaPath: '#/properties/gender/enum', params: { allowedValues: ['male', 'female'] }, message: 'should be equal to one of: "male", "female"', schema: ['male', 'female'], parentSchema: { title: 'Gender', enum: ['male', 'female'] }, data: null, type: 'validation' }
    const err2 = { keyword: 'type', dataPath: '.age', schemaPath: '#/properties/age/type', params: { type: 'integer' }, message: 'should be integer', schema: 'integer', parentSchema: { description: 'Age in years', type: 'integer', minimum: 0, examples: [28, 32] }, data: '28', type: 'validation' }
    const err3 = { dataPath: '.gender', message: 'Member must be an object with properties "name" and "age"' }

    it('empty value for both current and previoues error should return false', () => {
      assert.strictEqual(isValidationErrorChanged(), false)
    })

    it('empty value for one of current and previoues error should return true', () => {
      assert.strictEqual(isValidationErrorChanged([err1]), true)
      assert.strictEqual(isValidationErrorChanged(undefined, [err1]), true)
    })

    it('different length of current and previoues errors should return true', () => {
      assert.strictEqual(isValidationErrorChanged([err1], []), true)
      assert.strictEqual(isValidationErrorChanged([err1], [err1, err2]), true)
    })

    it('same values for current and previoues errors should return false', () => {
      assert.strictEqual(isValidationErrorChanged([err1, err2, err3], [err2, err3, err1]), false)
    })

    it('different values for current and previoues errors should return true', () => {
      assert.strictEqual(isValidationErrorChanged([err1, err2], [err3, err1]), true)
    })
  })

  describe('get', () => {
    it('should get a nested property from an object', () => {
      const obj = {
        a: {
          b: 2
        },
        c: 3,
        d: null,
        e: undefined
      }

      assert.strictEqual(get(obj, ['a', 'b']), 2)
      assert.strictEqual(get(obj, ['c']), 3)
      assert.deepStrictEqual(get(obj, ['a']), { b: 2 })
      assert.strictEqual(get(obj, ['a', 'foo']), undefined)
      assert.strictEqual(get(obj, ['a', 'foo', 'bar']), undefined)
      assert.strictEqual(get(obj, ['d']), null)
      assert.strictEqual(get(obj, ['d', 'foo', 'bar']), null)
      assert.strictEqual(get(obj, ['e']), undefined)
    })
  })

  describe('makeFieldTooltip', () => {
    it('should return empty string when the schema is missing all relevant fields', () => {
      assert.strictEqual(makeFieldTooltip({}), '')
      assert.strictEqual(makeFieldTooltip({ additionalProperties: false }), '')
      assert.strictEqual(makeFieldTooltip(), '')
    })

    it('should make tooltips with only title', () => {
      assert.strictEqual(makeFieldTooltip({ title: 'foo' }), 'foo')
    })

    it('should make tooltips with only description', () => {
      assert.strictEqual(makeFieldTooltip({ description: 'foo' }), 'foo')
    })

    it('should make tooltips with only default', () => {
      assert.strictEqual(makeFieldTooltip({ default: 'foo' }), 'Default\n"foo"')
    })

    it('should make tooltips with only examples', () => {
      assert.strictEqual(makeFieldTooltip({ examples: ['foo', 'bar'] }), 'Examples\n"foo"\n"bar"')
    })

    it('should make tooltips with title and description', () => {
      assert.strictEqual(makeFieldTooltip({ title: 'foo', description: 'bar' }), 'foo\nbar')

      const longTitle = 'Lorem Ipsum Dolor'
      const longDescription = 'Duis id elit non ante gravida vestibulum non nec est. ' +
        'Proin vitae ligula at elit dapibus tempor. ' +
        'Etiam lacinia augue vel condimentum interdum. '
      assert.strictEqual(
        makeFieldTooltip({ title: longTitle, description: longDescription }),
        longTitle + '\n' + longDescription
      )
    })

    it('should make tooltips with title, description, and examples', () => {
      assert.strictEqual(
        makeFieldTooltip({ title: 'foo', description: 'bar', examples: ['baz'] }),
        'foo\nbar\n\nExamples\n"baz"'
      )
    })

    it('should make tooltips with title, description, default, and examples', () => {
      assert.strictEqual(
        makeFieldTooltip({ title: 'foo', description: 'bar', default: 'bat', examples: ['baz'] }),
        'foo\nbar\n\nDefault\n"bat"\n\nExamples\n"baz"'
      )
    })

    it('should handle empty fields', () => {
      assert.strictEqual(makeFieldTooltip({ title: '', description: 'bar' }), 'bar')
      assert.strictEqual(makeFieldTooltip({ title: 'foo', description: '' }), 'foo')
      assert.strictEqual(makeFieldTooltip({ description: 'bar', examples: [] }), 'bar')
      assert.strictEqual(makeFieldTooltip({ description: 'bar', examples: [''] }), 'bar\n\nExamples\n""')
    })

    it('should internationalize "Defaults" correctly', () => {
      assert.strictEqual(makeFieldTooltip({ default: 'foo' }, 'pt-BR'), 'Revelia\n"foo"')
    })

    it('should internationalize "Examples" correctly', () => {
      assert.strictEqual(makeFieldTooltip({ examples: ['foo'] }, 'pt-BR'), 'Exemplos\n"foo"')
    })
  })

  describe('getChildPaths', () => {
    it('should extract all child paths of an array containing objects', () => {
      const json = [
        { name: 'A', location: { latitude: 1, longitude: 2 } },
        { name: 'B', location: { latitude: 1, longitude: 2 } },
        { name: 'C', timestamp: 0 }
      ]

      assert.deepStrictEqual(getChildPaths(json), [
        '.location.latitude',
        '.location.longitude',
        '.name',
        '.timestamp'
      ])
    })

    it('should extract all child paths of an array containing objects, including objects', () => {
      const json = [
        { name: 'A', location: { latitude: 1, longitude: 2 } },
        { name: 'B', location: { latitude: 1, longitude: 2 } },
        { name: 'C', timestamp: 0 }
      ]

      assert.deepStrictEqual(getChildPaths(json, true), [
        '',
        '.location',
        '.location.latitude',
        '.location.longitude',
        '.name',
        '.timestamp'
      ])
    })

    it('should extract all child paths of an array containing values', () => {
      const json = [1, 2, 3]

      assert.deepStrictEqual(getChildPaths(json), [
        ''
      ])
    })

    it('should extract all child paths of a non-array', () => {
      assert.deepStrictEqual(getChildPaths({ a: 2, b: { c: 3 } }), [''])
      assert.deepStrictEqual(getChildPaths('foo'), [''])
      assert.deepStrictEqual(getChildPaths(123), [''])
    })
  })

  it('should test whether something is an object', () => {
    assert.strictEqual(isObject({}), true)
    assert.strictEqual(isObject(new Date()), true)
    assert.strictEqual(isObject([]), false)
    assert.strictEqual(isObject(2), false)
    assert.strictEqual(isObject(null), false)
    assert.strictEqual(isObject(undefined), false)
    assert.strictEqual(isObject(), false)
  })

  describe('sort', () => {
    it('should sort an array', () => {
      const array = [4, 1, 10, 2]
      assert.deepStrictEqual(sort(array), [1, 2, 4, 10])
      assert.deepStrictEqual(sort(array, '.', 'desc'), [10, 4, 2, 1])
    })

    it('should sort an array containing objects', () => {
      const array = [
        { value: 4 },
        { value: 1 },
        { value: 10 },
        { value: 2 }
      ]

      assert.deepStrictEqual(sort(array, '.value'), [
        { value: 1 },
        { value: 2 },
        { value: 4 },
        { value: 10 }
      ])

      assert.deepStrictEqual(sort(array, '.value', 'desc'), [
        { value: 10 },
        { value: 4 },
        { value: 2 },
        { value: 1 }
      ])
    })
  })

  describe('sortObjectKeys', () => {
    it('should sort the keys of an object', () => {
      const object = {
        c: 'c',
        a: 'a',
        b: 'b'
      }
      assert.strictEqual(JSON.stringify(object), '{"c":"c","a":"a","b":"b"}')
      assert.strictEqual(JSON.stringify(sortObjectKeys(object)), '{"a":"a","b":"b","c":"c"}')
      assert.strictEqual(JSON.stringify(sortObjectKeys(object, 'asc')), '{"a":"a","b":"b","c":"c"}')
      assert.strictEqual(JSON.stringify(sortObjectKeys(object, 'desc')), '{"c":"c","b":"b","a":"a"}')
    })
  })

  it('should parse a string', () => {
    assert.strictEqual(parseString('foo'), 'foo')
    assert.strictEqual(parseString('234foo'), '234foo')
    assert.strictEqual(parseString('  234'), 234)
    assert.strictEqual(parseString('234  '), 234)
    assert.strictEqual(parseString('2.3'), 2.3)
    assert.strictEqual(parseString('null'), null)
    assert.strictEqual(parseString('true'), true)
    assert.strictEqual(parseString('false'), false)
    assert.strictEqual(parseString('+1'), 1)
    assert.strictEqual(parseString('01'), '01')
    assert.strictEqual(parseString('001'), '001')
    assert.strictEqual(parseString('0.3'), 0.3)
    assert.strictEqual(parseString('0e3'), 0)
    assert.strictEqual(parseString(' '), ' ')
    assert.strictEqual(parseString(''), '')
    assert.strictEqual(parseString('"foo"'), '"foo"')
    assert.strictEqual(parseString('"2"'), '"2"')
    assert.strictEqual(parseString('\'foo\''), '\'foo\'')
  })

  it('should find a unique name', () => {
    assert.strictEqual(findUniqueName('other', [
      'a',
      'b',
      'c'
    ]), 'other')

    assert.strictEqual(findUniqueName('b', [
      'a',
      'b',
      'c'
    ]), 'b (copy)')

    assert.strictEqual(findUniqueName('b', [
      'a',
      'b',
      'c',
      'b (copy)'
    ]), 'b (copy 2)')

    assert.strictEqual(findUniqueName('b', [
      'a',
      'b',
      'c',
      'b (copy)',
      'b (copy 2)'
    ]), 'b (copy 3)')

    assert.strictEqual(findUniqueName('b (copy)', [
      'a',
      'b',
      'b (copy)',
      'b (copy 2)',
      'c'
    ]), 'b (copy 3)')

    assert.strictEqual(findUniqueName('b (copy 2)', [
      'a',
      'b',
      'b (copy)',
      'b (copy 2)',
      'c'
    ]), 'b (copy 3)')
  })

  it('should format a document size in a human readable way', () => {
    assert.strictEqual(formatSize(500), '500 B')
    assert.strictEqual(formatSize(900), '0.9 KB')
    assert.strictEqual(formatSize(77.89 * 1000), '77.9 KB')
    assert.strictEqual(formatSize(950 * 1000), '0.9 MB')
    assert.strictEqual(formatSize(7.22 * 1000 * 1000), '7.2 MB')
    assert.strictEqual(formatSize(945.4 * 1000 * 1000), '0.9 GB')
    assert.strictEqual(formatSize(22.37 * 1000 * 1000 * 1000), '22.4 GB')
    assert.strictEqual(formatSize(1000 * 1000 * 1000 * 1000), '1.0 TB')
  })

  it('should limit characters', () => {
    assert.strictEqual(limitCharacters('hello world', 11), 'hello world')
    assert.strictEqual(limitCharacters('hello world', 5), 'hello...')
    assert.strictEqual(limitCharacters('hello world', 100), 'hello world')
  })

  it('should compile a JSON pointer', () => {
    assert.strictEqual(compileJSONPointer(['foo', 'bar']), '/foo/bar')
    assert.strictEqual(compileJSONPointer(['foo', '/~ ~/']), '/foo/~1~0 ~0~1')
    assert.strictEqual(compileJSONPointer(['']), '/')
    assert.strictEqual(compileJSONPointer([]), '')
  })

  it('should test whether a field is a timestamp', () => {
    assert.strictEqual(isTimestamp('foo', 1574809200000), true)
    assert.strictEqual(isTimestamp('foo', 1574809200000.2), false)
  })

  it('regex should match whitespace and surrounding whitespace', () => {
    assert.strictEqual(
      removeReturnsAndSurroundingWhitespace(' \n A\nB  \nC  \n  D \n\n E F\n '),
      'ABCDE F')
  })

  describe('uniqueMergeArrays', () => {
    it('should merge arrays with unique values', () => {
      const arr1 = ['a', 'b', 'c', 'd', 'e']
      const arr2 = ['c', 'd', 'f', 'g']
      assert.deepStrictEqual(uniqueMergeArrays(arr1, arr2), ['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    })
  })

  // TODO: thoroughly test all util methods
})
