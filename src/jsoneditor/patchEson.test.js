'use strict'

import { readFileSync } from 'fs'
import { META, jsonToEson, esonToJson } from './eson'
import { patchEson } from './patchEson'
import { assertDeepEqualEson } from './utils/assertDeepEqualEson'

test('jsonpatch add', () => {
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

  assertDeepEqualEson(patchedData, jsonToEson({
    arr: [1,2,3],
    obj: {a : 2, b: {foo: 'bar'}}
  }))
  expect(revert).toEqual([
    {op: 'remove', path: '/obj/b'}
  ])
})

test('jsonpatch add: insert in matrix', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/arr/1', value: 4}
  ]

  const data = jsonToEson(json)
  const result = patchEson(data, patch)
  const patchedData = result.data
  const revert = result.revert

  assertDeepEqualEson(patchedData, jsonToEson({
    arr: [1,4,2,3],
    obj: {a : 2}
  }))
  expect(revert).toEqual([
    {op: 'remove', path: '/arr/1'}
  ])
})

test('jsonpatch add: append to matrix', () => {
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

  assertDeepEqualEson(patchedData, jsonToEson({
    arr: [1,2,3,4],
    obj: {a : 2}
  }))
  expect(revert).toEqual([
    {op: 'remove', path: '/arr/3'}
  ])
})

test('jsonpatch remove', () => {
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

  assertDeepEqualEson(patchedData, jsonToEson({
    arr: [1,3],
    obj: {}
  }))
  expect(revert).toEqual([
    {op: 'add', path: '/arr/1', value: 2, meta: {type: 'value'}},
    {op: 'add', path: '/obj/a', value: 4, meta: {type: 'value', before: null}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual(patch)
})

test('jsonpatch replace', () => {
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

  assertDeepEqualEson(patchedData, jsonToEson({
    arr: [1,200,3],
    obj: {a: 400}
  }))
  expect(revert).toEqual([
    {op: 'replace', path: '/arr/1', value: 2, meta: {type: 'value'}},
    {op: 'replace', path: '/obj/a', value: 4, meta: {type: 'value'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual([
    {op: 'replace', path: '/obj/a', value: 400, meta: {type: 'value'}},
    {op: 'replace', path: '/arr/1', value: 200, meta: {type: 'value'}}
  ])
})

test('jsonpatch replace (keep ids intact)', () => {
  const json = { value: 42 }
  const patch = [
    {op: 'replace', path: '/value', value: 100}
  ]

  const data = jsonToEson(json)
  const valueId = data.value[META].id

  const patchedData = patchEson(data, patch).data
  const patchedValueId = patchedData.value[META].id

  expect(patchedValueId).toEqual(valueId)
})

test('jsonpatch copy', () => {
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

  expect(patchedJson).toEqual({
    arr: [1, 2, {a:4}, 3],
    obj: {a: 4}
  })
  expect(revert).toEqual([
    {op: 'remove', path: '/arr/2'}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual([
    {op: 'add', path: '/arr/2', value: {a: 4}, meta: {type: 'Object'}}
  ])
})

test('jsonpatch copy (keeps the same ids)', () => {
  const json = { foo: { bar: 42 } }
  const patch = [
    {op: 'copy', from: '/foo', path: '/copied'}
  ]

  const data = jsonToEson(json)
  const fooId = data.foo[META].id
  const barId = data.foo.bar[META].id

  const patchedData = patchEson(data, patch).data
  const patchedFooId = patchedData.foo[META].id
  const patchedBarId = patchedData.foo.bar[META].id
  const copiedId = patchedData.copied[META].id
  const patchedCopiedBarId = patchedData.copied.bar[META].id

  expect(patchedFooId).toEqual(fooId)
  expect(patchedBarId).toEqual(barId)

  expect(copiedId).not.toEqual(fooId)

  // The id's of the copied childs are the same, that's okish, they will not bite each other
  expect(patchedCopiedBarId).toEqual(patchedBarId)
})

test('jsonpatch move', () => {
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

  expect(result.error).toEqual(null)
  expect(patchedJson).toEqual({
    arr: [1, 2, {a:4}, 3]
  })
  expect(revert).toEqual([
    {op: 'move', from: '/arr/2', path: '/obj'}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual(patch)
})

test('jsonpatch move before', () => {
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

  expect(result.error).toEqual(null)
  expect(patchedJson).toEqual({
    arr: [1, 2, {a:4}, 3],
    zzz: 'zzz'
  })
  expect(revert).toEqual([
    {op: 'move', from: '/arr/2', path: '/obj', meta: {before: 'zzz'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual(patch)
})

test('jsonpatch move and replace', () => {
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
  expect(patchedData.b[META].id).toEqual(data.b[META].id)

  assertDeepEqualEson(patchedData, jsonToEson({b: 2}))
  expect(patchedJson).toEqual({ b : 2 })
  expect(revert).toEqual([
    {op:'move', from: '/b', path: '/a'},
    {op:'add', path:'/b', value: 3, meta: {type: 'value', before: 'b'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual([
    {op: 'remove', path: '/b'},
    {op: 'move', from: '/a', path: '/b'}
  ])
})

test('jsonpatch move and replace (nested)', () => {
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

  expect(patchedJson).toEqual({
    arr: {a:4}
  })
  expect(revert).toEqual([
    {op:'move', from: '/arr', path: '/obj'},
    {op:'add', path:'/arr', value: [1,2,3], meta: {type: 'Array'}}
  ])

  // test revert
  const data2 = jsonToEson(patchedJson)
  const result2 = patchEson(data2, revert)
  const patchedData2 = result2.data
  const revert2 = result2.revert
  const patchedJson2 = esonToJson(patchedData2)

  expect(patchedJson2).toEqual(json)
  expect(revert2).toEqual([
    {op: 'remove', path: '/arr'},
    {op: 'move', from: '/obj', path: '/arr'}
  ])
})

test('jsonpatch move (keep id intact)', () => {
  const json = { value: 42 }
  const patch = [
    {op: 'move', from: '/value', path: '/moved'}
  ]

  const data = jsonToEson(json)
  const valueId = data.value[META].id

  const patchedData = patchEson(data, patch).data
  const patchedValueId = patchedData.moved[META].id

  expect(patchedValueId).toEqual(valueId)
})

test('jsonpatch move and replace (keep ids intact)', () => {
  const json = { a: 2, b: 3 }
  const patch = [
    {op: 'move', from: '/a', path: '/b'}
  ]

  const data = jsonToEson(json)
  const bId = data.b[META].id

  expect(data[META].props).toEqual(['a', 'b'])

  const patchedData = patchEson(data, patch).data

  expect(patchedData.b[META].id).toEqual(bId)
  expect(patchedData[META].props).toEqual(['b'])
})

test('jsonpatch test (ok)', () => {
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

  expect(patchedJson).toEqual({
    arr: [1,2,3],
    obj: {a : 4},
    added: 'ok'
  })
  expect(revert).toEqual([
    {op: 'remove', path: '/added'}
  ])

})

test('jsonpatch test (fail: path not found)', () => {
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
  expect(patchedJson).toEqual({
    arr: [1,2,3],
    obj: {a : 4}
  })
  expect(revert).toEqual([])
  expect(result.error.toString()).toEqual('Error: Test failed, path not found')
})

test('jsonpatch test (fail: value not equal)', () => {
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
  expect(patchedJson).toEqual({
    arr: [1,2,3],
    obj: {a : 4}
  })
  expect(revert).toEqual([])
  expect(result.error.toString()).toEqual('Error: Test failed, value differs')
})

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
