import test from 'ava';
import {
    jsonToEson, esonToJson, pathExists, transform, traverse,
    parseJSONPointer, compileJSONPointer,
    expand, addErrors, search, applySearchResults, nextSearchResult, previousSearchResult,
    applySelection
} from '../src/eson'


// TODO: move all JSON documents in separate json files to keep the test readable?

const JSON_EXAMPLE = {
  obj: {
    arr: [1,2, {first:3,last:4}]
  },
  str: 'hello world',
  nill: null,
  bool: false
}

const ESON = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

// TODO: instead of all slightly different copies of ESON, built them up via setIn, updateIn based on ESON

const ESON_COLLAPSED_1 = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [

                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: false,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const ESON_COLLAPSED_2 = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: false,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: false,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: false,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

// after search for 'L' (case insensitive)
const ESON_SEARCH_L = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        },
                        searchResult: 'active'
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world',
        searchResult: 'normal'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null,
        searchResult: 'normal'
      },
      searchResult: 'normal'
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false,
        searchResult: 'normal'
      },
      searchResult: 'normal'
    }
  ]
}

const ESON_SELECTED_OBJECT = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        selected: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world',
        selected: true
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null,
        selected: true
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const ESON_SELECTED_ARRAY = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    selected: true,
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    selected: true,
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const ESON_SELECTED_VALUE = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          selected: true,
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const ESON_SELECTED_PARENT = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    selected: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const ESON_SMALL = {
  type: 'Object',
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        props: [
          {
            id: '[ID]',
            name: 'a',
            value: {
              type: 'value',
              value: 2
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'arr',
      value: {
        type: 'Array',
        items: [
          {
            id: '[ID]',
            value: {
              type: 'value',
              value: 3
            }
          }
        ]
      }
    }
  ]
}


const JSON_SCHEMA_ERRORS = [
  {dataPath: '/obj/arr/2/last', message: 'String expected'},
  {dataPath: '/nill', message: 'Null expected'}
]

const ESON_ERRORS = {
  type: 'Object',
  expanded: true,
  props: [
    {
      id: '[ID]',
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            id: '[ID]',
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 1
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'value',
                    value: 2
                  }
                },
                {
                  id: '[ID]',
                  value: {
                    type: 'Object',
                    expanded: true,
                    props: [
                      {
                        id: '[ID]',
                        name: 'first',
                        value: {
                          type: 'value',
                          value: 3
                        }
                      },
                      {
                        id: '[ID]',
                        name: 'last',
                        value: {
                          type: 'value',
                          value: 4,
                          error: JSON_SCHEMA_ERRORS[0]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      id: '[ID]',
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      id: '[ID]',
      name: 'nill',
      value: {
        type: 'value',
        value: null,
        error: JSON_SCHEMA_ERRORS[1]
      }
    },
    {
      id: '[ID]',
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

test('jsonToEson', t => {
  function expand (path) {
    return true
  }

  const ESON = jsonToEson(JSON_EXAMPLE, expand, [])
  replaceIds(ESON)

  t.deepEqual(ESON, ESON)
})

test('esonToJson', t => {
  t.deepEqual(esonToJson(ESON), JSON_EXAMPLE)
})

test('expand a single path', t => {
  const collapsed = expand(ESON, ['obj', 'arr', 2], false)

  t.deepEqual(collapsed, ESON_COLLAPSED_1)
})

test('expand a callback', t => {
  function callback (path) {
    return path.length >= 1
  }
  const expanded = false
  const collapsed = expand(ESON, callback, expanded)

  t.deepEqual(collapsed, ESON_COLLAPSED_2)
})

test('expand a callback should not change the object when nothing happens', t => {
  function callback (path) {
    return false
  }
  const expanded = false
  const collapsed = expand(ESON, callback, expanded)

  t.is(collapsed, ESON)
})

test('pathExists', t => {
  t.is(pathExists(ESON, ['obj', 'arr', 2, 'first']), true)
  t.is(pathExists(ESON, ['obj', 'foo']), false)
  t.is(pathExists(ESON, ['obj', 'foo', 'bar']), false)
  t.is(pathExists(ESON, []), true)
})

test('parseJSONPointer', t => {
  t.deepEqual(parseJSONPointer('/obj/a'), ['obj', 'a'])
  t.deepEqual(parseJSONPointer('/arr/-'), ['arr', '-'])
  t.deepEqual(parseJSONPointer('/foo/~1~0 ~0~1'), ['foo', '/~ ~/'])
  t.deepEqual(parseJSONPointer('/obj'), ['obj'])
  t.deepEqual(parseJSONPointer('/'), [''])
  t.deepEqual(parseJSONPointer(''), [])
})

test('compileJSONPointer', t => {
  t.deepEqual(compileJSONPointer(['foo', 'bar']), '/foo/bar')
  t.deepEqual(compileJSONPointer(['foo', '/~ ~/']), '/foo/~1~0 ~0~1')
  t.deepEqual(compileJSONPointer(['']), '/')
  t.deepEqual(compileJSONPointer([]), '')
})

test('add and remove errors', t => {
  const dataWithErrors = addErrors(ESON, JSON_SCHEMA_ERRORS)
  t.deepEqual(dataWithErrors, ESON_ERRORS)
})

test('transform', t => {
  // {obj: {a: 2}, arr: [3]}

  let log = []
  const transformed = transform(ESON_SMALL, function (value, path, root) {
    t.is(root, ESON_SMALL)

    log.push([value, path, root])

    if (path.length === 2 && path[0] === 'obj' && path[1] === 'a') {
      // change the value
      return { type: 'value', value: 42 }
    }

    // leave the value unchanged
    return value
  })

  // console.log('transformed', JSON.stringify(transformed, null, 2))

  const EXPECTED_LOG = [
    [ESON_SMALL, [], ESON_SMALL],
    [ESON_SMALL.props[0].value, ['obj'], ESON_SMALL],
    [ESON_SMALL.props[0].value.props[0].value, ['obj', 'a'], ESON_SMALL],
    [ESON_SMALL.props[1].value, ['arr'], ESON_SMALL],
    [ESON_SMALL.props[1].value.items[0].value, ['arr', '0'], ESON_SMALL],
  ]

  log.forEach((row, index) => {
    t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  })
  t.deepEqual(log, EXPECTED_LOG)
  t.not(transformed, ESON_SMALL)
  t.not(transformed.props[0].value, ESON_SMALL.props[0].value)
  t.not(transformed.props[0].value.props[0].value, ESON_SMALL.props[0].value.props[0].value)
  t.is(transformed.props[1].value, ESON_SMALL.props[1].value)
  t.is(transformed.props[1].value.items[0].value, ESON_SMALL.props[1].value.items[0].value)

})

test('traverse', t => {
  // {obj: {a: 2}, arr: [3]}

  let log = []
  const returnValue = traverse(ESON_SMALL, function (value, path, root) {
    t.is(root, ESON_SMALL)

    log.push([value, path, root])
  })

  t.is(returnValue, undefined)

  const EXPECTED_LOG = [
    [ESON_SMALL, [], ESON_SMALL],
    [ESON_SMALL.props[0].value, ['obj'], ESON_SMALL],
    [ESON_SMALL.props[0].value.props[0].value, ['obj', 'a'], ESON_SMALL],
    [ESON_SMALL.props[1].value, ['arr'], ESON_SMALL],
    [ESON_SMALL.props[1].value.items[0].value, ['arr', '0'], ESON_SMALL],
  ]

  log.forEach((row, index) => {
    t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  })
  t.deepEqual(log, EXPECTED_LOG)
})


test('search', t => {
  const searchResults = search(ESON, 'L')
  // printJSON(searchResults)

  t.deepEqual(searchResults, [
    {path: ['obj', 'arr', '2', 'last'], field: 'property'},
    {path: ['str'], field: 'value'},
    {path: ['nill'], field: 'property'},
    {path: ['nill'], field: 'value'},
    {path: ['bool'], field: 'property'},
    {path: ['bool'], field: 'value'}
  ])

  const activeSearchResult = searchResults[0]
  const updatedData = applySearchResults(ESON, searchResults, activeSearchResult)
  // printJSON(updatedData)

  t.deepEqual(updatedData, ESON_SEARCH_L)
})

test('nextSearchResult', t => {
  const searchResults = [
    {path: ['obj', 'arr', '2', 'last'], field: 'property'},
    {path: ['str'], field: 'value'},
    {path: ['nill'], field: 'property'},
    {path: ['nill'], field: 'value'},
    {path: ['bool'], field: 'property'},
    {path: ['bool'], field: 'value'}
  ]

  t.deepEqual(nextSearchResult(searchResults,
      {path: ['nill'], field: 'property'}),
      {path: ['nill'], field: 'value'})

  // wrap around
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['bool'], field: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], field: 'property'})

  // return first when current is not found
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['non', 'existing'], field: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], field: 'property'})

  // return null when searchResults are empty
  t.deepEqual(nextSearchResult([], {path: ['non', 'existing'], field: 'value'}), null)
})

test('previousSearchResult', t => {
  const searchResults = [
    {path: ['obj', 'arr', '2', 'last'], type: 'property'},
    {path: ['str'], type: 'value'},
    {path: ['nill'], type: 'property'},
    {path: ['nill'], type: 'value'},
    {path: ['bool'], type: 'property'},
    {path: ['bool'], type: 'value'}
  ]

  t.deepEqual(previousSearchResult(searchResults,
      {path: ['nill'], type: 'property'}),
      {path: ['str'], type: 'value'})

  // wrap around
  t.deepEqual(previousSearchResult(searchResults,
      {path: ['obj', 'arr', '2', 'last'], type: 'property'}),
      {path: ['bool'], type: 'value'})

  // return first when current is not found
  t.deepEqual(previousSearchResult(searchResults,
      {path: ['non', 'existing'], type: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], type: 'property'})

  // return null when searchResults are empty
  t.deepEqual(previousSearchResult([], {path: ['non', 'existing'], type: 'value'}), null)
})

test('selection (object)', t => {
  const selection = {
    start: {path: ['obj', 'arr', '2', 'last']},
    end: {path: ['nill']}
  }
  const result = applySelection(ESON, selection)

  t.deepEqual(result, ESON_SELECTED_OBJECT)
})

test('selection (array)', t => {
  const selection = {
    start: {path: ['obj', 'arr', '1']},
    end: {path: ['obj', 'arr', '0']} // note the "wrong" order of start and end
  }

  const result = applySelection(ESON, selection)

  t.deepEqual(result, ESON_SELECTED_ARRAY)
})

test('selection (value)', t => {
  const selection = {
    start: {path: ['obj', 'arr', '2', 'first']},
    end: {path: ['obj', 'arr', '2', 'first']}
  }

  const result = applySelection(ESON, selection)

  t.deepEqual(result, ESON_SELECTED_VALUE)
})

test('selection (single parent)', t => {
  const selection = {
    start: {path: ['obj', 'arr', '2']},
    end: {path: ['obj', 'arr', '2']}
  }

  const result = applySelection(ESON, selection)

  t.deepEqual(result, ESON_SELECTED_PARENT)
})

// helper function to replace all id properties with a constant value
function replaceIds (data, value = '[ID]') {
  if (data.type === 'Object') {
    data.props.forEach(prop => {
      prop.id = value
      replaceIds(prop.value, value)
    })
  }

  if (data.type === 'Array') {
    data.items.forEach(item => {
      item.id = value
      replaceIds(item.value, value)
    })
  }
}

// helper function to print JSON in the console
function printJSON (json, message = null) {
  if (message) {
    console.log(message)
  }
  console.log(JSON.stringify(json, null, 2))
}
