import test from 'ava';
import { getIn, setIn, updateIn, deleteIn } from '../src/utils/immutabilityHelpers'


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
  t.is(getIn(obj, ['e', 1, 'f']), 5)
  t.is(getIn(obj, ['e', 999, 'f']), undefined)
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

  const updated = setIn(obj, ['a', 'b', 'c'], 4)

  t.deepEqual (updated, {
    a: {
      b: {
        c: 4
      }
    }
  })
})

test('setIn replace value with object', t => {
  const obj = {
    a: 42,
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

  const updated = setIn(obj, ['a', 2, 'c'], 8)

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

test('setIn change array into object', t => {
  const obj = [1,2,3]

  const updated = setIn(obj, ['foo'], 'bar')

  t.deepEqual (updated, {
    foo: 'bar'
  })
})

test('setIn change object into array', t => {
  const obj = {a:1, b:2}

  const updated = setIn(obj, [2], 'foo')

  t.deepEqual (updated, [, , 'foo'])
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

  const updated = deleteIn(obj, ['a', 'b', 1, 'c'])
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