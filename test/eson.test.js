'use strict'

import { readFileSync } from 'fs'
import test from 'ava'
import { setIn, getIn, deleteIn } from '../src/utils/immutabilityHelpers'
import {
  META,
  esonToJson, pathExists, transform,
  parseJSONPointer, compileJSONPointer,
  jsonToEson,
  expand, expandOne, expandPath, applyErrors, search, nextSearchResult,
  previousSearchResult,
  applySelection, pathsFromSelection,
  SELECTED, SELECTED_END
} from '../src/eson'
import 'console.table'
import repeat from 'lodash/repeat'
import { assertDeepEqualEson } from './utils/assertDeepEqualEson'

test('jsonToEson', t => {
  assertDeepEqualEson(t, jsonToEson(1),     {[META]: {id: '[ID]', path: [], type: 'value', value: 1}})
  assertDeepEqualEson(t, jsonToEson("foo"), {[META]: {id: '[ID]', path: [], type: 'value', value: "foo"}})
  assertDeepEqualEson(t, jsonToEson(null),  {[META]: {id: '[ID]', path: [], type: 'value', value: null}})
  assertDeepEqualEson(t, jsonToEson(false), {[META]: {id: '[ID]', path: [], type: 'value', value: false}})
  assertDeepEqualEson(t, jsonToEson({a:1, b: 2}), {
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
  assertDeepEqualEson(t, actual, expected)
})

test('esonToJson', t => {
  const json = {
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  }
  const eson = jsonToEson(json)
  t.deepEqual(esonToJson(eson), json)
})

test('expand a single path', t => {
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
  t.is(collapsed.obj.arr[2][META].expanded, false)
  assertDeepEqualEson(t, deleteIn(collapsed, path.concat([META, 'expanded'])), eson)

  const expanded = expandOne(eson, path, true)
  t.is(expanded.obj.arr[2][META].expanded, true)
  assertDeepEqualEson(t, deleteIn(expanded, path.concat([META, 'expanded'])), eson)
})

test('expand all objects/arrays on a path', t => {
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
  t.is(collapsed[META].expanded, false)
  t.is(collapsed.obj[META].expanded, false)
  t.is(collapsed.obj.arr[META].expanded, false)
  t.is(collapsed.obj.arr[2][META].expanded, false)

  const expanded = expandPath(eson, path, true)
  t.is(expanded[META].expanded, true)
  t.is(expanded.obj[META].expanded, true)
  t.is(expanded.obj.arr[META].expanded, true)
  t.is(expanded.obj.arr[2][META].expanded, true)

  let orig = expanded
  orig = deleteIn(orig, [].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat([META, 'expanded']))

  assertDeepEqualEson(t, orig, eson)
})

test('expand a callback', t => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  function filterCallback (path) {
    return path.length >= 1
  }
  const expandedValue = false
  const collapsed = expand(eson, filterCallback, expandedValue)
  t.is(collapsed[META].expanded, undefined)
  t.is(collapsed.obj[META].expanded, expandedValue)
  t.is(collapsed.obj.arr[META].expanded, expandedValue)
  t.is(collapsed.obj.arr[2][META].expanded, expandedValue)

  let orig = collapsed
  orig = deleteIn(orig, ['obj'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat([META, 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat([META, 'expanded']))
  assertDeepEqualEson(t, orig, eson)
})

test('expand a callback should not change the object when nothing happens', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})
  function callback (path) {
    return false
  }
  const expanded = false
  const collapsed = expand(eson, callback, expanded)

  t.is(collapsed, eson)
})

test('transform (no change)', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})
  const updated = transform(eson, (value, path) => value)
  assertDeepEqualEson(t, updated, eson)
  t.is(updated, eson)
})

test('transform (change based on value)', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => value[META].value === 2 ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  assertDeepEqualEson(t, updated, expected)
  t.is(updated.b, eson.b) // should not have replaced b
})

test('transform (change based on path)', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => path.join('.') === 'a.1' ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  assertDeepEqualEson(t, updated, expected)
  t.is(updated.b, eson.b) // should not have replaced b
})

