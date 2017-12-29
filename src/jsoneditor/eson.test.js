'use strict'

import { readFileSync } from 'fs'
import { setIn, getIn, deleteIn } from './utils/immutabilityHelpers'
import {
  META,
  esonToJson, pathExists, transform,
  parseJSONPointer, compileJSONPointer,
  jsonToEson,
  expand, expandOne, expandPath, applyErrors, search, nextSearchResult,
  previousSearchResult,
  applySelection, pathsFromSelection,
  SELECTED, SELECTED_END, getEsonState
} from './eson'
import 'console.table'
import repeat from 'lodash/repeat'
import { assertDeepEqualEson } from './utils/assertDeepEqualEson'

test('jsonToEson', () => {
  assertDeepEqualEson(jsonToEson(1),     {[META]: {id: '[ID]', path: [], type: 'value', value: 1}})
  assertDeepEqualEson(jsonToEson("foo"), {[META]: {id: '[ID]', path: [], type: 'value', value: "foo"}})
  assertDeepEqualEson(jsonToEson(null),  {[META]: {id: '[ID]', path: [], type: 'value', value: null}})
  assertDeepEqualEson(jsonToEson(false), {[META]: {id: '[ID]', path: [], type: 'value', value: false}})
  assertDeepEqualEson(jsonToEson({a:1, b: 2}), {
    [META]: {id: '[ID]', path: [], type: 'Object', props: ['a', 'b']},
    a: {[META]: {id: '[ID]', path: ['a'], type: 'value', value: 1}},
    b: {[META]: {id: '[ID]', path: ['b'], type: 'value', value: 2}}
  })

  const actual = jsonToEson([1,2])
  const expected = [
    {[META]: {id: '[ID]', path: ['0'], type: 'value', value: 1}},
    {[META]: {id: '[ID]', path: ['1'], type: 'value', value: 2}}
  ]
  expected[META] = {id: '[ID]', path: [], type: 'Array'}
  assertDeepEqualEson(actual, expected)
})

test('esonToJson', () => {
  const json = {
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  }
  const eson = jsonToEson(json)
  expect(esonToJson(eson)).toEqual(json)
})

test('expand a single path', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  const path = ['obj', 'arr', 2]
  const collapsed = expandOne(eson, path, false)
  expect(collapsed.obj.arr[2][META].expanded).toEqual(false)
  assertDeepEqualEson(deleteIn(collapsed, path.concat([META, 'expanded'])), eson)

  const expanded = expandOne(eson, path, true)
  expect(expanded.obj.arr[2][META].expanded).toEqual(true)
  assertDeepEqualEson(deleteIn(expanded, path.concat([META, 'expanded'])), eson)
})

test('expand all objects/arrays on a path', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  const path = ['obj', 'arr', 2]

  const collapsed = expandPath(eson, path, false)
  expect(collapsed[META].expanded).toEqual(false)
  expect(collapsed.obj[META].expanded).toEqual(false)
  expect(collapsed.obj.arr[META].expanded).toEqual(false)
  expect(collapsed.obj.arr[2][META].expanded).toEqual(false)

  const expanded = expandPath(eson, path, true)
  expect(expanded[META].expanded).toEqual(true)
  expect(expanded.obj[META].expanded).toEqual(true)
  expect(expanded.obj.arr[META].expanded).toEqual(true)
  expect(expanded.obj.arr[2][META].expanded).toEqual(true)

  let orig = expanded
  orig = deleteIn(orig, [].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat([META, 'expanded']))

  assertDeepEqualEson(orig, eson)
})

test('expand a callback', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  function callback (path) {
    return (path.length >= 1)
        ? false     // collapse
        : undefined // leave untouched
  }
  const collapsed = expand(eson, callback)
  expect(collapsed[META].expanded).toEqual(undefined)
  expect(collapsed.obj[META].expanded).toEqual(false)
  expect(collapsed.obj.arr[META].expanded).toEqual(false)
  expect(collapsed.obj.arr[2][META].expanded).toEqual(false)

  let orig = collapsed
  orig = deleteIn(orig, ['obj'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat([META, 'expanded']))
  assertDeepEqualEson(orig, eson)
})

test('expand a callback should not change the object when nothing happens', () => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})
  function callback (path) {
    return undefined
  }
  const collapsed = expand(eson, callback)

  expect(collapsed).toBe(eson)
})

test('transform (no change)', () => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})
  const updated = transform(eson, (value, path) => value)
  assertDeepEqualEson(updated, eson)
  expect(updated).toBe(eson)
})

test('transform (change based on value)', () => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => value[META].value === 2 ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  assertDeepEqualEson(updated, expected)
  expect(updated.b).toBe(eson.b) // should not have replaced b
})

test('transform (change based on path)', () => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => path.join('.') === 'a.1' ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  assertDeepEqualEson(updated, expected)
  expect(updated.b).toBe(eson.b) // should not have replaced b
})

