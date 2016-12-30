import test from 'ava';
import {
    jsonToData, dataToJson, patchData, pathExists, transform, traverse,
    parseJSONPointer, compileJSONPointer,
    expand, addErrors, search, addSearchResults
} from '../src/jsonData'


const JSON_EXAMPLE = {
  obj: {
    arr: [1,2, {first:3,last:4}]
  },
  str: 'hello world',
  nill: null,
  bool: false
}

const JSON_DATA_EXAMPLE = {
  type: 'Object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'Object',
                  expanded: true,
                  props: [
                    {
                      name: 'first',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'last',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const JSON_DATA_EXAMPLE_COLLAPSED_1 = {
  type: 'Object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'Object',
                  expanded: false,
                  props: [
                    {
                      name: 'first',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'last',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const JSON_DATA_EXAMPLE_COLLAPSED_2 = {
  type: 'Object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        expanded: false,
        props: [
          {
            name: 'arr',
            value: {
              type: 'Array',
              expanded: false,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'Object',
                  expanded: false,
                  props: [
                    {
                      name: 'first',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'last',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

// after search for 'L' (case insensitive)
const JSON_DATA_EXAMPLE_SEARCH_L = {
  type: 'Object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'Object',
                  expanded: true,
                  props: [
                    {
                      name: 'first',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'last',
                      value: {
                        type: 'value',
                        value: 4,
                        searchProperty: 'normal'
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world',
        searchValue: 'normal'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null,
        searchProperty: 'active',
        searchValue: 'normal'
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false,
        searchProperty: 'normal',
        searchValue: 'normal'
      }
    }
  ]
}

const JSON_DATA_SMALL = {
  type: 'Object',
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        props: [
          {
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
      name: 'arr',
      value: {
        type: 'Array',
        items: [
          {
            type: 'value',
            value: 3
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

const JSON_DATA_EXAMPLE_ERRORS = {
  type: 'Object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'Object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'Array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'Object',
                  expanded: true,
                  props: [
                    {
                      name: 'first',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'last',
                      value: {
                        type: 'value',
                        value: 4,
                        error: JSON_SCHEMA_ERRORS[0]
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null,
        error: JSON_SCHEMA_ERRORS[1]
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

test('jsonToData', t => {
  function expand (path) {
    return true
  }

  t.deepEqual(jsonToData(JSON_EXAMPLE, expand, []), JSON_DATA_EXAMPLE)
})

test('dataToJson', t => {
  t.deepEqual(dataToJson(JSON_DATA_EXAMPLE), JSON_EXAMPLE)
})

test('expand a single path', t => {
  const collapsed = expand(JSON_DATA_EXAMPLE, ['obj', 'arr', 2], false)

  t.deepEqual(collapsed, JSON_DATA_EXAMPLE_COLLAPSED_1)
})

test('expand a callback', t => {
  function callback (path) {
    return path.length >= 1
  }
  const expanded = false
  const collapsed = expand(JSON_DATA_EXAMPLE, callback, expanded)

  t.deepEqual(collapsed, JSON_DATA_EXAMPLE_COLLAPSED_2)
})

test('expand a callback should not change the object when nothing happens', t => {
  function callback (path) {
    return false
  }
  const expanded = false
  const collapsed = expand(JSON_DATA_EXAMPLE, callback, expanded)

  t.is(collapsed, JSON_DATA_EXAMPLE)
})

test('pathExists', t => {
  t.is(pathExists(JSON_DATA_EXAMPLE, ['obj', 'arr', 2, 'first']), true)
  t.is(pathExists(JSON_DATA_EXAMPLE, ['obj', 'foo']), false)
  t.is(pathExists(JSON_DATA_EXAMPLE, ['obj', 'foo', 'bar']), false)
  t.is(pathExists(JSON_DATA_EXAMPLE, []), true)
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

test('jsonpatch add', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/obj/b', value: {foo: 'bar'}}
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,2,3],
    obj: {a : 2, b: {foo: 'bar'}}
  })
  t.deepEqual(revert, [
    {op: 'remove', path: '/obj/b'}
  ])
})

test('jsonpatch add: append to matrix', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/arr/-', value: 4}
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,2,3,4],
    obj: {a : 2}
  })
  t.deepEqual(revert, [
    {op: 'remove', path: '/arr/3'}
  ])
})


test('jsonpatch remove', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'remove', path: '/obj/a'},
    {op: 'remove', path: '/arr/1'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,3],
    obj: {}
  })
  t.deepEqual(revert, [
    {op: 'add', path: '/arr/1', value: 2, jsoneditor: {type: 'value'}},
    {op: 'add', path: '/obj/a', value: 4, jsoneditor: {type: 'value', before: null}}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, patch)
})

test('jsonpatch replace', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'replace', path: '/obj/a', value: 400},
    {op: 'replace', path: '/arr/1', value: 200},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,200,3],
    obj: {a: 400}
  })
  t.deepEqual(revert, [
    {op: 'replace', path: '/arr/1', value: 2, jsoneditor: {type: 'value'}},
    {op: 'replace', path: '/obj/a', value: 4, jsoneditor: {type: 'value'}}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'replace', path: '/obj/a', value: 400, jsoneditor: {type: 'value'}},
    {op: 'replace', path: '/arr/1', value: 200, jsoneditor: {type: 'value'}}
  ])
})

test('jsonpatch copy', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'copy', from: '/obj', path: '/arr/2'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3],
    obj: {a: 4}
  })
  t.deepEqual(revert, [
    {op: 'remove', path: '/arr/2'}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'add', path: '/arr/2', value: {a: 4}, jsoneditor: {type: 'Object'}}
  ])
})

test('jsonpatch move', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr/2'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.is(result.error, null)
  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3]
  })
  t.deepEqual(revert, [
    {op: 'move', from: '/arr/2', path: '/obj'}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, patch)
})