test('pathExists', t => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  t.is(pathExists(eson, ['obj', 'arr', 2, 'first']), true)
  t.is(pathExists(eson, ['obj', 'foo']), false)
  t.is(pathExists(eson, ['obj', 'foo', 'bar']), false)
  t.is(pathExists(eson, []), true)
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
  assertDeepEqualEson(t, actual1, expected)

  // re-applying the same errors should not change eson
  const actual2 = applyErrors(actual1, jsonSchemaErrors)
  t.is(actual2, actual1)

  // clear errors
  const actual3 = applyErrors(actual2, [])
  assertDeepEqualEson(t, actual3, eson)
  t.is(actual3.str, eson.str) // shouldn't have touched values not affected by the errors
})

test('search', t => {
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

  t.deepEqual(matches, [
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])
  t.deepEqual(active, {path: ['obj', 'arr', '2', 'last'], area: 'property'})

  let expected = esonWithSearch
  expected = setIn(expected, ['obj', 'arr', '2', 'last', META, 'searchProperty'], 'active')
  expected = setIn(expected, ['str', META, 'searchValue'], 'normal')
  expected = setIn(expected, ['nill', META, 'searchProperty'], 'normal')
  expected = setIn(expected, ['nill', META, 'searchValue'], 'normal')
  expected = setIn(expected, ['bool', META, 'searchProperty'], 'normal')
  expected = setIn(expected, ['bool', META, 'searchValue'], 'normal')

  assertDeepEqualEson(t, esonWithSearch, expected)
})

test('nextSearchResult', t => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const first = search(eson, 'A')

  t.deepEqual(first.searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(first.searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(first.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(first.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(first.eson, ['bool', META, 'searchValue']), 'normal')

  const second = nextSearchResult(first.eson, first.searchResult)
  t.deepEqual(second.searchResult.active, {path: ['obj', 'arr', '2', 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', META, 'searchValue']), 'normal')

  const third = nextSearchResult(second.eson, second.searchResult)
  t.deepEqual(third.searchResult.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', META, 'searchValue']), 'active')

  const wrappedAround = nextSearchResult(third.eson, third.searchResult)
  t.deepEqual(wrappedAround.searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(wrappedAround.eson, ['bool', META, 'searchValue']), 'normal')
})

test('previousSearchResult', t => {
  const eson = jsonToEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const init = search(eson, 'A')

  t.deepEqual(init.searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(init.searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(init.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(init.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(init.eson, ['bool', META, 'searchValue']), 'normal')

  const third = previousSearchResult(init.eson, init.searchResult)
  t.deepEqual(third.searchResult.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', META, 'searchValue']), 'active')

  const second = previousSearchResult(third.eson, third.searchResult)
  t.deepEqual(second.searchResult.active, {path: ['obj', 'arr', '2', 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', META, 'searchValue']), 'normal')

  const first = previousSearchResult(second.eson, second.searchResult)
  t.deepEqual(first.searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(first.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(first.eson, ['obj', 'arr', '2', 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(first.eson, ['bool', META, 'searchValue']), 'normal')
})

test('selection (object)', t => {
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
  assertDeepEqualEson(t, actual, expected)

  // test whether old selection results are cleaned up
  const selection2 = {
    start: ['nill'],
    end: ['bool']
  }
  const actual2 = applySelection(actual, selection2)
  let expected2 = eson
  expected2 = setIn(expected2, ['nill', META, 'selected'], SELECTED)
  expected2 = setIn(expected2, ['bool', META, 'selected'], SELECTED_END)
  assertDeepEqualEson(t, actual2, expected2)
})

test('selection (array)', t => {
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

  assertDeepEqualEson(t, actual, expected)
})

test('selection (value)', t => {
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
  assertDeepEqualEson(t, actual, expected)
})

test('selection (node)', t => {
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
  assertDeepEqualEson(t, actual, expected)
})

test('pathsFromSelection (object)', t => {
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

  t.deepEqual(pathsFromSelection(eson, selection), [
    ['obj'],
    ['str'],
    ['nill']
  ])
})

test('pathsFromSelection (array)', t => {
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

  t.deepEqual(pathsFromSelection(eson, selection), [
    ['obj', 'arr', '0'],
    ['obj', 'arr', '1']
  ])
})

test('pathsFromSelection (value)', t => {
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

  t.deepEqual(pathsFromSelection(eson, selection), [
    ['obj', 'arr', '2', 'first'],
  ])
})

test('pathsFromSelection (before)', t => {
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

  t.deepEqual(pathsFromSelection(eson, selection), [])
})

test('pathsFromSelection (after)', t => {
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

  t.deepEqual(pathsFromSelection(eson, selection), [])
})

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