test('pathExists', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  expect(pathExists(eson, ['obj', 'arr', 2, 'first'])).toEqual(true)
  expect(pathExists(eson, ['obj', 'foo'])).toEqual(false)
  expect(pathExists(eson, ['obj', 'foo', 'bar'])).toEqual(false)
  expect(pathExists(eson, [])).toEqual(true)
})

test('parseJSONPointer', () => {
  expect(parseJSONPointer('/obj/a')).toEqual(['obj', 'a'])
  expect(parseJSONPointer('/arr/-')).toEqual(['arr', '-'])
  expect(parseJSONPointer('/foo/~1~0 ~0~1')).toEqual(['foo', '/~ ~/'])
  expect(parseJSONPointer('/obj')).toEqual(['obj'])
  expect(parseJSONPointer('/')).toEqual([''])
  expect(parseJSONPointer('')).toEqual([])
})

test('compileJSONPointer', () => {
  expect(compileJSONPointer(['foo', 'bar'])).toEqual('/foo/bar')
  expect(compileJSONPointer(['foo', '/~ ~/'])).toEqual('/foo/~1~0 ~0~1')
  expect(compileJSONPointer([''])).toEqual('/')
  expect(compileJSONPointer([])).toEqual('')
})

test('add and remove errors', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  const jsonSchemaErrors = [
    {dataPath: '/obj/arr/2/last', message: 'String expected'},
    {dataPath: '/nill', message: 'Null expected'}
  ]

  const actual1 = applyErrors(eson, jsonSchemaErrors)

  let expected = eson
  expected = setIn(expected, ['obj', 'arr', '2', 'last', META, 'error'], jsonSchemaErrors[0])
  expected = setIn(expected, ['nill', META, 'error'], jsonSchemaErrors[1])
  assertDeepEqualEson(actual1, expected)

  // re-applying the same errors should not change eson
  const actual2 = applyErrors(actual1, jsonSchemaErrors)
  expect(actual2).toBe(actual1)

  // clear errors
  const actual3 = applyErrors(actual2, [])
  assertDeepEqualEson(actual3, eson)
  expect(actual3.str).toEqual(eson.str) // shouldn't have touched values not affected by the errors
})

test('search', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const result = search(eson, 'L')
  const esonWithSearch = result.eson
  const matches = result.searchResult.matches
  const active = result.searchResult.active

  expect(matches).toEqual([
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])
  expect(active).toEqual({path: ['obj', 'arr', '2', 'last'], area: 'property'})

  let expected = esonWithSearch
  expected = setIn(expected, ['obj', 'arr', '2', 'last', META, 'searchProperty'], 'active')
  expected = setIn(expected, ['str', META, 'searchValue'], 'normal')
  expected = setIn(expected, ['nill', META, 'searchProperty'], 'normal')
  expected = setIn(expected, ['nill', META, 'searchValue'], 'normal')
  expected = setIn(expected, ['bool', META, 'searchProperty'], 'normal')
  expected = setIn(expected, ['bool', META, 'searchValue'], 'normal')

  assertDeepEqualEson(esonWithSearch, expected)
})

test('search number', () => {
  const eson = jsonToEson({
    "2": "two",
    "arr": ["a", "b", "c", "2"]
  })
  const result = search(eson, '2')
  const matches = result.searchResult.matches

  // should not match an array index, only props and values
  expect(matches).toEqual([
    {path: ['2'], area: 'property'},
    {path: ['arr', '3'], area: 'value'}
  ])
})

