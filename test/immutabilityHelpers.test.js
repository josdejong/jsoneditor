import test from 'ava';
import { getIn, setIn, updateIn, deleteIn, insertAt } from '../src/utils/immutabilityHelpers'


test('getIn', t => {
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

  t.deepEqual(getIn(obj, ['a', 'b']), {c: 2})
  t.is(getIn(obj, ['e', '1', 'f']), 5)
  t.is(getIn(obj, ['e', '999', 'f']), undefined)
  t.is(getIn(obj, ['non', 'existing', 'path']), undefined)
})

test('setIn basic', t => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = setIn(obj, ['a', 'b', 'c'], 4)
  t.deepEqual (updated, {
    a: {
      b: {
        c: 4
      }
    },
    d: 3
  })

  // original should be unchanged
  t.deepEqual (obj, {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  })

  t.truthy (obj !== updated)
})

test('setIn non existing path', t => {
  const obj = {}

  t.throws(() => setIn(obj, ['a', 'b', 'c'], 4), /Path does not exist/)
})

test('setIn replace value with object should throw an exception', t => {
  const obj = {
    a: 42,
    d: 3
  }

  t.throws(()  => setIn(obj, ['a', 'b', 'c'], 4), /Path does not exist/)
})

test('setIn replace value inside nested array', t => {
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

  t.deepEqual (updated, {
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

test('setIn identical value should return the original object', t => {
  const obj = {a:1, b:2}

  const updated = setIn(obj, ['b'], 2)

  t.is(updated, obj) // strict equal
})

test('setIn identical value should return the original object (2)', t => {
  const obj = {a:1, b: { c: 2}}

  const updated = setIn(obj, ['b', 'c'], 2)

  t.is(updated, obj) // strict equal
})

test('updateIn', t => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'b', 'c'], (value) => value + 100)
  t.deepEqual (updated, {
    a: {
      b: {
        c: 102
      }
    },
    d: 3
  })

  // original should be unchanged
  t.deepEqual (obj, {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  })

  t.truthy (obj !== updated)
})

test('updateIn (2)', t => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'b' ], (obj) => [1,2,3])
  t.deepEqual (updated, {
    a: {
      b: [1,2,3]
    },
    d: 3
  })
})

test('updateIn (3)', t => {
  const obj = {
    a: {
      b: {
        c: 2
      }
    },
    d: 3
  }

  const updated = updateIn(obj, ['a', 'e' ], (value) => 'foo-' + value)
  t.deepEqual (updated, {
    a: {
      b: {
        c: 2
      },
      e: 'foo-undefined'
    },
    d: 3
  })
})

test('updateIn return identical value should return the original object', t => {
  const obj = {
    a: 2,
    b: 3
  }

  const updated = updateIn(obj, ['b' ], (value) => 3)
  t.is(updated, obj)
})

test('deleteIn', t => {
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
  t.deepEqual (updated, {
    a: {
      b: {
        d: 3
      }
    },
    e: 4
  })

  // original should be unchanged
  t.deepEqual (obj, {
    a: {
      b: {
        c: 2,
        d: 3
      }
    },
    e: 4
  })

  t.truthy (obj !== updated)
})

test('deleteIn array', t => {
  const obj = {
    a: {
      b: [1, {c: 2, d: 3} , 4]
    },
    e: 5
  }

  const updated = deleteIn(obj, ['a', 'b', '1', 'c'])
  t.deepEqual (updated, {
    a: {
      b: [1, {d: 3} , 4]
    },
    e: 5
  })

  // original should be unchanged
  t.deepEqual (obj, {
    a: {
      b: [1, {c: 2, d: 3} , 4]
    },
    e: 5
  })

  t.truthy (obj !== updated)
})

test('deleteIn non existing path', t => {
  const obj = { a: {}}

  const updated = deleteIn(obj, ['a', 'b'])
  t.truthy (updated === obj)
})

test('insertAt', t => {
  const obj = { a: [1,2,3]}

  const updated = insertAt(obj, ['a', '2'], 8)
  t.deepEqual(updated, {a: [1,2,8,3]})
})
