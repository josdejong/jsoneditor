'use strict'

import { immutableJsonPatch } from './immutableJsonPatch'

test('test toBe', () => {
  const a = { x: 2 }
  const b = { x: 2 }

  // just to be sure toBe does what I think it does...
  expect(a).toBe(a)
  expect(b).not.toBe(a)
  expect(b).toEqual(a)
})

test('jsonpatch add', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/obj/b', value: {foo: 'bar'}}
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,2,3],
    obj: {a : 2, b: {foo: 'bar'}}
  })
  expect(result.revert).toEqual([
    {op: 'remove', path: '/obj/b'}
  ])
  expect(result.json.arr).toBe(json.arr)
})

test('jsonpatch add: insert in matrix', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/arr/1', value: 4}
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,4,2,3],
    obj: {a : 2}
  })
  expect(result.revert).toEqual([
    {op: 'remove', path: '/arr/1'}
  ])
  expect(result.json.obj).toBe(json.obj)
})

test('jsonpatch add: append to matrix', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const patch = [
    {op: 'add', path: '/arr/-', value: 4}
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,2,3,4],
    obj: {a : 2}
  })
  expect(result.revert).toEqual([
    {op: 'remove', path: '/arr/3'}
  ])
  expect(result.json.obj).toBe(json.obj)
})

test('jsonpatch remove', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4},
    unchanged: {}
  }

  const patch = [
    {op: 'remove', path: '/obj/a'},
    {op: 'remove', path: '/arr/1'},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,3],
    obj: {},
    unchanged: {}
  })
  expect(result.revert).toEqual([
    {op: 'add', path: '/arr/1', value: 2},
    {op: 'add', path: '/obj/a', value: 4}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual(patch)
  expect(result.json.unchanged).toBe(json.unchanged)
})

test('jsonpatch replace', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4},
    unchanged: {}
  }

  const patch = [
    {op: 'replace', path: '/obj/a', value: 400},
    {op: 'replace', path: '/arr/1', value: 200},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,200,3],
    obj: {a: 400},
    unchanged: {}
  })
  expect(result.revert).toEqual([
    {op: 'replace', path: '/arr/1', value: 2},
    {op: 'replace', path: '/obj/a', value: 4}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual([
    {op: 'replace', path: '/obj/a', value: 400},
    {op: 'replace', path: '/arr/1', value: 200}
  ])
  expect(result.json.unchanged).toBe(json.unchanged)
})

test('jsonpatch copy', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4}
  }

  const patch = [
    {op: 'copy', from: '/obj', path: '/arr/2'},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1, 2, {a:4}, 3],
    obj: {a: 4}
  })
  expect(result.revert).toEqual([
    {op: 'remove', path: '/arr/2'}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual([
    {op: 'add', path: '/arr/2', value: {a: 4}}
  ])
  expect(result.json.obj).toBe(json.obj)
  expect(result.json.arr[2]).toBe(json.obj)
})

test('jsonpatch move', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4},
    unchanged: {}
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr/2'},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.error).toEqual(null)
  expect(result.json).toEqual({
    arr: [1, 2, {a:4}, 3],
    unchanged: {}
  })
  expect(result.revert).toEqual([
    {op: 'move', from: '/arr/2', path: '/obj'}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual(patch)
  expect(result.json.arr[2]).toBe(json.obj)
  expect(result.json.unchanged).toBe(json.unchanged)
})

test('jsonpatch move and replace', () => {
  const json = { a: 2, b: 3 }

  const patch = [
    {op: 'move', from: '/a', path: '/b'},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({ b : 2 })
  expect(result.revert).toEqual([
    {op:'move', from: '/b', path: '/a'},
    {op:'add', path:'/b', value: 3}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual([
    {op: 'remove', path: '/b'},
    {op: 'move', from: '/a', path: '/b'}
  ])
})

test('jsonpatch move and replace (nested)', () => {
  const json = {
    arr: [1,2,3],
    obj: {a : 4},
    unchanged: {}
  }

  const patch = [
    {op: 'move', from: '/obj', path: '/arr'},
  ]

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: {a:4},
    unchanged: {}
  })
  expect(result.revert).toEqual([
    {op:'move', from: '/arr', path: '/obj'},
    {op:'add', path:'/arr', value: [1,2,3]}
  ])

  // test revert
  const result2 = immutableJsonPatch(result.json, result.revert)

  expect(result2.json).toEqual(json)
  expect(result2.revert).toEqual([
    {op: 'remove', path: '/arr'},
    {op: 'move', from: '/obj', path: '/arr'}
  ])
  expect(result.json.unchanged).toBe(json.unchanged)
  expect(result2.json.unchanged).toBe(json.unchanged)
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

  const result = immutableJsonPatch(json, patch)

  expect(result.json).toEqual({
    arr: [1,2,3],
    obj: {a : 4},
    added: 'ok'
  })
  expect(result.revert).toEqual([
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

  const result = immutableJsonPatch(json, patch)

  // patch shouldn't be applied
  expect(result.json).toEqual({
    arr: [1,2,3],
    obj: {a : 4}
  })
  expect(result.revert).toEqual([])
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

  const result = immutableJsonPatch(json, patch)

  // patch shouldn't be applied
  expect(result.json).toEqual({
    arr: [1,2,3],
    obj: {a : 4}
  })
  expect(result.revert).toEqual([])
  expect(result.error.toString()).toEqual('Error: Test failed, value differs')
})
