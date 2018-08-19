import { deleteIn, existsIn, getIn, insertAt, setIn, transform, updateIn } from './immutabilityHelpers'

test('getIn', () => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3,
    e: [
      4,
      {
        f: 5,
        g: 6
      }
    ]
  }

  expect(getIn(obj, ['a', 'b'])).toEqual({c: 2})
  expect(getIn(obj, ['e', '1', 'f'])).toEqual(5)
  expect(getIn(obj, ['e', '999', 'f'])).toBeUndefined()
  expect(getIn(obj, ['non', 'existing', 'path'])).toBeUndefined()
})

test('setIn basic', () => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = setIn(obj, ['a', 'b', 'c'], 4)
  expect(updated).toEqual({
    a: {
      b: {
        c: 4
      }
    },
    d: 3
  })

  // original should be unchanged
  expect(obj).toEqual({
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  })

  expect(obj).not.toBe(updated)
})

test('setIn non existing path', () => {
  const obj = {}

  expect(() => setIn(obj, ['a', 'b', 'c'], 4)).toThrow(/Path does not exist/)
})

test('setIn replace value with object should throw an exception', () => {
  const obj = {
    a: 42,
    d: 3
  }

  expect(()  => setIn(obj, ['a', 'b', 'c'], 4)).toThrow(/Path does not exist/)
})

test('setIn replace value inside nested array', () => {
  const obj = {
    a: [
      1,
      2,
      {
        b: 3,
        c: 4
      }
    ],
    d: 5
  }

  const updated = setIn(obj, ['a', '2', 'c'], 8)

  expect(updated).toEqual({
    a: [
      1,
      2,
      {
        b: 3,
        c: 8
      }
    ],
    d: 5
  })
})

test('setIn identical value should return the original object', () => {
  const obj = {a:1, b:2}

  const updated = setIn(obj, ['b'], 2)

  expect(updated).toBe(obj) // strict equal
})

test('setIn identical value should return the original object (2)', () => {
  const obj = {a:1, b: { c: 2}}

  const updated = setIn(obj, ['b', 'c'], 2)

  expect(updated).toBe(obj) // strict equal
})

test('updateIn', () => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'b', 'c'], (value) => value + 100)
  expect(updated).toEqual({
    a: {
      b: {
        c: 102
      }
    },
    d: 3
  })

  // original should be unchanged
  expect(obj).toEqual({
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  })

  expect(obj).not.toBe(updated)
})

test('updateIn (2)', () => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'b' ], (obj) => [1,2,3])
  expect(updated).toEqual({
    a: {
      b: [1,2,3]
    },
    d: 3
  })
})

test('updateIn (3)', () => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'e' ], (value) => 'foo-' + value)
  expect(updated).toEqual({
    a: {
      b: {
        c: 2
      },
      e: 'foo-undefined'
    },
    d: 3
  })
})

test('updateIn return identical value should return the original object', () => {
  const obj = {
    a: 2,
    b: 3
  }

  const updated = updateIn(obj, ['b' ], (value) => 3)
  expect(updated).toBe(obj)
})

test('deleteIn', () => {
  const obj = {
    a: {
      b: {
        c: 2,
        d: 3
      }
    },
    e: 4
  }

  const updated = deleteIn(obj, ['a', 'b', 'c'])
  expect(updated).toEqual({
    a: {
      b: {
        d: 3
      }
    },
    e: 4
  })

  // original should be unchanged
  expect(obj).toEqual({
    a: {
      b: {
        c: 2,
        d: 3
      }
    },
    e: 4
  })

  expect(obj).not.toBe(updated)
})

test('deleteIn array', () => {
  const obj = {
    a: {
      b: [1, {c: 2, d: 3} , 4]
    },
    e: 5
  }

  const updated = deleteIn(obj, ['a', 'b', '1', 'c'])
  expect(updated).toEqual({
    a: {
      b: [1, {d: 3} , 4]
    },
    e: 5
  })

  // original should be unchanged
  expect(obj).toEqual({
    a: {
      b: [1, {c: 2, d: 3} , 4]
    },
    e: 5
  })

  expect(obj).not.toBe(updated)
})

test('deleteIn non existing path', () => {
  const obj = { a: {}}

  const updated = deleteIn(obj, ['a', 'b'])
  expect(updated).toBe(obj)
})

test('insertAt', () => {
  const obj = { a: [1,2,3]}

  const updated = insertAt(obj, ['a', '2'], 8)
  expect(updated).toEqual({a: [1,2,8,3]})
})

test('transform (no change)', () => {
  const eson = {a: [1,2,3], b: {c: 4}}
  const updated = transform(eson, (value, path) => value)
  expect(updated).toBe(eson)
})

test('transform (change based on value)', () => {
  const eson = {a: [1,2,3], b: {c: 4}}

  const updated = transform(eson,
      (value, path) => value === 2 ? 20 : value)
  const expected = {a: [1,20,3], b: {c: 4}}

  expect(updated).toEqual(expected)
  expect(updated.b).toBe(eson.b) // should not have replaced b
})

test('transform (change based on path)', () => {
  const eson = {a: [1,2,3], b: {c: 4}}

  const updated = transform(eson,
      (value, path) => path.join('.') === 'a.1' ? 20 : value)
  const expected = {a: [1,20,3], b: {c: 4}}

  expect(updated).toEqual(expected)
  expect(updated.b).toBe(eson.b) // should not have replaced b
})

test('existsIn', () => {
  const json = {
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  }

  expect(existsIn(json, ['obj', 'arr', 2, 'first'])).toEqual(true)
  expect(existsIn(json, ['obj', 'foo'])).toEqual(false)
  expect(existsIn(json, ['obj', 'foo', 'bar'])).toEqual(false)
  expect(existsIn(json, [])).toEqual(true)
})