test('nextSearchResult', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const first = search(eson, 'A')

  expect(first.searchResult.matches).toEqual([
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  expect(first.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(first.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('active')
  expect(getIn(first.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(first.eson, ['bool', META, 'searchValue'])).toEqual('normal')

  const second = nextSearchResult(first.eson, first.searchResult)
  expect(second.searchResult.active).toEqual({path: ['obj', 'arr', '2', 'last'], area: 'property'})
  expect(getIn(second.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(second.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('active')
  expect(getIn(second.eson, ['bool', META, 'searchValue'])).toEqual('normal')

  const third = nextSearchResult(second.eson, second.searchResult)
  expect(third.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(third.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(third.eson, ['bool', META, 'searchValue'])).toEqual('active')

  const wrappedAround = nextSearchResult(third.eson, third.searchResult)
  expect(wrappedAround.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(wrappedAround.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('active')
  expect(getIn(wrappedAround.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(wrappedAround.eson, ['bool', META, 'searchValue'])).toEqual('normal')
})

test('previousSearchResult', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const init = search(eson, 'A')

  expect(init.searchResult.matches).toEqual([
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  expect(init.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(init.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('active')
  expect(getIn(init.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(init.eson, ['bool', META, 'searchValue'])).toEqual('normal')

  const third = previousSearchResult(init.eson, init.searchResult)
  expect(third.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(third.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(third.eson, ['bool', META, 'searchValue'])).toEqual('active')

  const second = previousSearchResult(third.eson, third.searchResult)
  expect(second.searchResult.active).toEqual({path: ['obj', 'arr', '2', 'last'], area: 'property'})
  expect(getIn(second.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(second.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('active')
  expect(getIn(second.eson, ['bool', META, 'searchValue'])).toEqual('normal')

  const first = previousSearchResult(second.eson, second.searchResult)
  expect(first.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(first.eson, ['obj', 'arr', META, 'searchProperty'])).toEqual('active')
  expect(getIn(first.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty'])).toEqual('normal')
  expect(getIn(first.eson, ['bool', META, 'searchValue'])).toEqual('normal')
})

test('selection (object)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '2', 'last'],
    end: ['nill']
  }

  const actual = applySelection(eson, selection)

  let expected = eson
  expected = setIn(expected, ['obj', META, 'selected'], SELECTED)
  expected = setIn(expected, ['str', META, 'selected'], SELECTED)
  expected = setIn(expected, ['nill', META, 'selected'], SELECTED_END)
  assertDeepEqualEson(actual, expected)

  // test whether old selection results are cleaned up
  const selection2 = {
    start: ['nill'],
    end: ['bool']
  }
  const actual2 = applySelection(actual, selection2)
  let expected2 = eson
  expected2 = setIn(expected2, ['nill', META, 'selected'], SELECTED)
  expected2 = setIn(expected2, ['bool', META, 'selected'], SELECTED_END)
  assertDeepEqualEson(actual2, expected2)
})

test('selection (array)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '1'],
    end: ['obj', 'arr', '0'] // note the "wrong" order of start and end
  }

  const actual = applySelection(eson, selection)

  let expected = eson
  expected = setIn(expected, ['obj', 'arr', '0', META, 'selected'], SELECTED_END)
  expected = setIn(expected, ['obj', 'arr', '1', META, 'selected'], SELECTED)

  assertDeepEqualEson(actual, expected)
})

test('selection (value)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '2', 'first'],
    end: ['obj', 'arr', '2', 'first']
  }

  const actual = applySelection(eson, selection)
  const expected = setIn(eson, ['obj', 'arr', '2', 'first', META, 'selected'], SELECTED_END)
  assertDeepEqualEson(actual, expected)
})

test('selection (node)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr'],
    end: ['obj', 'arr']
  }

  const actual = applySelection(eson, selection)
  const expected = setIn(eson, ['obj', 'arr', META, 'selected'], SELECTED_END)
  assertDeepEqualEson(actual, expected)
})

test('pathsFromSelection (object)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '2', 'last'],
    end: ['nill']
  }

  expect(pathsFromSelection(eson, selection)).toEqual([
    ['obj'],
    ['str'],
    ['nill']
  ])
})

test('pathsFromSelection (array)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '1'],
    end: ['obj', 'arr', '0'] // note the "wrong" order of start and end
  }

  expect(pathsFromSelection(eson, selection)).toEqual([
    ['obj', 'arr', '0'],
    ['obj', 'arr', '1']
  ])
})

test('pathsFromSelection (value)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    start: ['obj', 'arr', '2', 'first'],
    end: ['obj', 'arr', '2', 'first']
  }

  expect(pathsFromSelection(eson, selection)).toEqual([
    ['obj', 'arr', '2', 'first'],
  ])
})

test('pathsFromSelection (before)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    before: ['obj', 'arr', '2', 'first']
  }

  expect(pathsFromSelection(eson, selection)).toEqual([])
})

test('pathsFromSelection (after)', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const selection = {
    after: ['obj', 'arr', '2', 'first']
  }

  expect(pathsFromSelection(eson, selection)).toEqual([])
})

test('getEsonState', () => {
  const eson = jsonToEson({
    "obj": {
      "arr": ["1",2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  eson.obj[META].expanded = true
  eson.obj.arr[META].expanded = false
  eson.obj.arr[0][META].type = 'string'
  eson.obj.arr[2][META].expanded = true

  const state = getEsonState(eson)

  expect(state).toEqual({
    '/obj': { expanded: true },
    '/obj/arr/0': { type: 'string' },
    '/obj/arr/2': { expanded: true },
  })
})

// TODO: test applyEsonState

// helper function to print JSON in the console
function printJSON (json, message = null) {
  if (message) {
    console.log(message)
  }
  console.log(JSON.stringify(json, null, 2))
}

function printESON (eson, message = null) {
  if (message) {
    console.log(message)
  }

  let data = []

  transform(eson, function (value, path) {
    // const strPath = padEnd(, 20)
    // console.log(`${strPath} ${'value' in value[META] ? value[META].value : ''} ${JSON.stringify(value[META])}`)

    data.push({
      path: '[' + path.join(', ') + ']',
      value: repeat('  ', path.length) + (value[META].type === 'Object'
          ? '{...}'
          : value[META].type === 'Array'
              ? '[...]'
              : JSON.stringify(value[META].value)),
      meta: JSON.stringify(value[META])
    })

    return value
  })

  console.table(data)
}

// helper function to load a JSON file
function loadJSON (filename) {
  return JSON.parse(readFileSync(__dirname + '/' + filename, 'utf-8'))
}