test('jsonpatch move before', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4},
    zzz: 'zzz'
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr/2'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.is(result.error, null)
  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3],
    zzz: 'zzz'
  })
  t.deepEqual(revert, [
    {op: 'move', from: '/arr/2', path: '/obj', jsoneditor: {before: 'zzz'}}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, patch)
})

test('jsonpatch move and replace', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: {a:4}
  })
  t.deepEqual(revert, [
    {op:'move', from: '/arr', path: '/obj'},
    {op:'add', path:'/arr', value: [1,2,3], jsoneditor: {type: 'Array'}}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'move', from: '/obj', path: '/arr'}
  ])
})

test('jsonpatch test (ok)', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'test', path: '/arr', value: [1,2,3]},
    {op: 'add', path: '/added', value: 'ok'}
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,2,3],
    obj: {a : 4},
    added: 'ok'
  })
  t.deepEqual(revert, [
    {op: 'remove', path: '/added'}
  ])

})

test('jsonpatch test (fail: path not found)', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'test', path: '/arr/5', value: [1,2,3]},
    {op: 'add', path: '/added', value: 'ok'}
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  // patch shouldn't be applied
  t.deepEqual(patchedJson, {
    arr: [1,2,3],
    obj: {a : 4}
  })
  t.deepEqual(revert, [])
  t.is(result.error.toString(), 'Error: Test failed, path not found')
})

test('jsonpatch test (fail: value not equal)', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'test', path: '/obj', value: {a:4, b: 6}},
    {op: 'add', path: '/added', value: 'ok'}
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  // patch shouldn't be applied
  t.deepEqual(patchedJson, {
    arr: [1,2,3],
    obj: {a : 4}
  })
  t.deepEqual(revert, [])
  t.is(result.error.toString(), 'Error: Test failed, value differs')
})

test('add and remove errors', t => {
  const dataWithErrors = addErrors(JSON_DATA_EXAMPLE, JSON_SCHEMA_ERRORS)
  t.deepEqual(dataWithErrors, JSON_DATA_EXAMPLE_ERRORS)
})

test('transform', t => {
  // {obj: {a: 2}, arr: [3]}
  
  let log = []
  const transformed = transform(JSON_DATA_SMALL, function (value, path, root) {
    t.is(root, JSON_DATA_SMALL)

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
    [JSON_DATA_SMALL, [], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[0].value, ['obj'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[0].value.props[0].value, ['obj', 'a'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[1].value, ['arr'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[1].value.items[0], ['arr', '0'], JSON_DATA_SMALL],
  ]

  // log.forEach((row, index) => {
  //   t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  // })
  t.deepEqual(log, EXPECTED_LOG)
  t.not(transformed, JSON_DATA_SMALL)
  t.not(transformed.props[0].value, JSON_DATA_SMALL.props[0].value)
  t.not(transformed.props[0].value.props[0].value, JSON_DATA_SMALL.props[0].value.props[0].value)
  t.is(transformed.props[1].value, JSON_DATA_SMALL.props[1].value)
  t.is(transformed.props[1].value.items[0], JSON_DATA_SMALL.props[1].value.items[0])

})

test('traverse', t => {
  // {obj: {a: 2}, arr: [3]}

  let log = []
  const returnValue = traverse(JSON_DATA_SMALL, function (value, path, root) {
    t.is(root, JSON_DATA_SMALL)

    log.push([value, path, root])
  })

  t.is(returnValue, undefined)

  const EXPECTED_LOG = [
    [JSON_DATA_SMALL, [], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[0].value, ['obj'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[0].value.props[0].value, ['obj', 'a'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[1].value, ['arr'], JSON_DATA_SMALL],
    [JSON_DATA_SMALL.props[1].value.items[0], ['arr', '0'], JSON_DATA_SMALL],
  ]

  // log.forEach((row, index) => {
  //   t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  // })
  t.deepEqual(log, EXPECTED_LOG)
})


test('search', t => {
  const searchResults = search(JSON_DATA_EXAMPLE, 'L')
  // console.log(searchResults)

  t.deepEqual(searchResults, [
    {dataPath: ['nill'], type: 'property'},
    {dataPath: ['bool'], type: 'property'},
    {dataPath: ['obj', 'arr', '2', 'last'], type: 'property'},
    {dataPath: ['str'], type: 'value'},
    {dataPath: ['nill'], type: 'value'},
    {dataPath: ['bool'], type: 'value'}
  ])

  const activeSearchResult = searchResults[0]
  const updatedData = addSearchResults(JSON_DATA_EXAMPLE, searchResults, activeSearchResult)
  //console.log(JSON.stringify(updatedData, null, 2))

  t.deepEqual(updatedData, JSON_DATA_EXAMPLE_SEARCH_L)
})
