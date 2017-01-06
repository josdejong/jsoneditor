import test from 'ava';
import {
    jsonToData, dataToJson, patchData, pathExists, transform, traverse,
    parseJSONPointer, compileJSONPointer,
    expand, addErrors, search, addSearchResults, nextSearchResult, previousSearchResult
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

// TODO: instead of all slightly different copies of JSON_DATA_EXAMPLE, built them up via setIn, updateIn based on JSON_DATA_EXAMPLE

const JSON_DATA_EXAMPLE_COLLAPSED_1 = {
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

const JSON_DATA_EXAMPLE_COLLAPSED_2 = {
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
const JSON_DATA_EXAMPLE_SEARCH_L = {
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

const JSON_DATA_SMALL = {
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

const JSON_DATA_EXAMPLE_ERRORS = {
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

test('jsonToData', t => {
  function expand (path) {
    return true
  }

  const jsonData = jsonToData(JSON_EXAMPLE, expand, [])
  replaceIds(jsonData)

  t.deepEqual(jsonData, JSON_DATA_EXAMPLE)
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

test('jsonpatch replace (keep ids intact)', t => {
  const json = { value: 42 }
  const patch = [
    {op: 'replace', path: '/value', value: 100}
  ]

  const data = jsonToData(json)
  const valueId = data.props[0].id

  const patchedData = patchData(data, patch).data
  const patchedValueId = patchedData.props[0].id

  t.is(patchedValueId, valueId)
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

// test('jsonpatch copy (create new ids)', t => {
//   const json = { foo: { bar: 42 } }
//   const patch = [
//     {op: 'copy', from: '/foo', path: '/copied'}
//   ]
//
//   const data = jsonToData(json)
//   const objectId = data.id
//   const fooId = data.props[0].value.id
//   const barId = data.props[0].value.props[0].value.id
//
//   const patchedData = patchData(data, patch).data
//   const patchedObjectId = patchedData.id
//   const patchedFooId = patchedData.props[0].value.id
//   const patchedBarId = patchedData.props[0].value.props[0].value.id
//   const patchedCopiedId = patchedData.props[1].value.id
//   const patchedCopiedBarId = patchedData.props[1].value.props[0].value.id
//
//   t.is(patchedData.props[0].name, 'foo')
//   t.is(patchedData.props[1].name, 'copied')
//
//   t.is(patchedObjectId, objectId, 'same object id')
//   t.is(patchedFooId, fooId, 'same foo id')
//   t.is(patchedBarId, barId, 'same bar id')
//   t.not(patchedCopiedId, patchedFooId, 'different copied foo id')
//   t.not(patchedCopiedBarId, patchedBarId, 'different copied bar id')
// })
//
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
  const json = { a: 2, b: 3 }

  const patch = [
    {op: 'move', from: '/a', path: '/b'},
  ]

  const data = jsonToData(json)
  const result = patchData(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = dataToJson(patchedData)

  replaceIds(patchedData)
  t.deepEqual(patchedData, {
    "type": "Object",
    "expanded": true,
    "props": [
      {
        "id": "[ID]",
        "name": "b",
        "value": {
          "type": "value",
          "value": 2
        }
      }
    ]
  })

  t.deepEqual(patchedJson, { b : 2 })
  t.deepEqual(revert, [
    {op:'move', from: '/b', path: '/a'},
    {op:'add', path:'/b', value: 3, jsoneditor: {type: 'value', before: 'b'}}
  ])

  // test revert
  const data2 = jsonToData(patchedJson)
  const result2 = patchData(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = dataToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'move', from: '/a', path: '/b'}
  ])
})

test('jsonpatch move and replace (nested)', t => {
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

test('jsonpatch move (keep id intact)', t => {
  const json = { value: 42 }
  const patch = [
    {op: 'move', from: '/value', path: '/moved'}
  ]

  const data = jsonToData(json)
  const objectId = data.id
  const valueId = data.props[0].value.id

  const patchedData = patchData(data, patch).data

  const patchedObjectId = patchedData.id
  const patchedValueId = patchedData.props[0].value.id

  t.is(patchedObjectId, objectId)
  t.is(patchedValueId, valueId)
})

test('jsonpatch move and replace (keep ids intact)', t => {
  const json = { a: 2, b: 3 }
  const patch = [
    {op: 'move', from: '/a', path: '/b'}
  ]

  const data = jsonToData(json)
  const bId = data.props[1].id

  t.is(data.props[0].name, 'a')
  t.is(data.props[1].name, 'b')

  const patchedData = patchData(data, patch).data
  const patchedBId = patchedData.props[0].id

  t.is(patchedData.props[0].name, 'b')
  t.is(patchedBId, bId)
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
    [JSON_DATA_SMALL.props[1].value.items[0].value, ['arr', '0'], JSON_DATA_SMALL],
  ]

  log.forEach((row, index) => {
    t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  })
  t.deepEqual(log, EXPECTED_LOG)
  t.not(transformed, JSON_DATA_SMALL)
  t.not(transformed.props[0].value, JSON_DATA_SMALL.props[0].value)
  t.not(transformed.props[0].value.props[0].value, JSON_DATA_SMALL.props[0].value.props[0].value)
  t.is(transformed.props[1].value, JSON_DATA_SMALL.props[1].value)
  t.is(transformed.props[1].value.items[0].value, JSON_DATA_SMALL.props[1].value.items[0].value)

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
    [JSON_DATA_SMALL.props[1].value.items[0].value, ['arr', '0'], JSON_DATA_SMALL],
  ]

  log.forEach((row, index) => {
    t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  })
  t.deepEqual(log, EXPECTED_LOG)
})


test('search', t => {
  const searchResults = search(JSON_DATA_EXAMPLE, 'L')
  // printJSON(searchResults)

  t.deepEqual(searchResults, [
    {path: ['obj', 'arr', '2', 'last'], type: 'property'},
    {path: ['str'], type: 'value'},
    {path: ['nill'], type: 'property'},
    {path: ['nill'], type: 'value'},
    {path: ['bool'], type: 'property'},
    {path: ['bool'], type: 'value'}
  ])

  const activeSearchResult = searchResults[0]
  const updatedData = addSearchResults(JSON_DATA_EXAMPLE, searchResults, activeSearchResult)
  // printJSON(updatedData)

  t.deepEqual(updatedData, JSON_DATA_EXAMPLE_SEARCH_L)
})

test('nextSearchResult', t => {
  const searchResults = [
    {path: ['obj', 'arr', '2', 'last'], type: 'property'},
    {path: ['str'], type: 'value'},
    {path: ['nill'], type: 'property'},
    {path: ['nill'], type: 'value'},
    {path: ['bool'], type: 'property'},
    {path: ['bool'], type: 'value'}
  ]

  t.deepEqual(nextSearchResult(searchResults,
      {path: ['nill'], type: 'property'}),
      {path: ['nill'], type: 'value'})

  // wrap around
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['bool'], type: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], type: 'property'})

  // return first when current is not found
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['non', 'existing'], type: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], type: 'property'})

  // return null when searchResults are empty
  t.deepEqual(nextSearchResult([], {path: ['non', 'existing'], type: 'value'}), null)
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