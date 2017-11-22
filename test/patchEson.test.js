import { readFileSync } from 'fs'
import test from 'ava'
import { jsonToEson, esonToJson, toEsonPath } from '../src/eson'
import { patchEson, cut } from '../src/patchEson'

const ESON1 = loadJSON('./resources/eson1.json')

test('jsonpatch add', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/obj/b', value: {foo: 'bar'}}
  ]

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,3],
    obj: {}
  })
  t.deepEqual(revert, [
    {op: 'add', path: '/arr/1', value: 2, jsoneditor: {type: 'value'}},
    {op: 'add', path: '/obj/a', value: 4, jsoneditor: {type: 'value', before: null}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1,200,3],
    obj: {a: 400}
  })
  t.deepEqual(revert, [
    {op: 'replace', path: '/arr/1', value: 2, jsoneditor: {type: 'value'}},
    {op: 'replace', path: '/obj/a', value: 4, jsoneditor: {type: 'value'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

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

  const data = jsonToEson(json)
  const valueId = data.props[0].id

  const patchedData = patchEson(data, patch).data
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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3],
    obj: {a: 4}
  })
  t.deepEqual(revert, [
    {op: 'remove', path: '/arr/2'}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'add', path: '/arr/2', value: {a: 4}, jsoneditor: {type: 'Object'}}
  ])
})

test('jsonpatch copy (keeps the same ids)', t => {
  const json = { foo: { bar: 42 } }
  const patch = [
    {op: 'copy', from: '/foo', path: '/copied'}
  ]

  const data = jsonToEson(json)
  const fooId = data.props[0].id
  const barId = data.props[0].value.props[0].id

  const patchedData = patchEson(data, patch).data
  const patchedFooId = patchedData.props[0].id
  const patchedBarId = patchedData.props[0].value.props[0].id
  const copiedId = patchedData.props[1].id
  const patchedCopiedBarId = patchedData.props[1].value.props[0].id

  t.is(patchedData.props[0].name, 'foo')
  t.is(patchedData.props[1].name, 'copied')

  t.is(patchedFooId, fooId, 'same foo id')
  t.is(patchedBarId, barId, 'same bar id')

  t.not(copiedId, fooId, 'different id of property copied')

  // The id's of the copied childs are the same, that's okish, they will not bite each other
  // FIXME: better solution for id's either always unique, or unique per object/array
  t.is(patchedCopiedBarId, patchedBarId, 'same copied bar id')
})

test('jsonpatch move', t => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr/2'},
  ]

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.is(result.error, null)
  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3]
  })
  t.deepEqual(revert, [
    {op: 'move', from: '/arr/2', path: '/obj'}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.is(result.error, null)
  t.deepEqual(patchedJson, {
    arr: [1, 2, {a:4}, 3],
    zzz: 'zzz'
  })
  t.deepEqual(revert, [
    {op: 'move', from: '/arr/2', path: '/obj', jsoneditor: {before: 'zzz'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, patch)
})

test('jsonpatch move and replace', t => {
  const json = { a: 2, b: 3 }

  const patch = [
    {op: 'move', from: '/a', path: '/b'},
  ]

  const data = jsonToEson(json)

  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  // id of the replaced B must be kept intact
  t.is(patchedData.props[0].id, data.props[1].id)

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
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'remove', path: '/b'},
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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  t.deepEqual(patchedJson, {
    arr: {a:4}
  })
  t.deepEqual(revert, [
    {op:'move', from: '/arr', path: '/obj'},
    {op:'add', path:'/arr', value: [1,2,3], jsoneditor: {type: 'Array'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  t.deepEqual(patchedJson2, json)
  t.deepEqual(revert2, [
    {op: 'remove', path: '/arr'},
    {op: 'move', from: '/obj', path: '/arr'}
  ])
})

test('jsonpatch move (keep id intact)', t => {
  const json = { value: 42 }
  const patch = [
    {op: 'move', from: '/value', path: '/moved'}
  ]

  const data = jsonToEson(json)
  const valueId = data.props[0].id

  const patchedData = patchEson(data, patch).data
  const patchedValueId = patchedData.props[0].id

  t.is(patchedValueId, valueId)
})

test('jsonpatch move and replace (keep ids intact)', t => {
  const json = { a: 2, b: 3 }
  const patch = [
    {op: 'move', from: '/a', path: '/b'}
  ]

  const data = jsonToEson(json)
  const bId = data.props[1].id

  t.is(data.props[0].name, 'a')
  t.is(data.props[1].name, 'b')

  const patchedData = patchEson(data, patch).data

  t.is(patchedData.props[0].name, 'b')
  t.is(patchedData.props[0].id, bId)
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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

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

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert
  const patchedJson = esonToJson(patchedData)

  // patch shouldn't be applied
  t.deepEqual(patchedJson, {
    arr: [1,2,3],
    obj: {a : 4}
  })
  t.deepEqual(revert, [])
  t.is(result.error.toString(), 'Error: Test failed, value differs')
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

// helper function to load a JSON file
function loadJSON (filename) {
  return JSON.parse(readFileSync(__dirname + '/' + filename, 'utf-8'))
}
