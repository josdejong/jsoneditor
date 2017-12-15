import { readFileSync } from 'fs'
import test from 'ava'
import { setIn, getIn, deleteIn } from '../src/utils/immutabilityHelpers'
import {
  esonToJson, toEsonPath, toJsonPath, pathExists, transform, traverse,
  parseJSONPointer, compileJSONPointer,
  jsonToEson,
  expand, expandOne, expandPath, applyErrors, search, nextSearchResult,
  previousSearchResult,
  applySelection, pathsFromSelection,
  SELECTED, SELECTED_END, spliceEsonArray
} from '../src/eson'
import deepMap from "deep-map/lib/index"

const JSON1 = loadJSON('./resources/json1.json')
const ESON1 = loadJSON('./resources/eson1.json')
const ESON2 = loadJSON('./resources/eson2.json')

test('toEsonPath', t => {
  const jsonPath = ['obj', 'arr', '2', 'last']
  const esonPath = [
    'props', '0', 'value',
    'props', '0', 'value',
    'items', '2', 'value',
    'props', '1', 'value'
  ]
  t.deepEqual(toEsonPath(ESON1, jsonPath), esonPath)
})

test('toJsonPath', t => {
  const jsonPath = ['obj', 'arr', '2', 'last']
  const esonPath = [
    'props', '0', 'value',
    'props', '0', 'value',
    'items', '2', 'value',
    'props', '1', 'value'
  ]
  t.deepEqual(toJsonPath(ESON1, esonPath), jsonPath)
})

test('jsonToEson', t => {
  t.deepEqual(replaceIds2(jsonToEson(1)),     {_meta: {id: '[ID]', path: [], type: 'value', value: 1}})
  t.deepEqual(replaceIds2(jsonToEson("foo")), {_meta: {id: '[ID]', path: [], type: 'value', value: "foo"}})
  t.deepEqual(replaceIds2(jsonToEson(null)),  {_meta: {id: '[ID]', path: [], type: 'value', value: null}})
  t.deepEqual(replaceIds2(jsonToEson(false)), {_meta: {id: '[ID]', path: [], type: 'value', value: false}})
  t.deepEqual(replaceIds2(jsonToEson({a:1, b: 2})), {
    _meta: {id: '[ID]', path: [], type: 'Object', keys: ['a', 'b']},
    a: {_meta: {id: '[ID]', path: ['a'], type: 'value', value: 1}},
    b: {_meta: {id: '[ID]', path: ['b'], type: 'value', value: 2}}
  })

  // printJSON(replaceIds2(jsonToEson([1,2])))
  t.deepEqual(replaceIds2(jsonToEson([1,2])), {
    _meta: {id: '[ID]', path: [], type: 'Array', length: 2},
    0: {_meta: {id: '[ID]', path: [0], type: 'value', value: 1}},
    1: {_meta: {id: '[ID]', path: [1], type: 'value', value: 2}}
  })
})

test('esonToJson', t => {
  t.deepEqual(esonToJson(ESON1), JSON1)
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
  t.is(collapsed.obj.arr[2]._meta.expanded, false)
  t.deepEqual(deleteIn(collapsed, path.concat(['_meta', 'expanded'])), eson)

  const expanded = expandOne(eson, path, true)
  t.is(expanded.obj.arr[2]._meta.expanded, true)
  t.deepEqual(deleteIn(expanded, path.concat(['_meta', 'expanded'])), eson)
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
  t.is(collapsed._meta.expanded, false)
  t.is(collapsed.obj._meta.expanded, false)
  t.is(collapsed.obj.arr._meta.expanded, false)
  t.is(collapsed.obj.arr[2]._meta.expanded, false)

  const expanded = expandPath(eson, path, true)
  t.is(expanded._meta.expanded, true)
  t.is(expanded.obj._meta.expanded, true)
  t.is(expanded.obj.arr._meta.expanded, true)
  t.is(expanded.obj.arr[2]._meta.expanded, true)

  let orig = expanded
  orig = deleteIn(orig, [].concat(['_meta', 'expanded']))
  orig = deleteIn(orig, ['obj'].concat(['_meta', 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat(['_meta', 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat(['_meta', 'expanded']))

  t.deepEqual(orig, eson)
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
  t.is(collapsed.obj.arr._meta.expanded, expandedValue)
  t.is(collapsed.obj.arr._meta.expanded, expandedValue)
  t.is(collapsed.obj.arr[2]._meta.expanded, expandedValue)

  let orig = collapsed
  orig = deleteIn(orig, ['obj'].concat(['_meta', 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr'].concat(['_meta', 'expanded']))
  orig = deleteIn(orig, ['obj', 'arr', 2].concat(['_meta', 'expanded']))
  t.deepEqual(orig, eson)
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
  t.deepEqual(updated, eson)
  t.is(updated, eson)
})

test('transform (change based on value)', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => value._meta.value === 2 ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  replaceIds(updated)
  replaceIds(expected)

  t.deepEqual(updated, expected)
  t.is(updated.b, eson.b) // should not have replaced b
})

test('transform (change based on path)', t => {
  const eson = jsonToEson({a: [1,2,3], b: {c: 4}})

  const updated = transform(eson,
      (value, path) => path.join('.') === 'a.1' ? jsonToEson(20, path) : value)
  const expected = jsonToEson({a: [1,20,3], b: {c: 4}})

  replaceIds(updated)
  replaceIds(expected)
  t.deepEqual(updated, expected)
  t.is(updated.b, eson.b) // should not have replaced b
})

test('pathExists', t => {
  t.is(pathExists(ESON1, ['obj', 'arr', 2, 'first']), true)
  t.is(pathExists(ESON1, ['obj', 'foo']), false)
  t.is(pathExists(ESON1, ['obj', 'foo', 'bar']), false)
  t.is(pathExists(ESON1, []), true)
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
  expected = setIn(expected, ['obj', 'arr', '2', 'last', '_meta', 'error'], jsonSchemaErrors[0])
  expected = setIn(expected, ['nill', '_meta', 'error'], jsonSchemaErrors[1])
  t.deepEqual(actual1, expected)

  // re-applying the same errors should not change eson
  const actual2 = applyErrors(actual1, jsonSchemaErrors)
  t.is(actual2, actual1)

  // clear errors
  const actual3 = applyErrors(actual2, [])
  t.deepEqual(actual3, eson)
  t.is(actual3.str, eson.str) // shouldn't have touched values not affected by the errors
})

test('traverse', t => {
  // {obj: {a: 2}, arr: [3]}

  let log = []
  const returnValue = traverse(ESON2, function (value, path, root) {
    t.is(root, ESON2)

    log.push([value, path, root])
  })

  t.is(returnValue, undefined)

  const EXPECTED_LOG = [
    [ESON2, [], ESON2],
    [ESON2.props[0].value, ['obj'], ESON2],
    [ESON2.props[0].value.props[0].value, ['obj', 'a'], ESON2],
    [ESON2.props[1].value, ['arr'], ESON2],
    [ESON2.props[1].value.items[0].value, ['arr', '0'], ESON2],
  ]

  log.forEach((row, index) => {
    t.deepEqual(log[index], EXPECTED_LOG[index], 'should have equal log at index ' + index )
  })
  t.deepEqual(log, EXPECTED_LOG)
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
  const searchResult = search(eson, 'L')
  const esonWithSearch = searchResult.eson
  const matches = searchResult.matches
  const active = searchResult.active

  t.deepEqual(matches, [
    {path: ['obj', 'arr', 2, 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])
  t.deepEqual(active, {path: ['obj', 'arr', 2, 'last'], area: 'property'})

  let expected = esonWithSearch
  expected = setIn(expected, ['obj', 'arr', '2', 'last', '_meta', 'searchProperty'], 'active')
  expected = setIn(expected, ['str', '_meta', 'searchValue'], 'normal')
  expected = setIn(expected, ['nill', '_meta', 'searchProperty'], 'normal')
  expected = setIn(expected, ['nill', '_meta', 'searchValue'], 'normal')
  expected = setIn(expected, ['bool', '_meta', 'searchProperty'], 'normal')
  expected = setIn(expected, ['bool', '_meta', 'searchValue'], 'normal')

  t.deepEqual(esonWithSearch, expected)
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
  const searchResult = search(eson, 'A')

  t.deepEqual(searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', 2, 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(searchResult.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'active')
  t.is(getIn(searchResult.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(searchResult.eson, ['bool', '_meta', 'searchValue']), 'normal')

  const second = nextSearchResult(searchResult.eson, searchResult.matches, searchResult.active)
  t.deepEqual(second.active, {path: ['obj', 'arr', 2, 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', '_meta', 'searchValue']), 'normal')

  const third = nextSearchResult(second.eson, second.matches, second.active)
  t.deepEqual(third.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', '_meta', 'searchValue']), 'active')

  const wrappedAround = nextSearchResult(third.eson, third.matches, third.active)
  t.deepEqual(wrappedAround.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'active')
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(wrappedAround.eson, ['bool', '_meta', 'searchValue']), 'normal')
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
  const searchResult = search(eson, 'A')

  t.deepEqual(searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', 2, 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(searchResult.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'active')
  t.is(getIn(searchResult.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(searchResult.eson, ['bool', '_meta', 'searchValue']), 'normal')

  const third = previousSearchResult(searchResult.eson, searchResult.matches, searchResult.active)
  t.deepEqual(third.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', '_meta', 'searchValue']), 'active')

  const second = previousSearchResult(third.eson, third.matches, third.active)
  t.deepEqual(second.active, {path: ['obj', 'arr', 2, 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', '_meta', 'searchValue']), 'normal')

  const first = previousSearchResult(second.eson, second.matches, second.active)
  t.deepEqual(first.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(first.eson, ['obj', 'arr', '_meta', 'searchProperty']), 'active')
  t.is(getIn(first.eson, ['obj', 'arr', 2, 'last', '_meta', 'searchProperty']), 'normal')
  t.is(getIn(first.eson, ['bool', '_meta', 'searchValue']), 'normal')
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
  expected = setIn(expected, ['obj', '_meta', 'selected'], SELECTED)
  expected = setIn(expected, ['str', '_meta', 'selected'], SELECTED)
  expected = setIn(expected, ['nill', '_meta', 'selected'], SELECTED_END)
  t.deepEqual(actual, expected)

  // test whether old selection results are cleaned up
  const selection2 = {
    start: ['nill'],
    end: ['bool']
  }
  const actual2 = applySelection(actual, selection2)
  let expected2 = eson
  expected2 = setIn(expected2, ['nill', '_meta', 'selected'], SELECTED)
  expected2 = setIn(expected2, ['bool', '_meta', 'selected'], SELECTED_END)
  t.deepEqual(actual2, expected2)
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
  expected = setIn(expected, ['obj', 'arr', '0', '_meta', 'selected'], SELECTED_END)
  expected = setIn(expected, ['obj', 'arr', '1', '_meta', 'selected'], SELECTED)

  t.deepEqual(actual, expected)
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
  const expected = setIn(eson, ['obj', 'arr', '2', 'first', '_meta', 'selected'], SELECTED_END)
  t.deepEqual(actual, expected)
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
  const expected = setIn(eson, ['obj', 'arr', '_meta', 'selected'], SELECTED_END)
  t.deepEqual(actual, expected)
})

test('pathsFromSelection (object)', t => {
  const selection = {
    start: ['obj', 'arr', '2', 'last'],
    end: ['nill']
  }

  t.deepEqual(pathsFromSelection(ESON1, selection), [
    ['obj'],
    ['str'],
    ['nill']
  ])
})

test('pathsFromSelection (array)', t => {
  const selection = {
    start: ['obj', 'arr', '1'],
    end: ['obj', 'arr', '0'] // note the "wrong" order of start and end
  }

  t.deepEqual(pathsFromSelection(ESON1, selection), [
    ['obj', 'arr', '0'],
    ['obj', 'arr', '1']
  ])
})

test('pathsFromSelection (value)', t => {
  const selection = {
    start: ['obj', 'arr', '2', 'first'],
    end: ['obj', 'arr', '2', 'first']
  }

  t.deepEqual(pathsFromSelection(ESON1, selection), [
    ['obj', 'arr', '2', 'first'],
  ])
})

test('pathsFromSelection (before)', t => {
  const selection = {
    before: ['obj', 'arr', '2', 'first']
  }

  t.deepEqual(pathsFromSelection(ESON1, selection), [])
})

test('pathsFromSelection (after)', t => {
  const selection = {
    after: ['obj', 'arr', '2', 'first']
  }

  t.deepEqual(pathsFromSelection(ESON1, selection), [])
})

test('spliceEsonArray', t => {
  const eson = jsonToEson([1,2,3])

  t.deepEqual(replaceIds(spliceEsonArray(eson, 1, 1)), replaceIds(jsonToEson([1,3])))
  t.deepEqual(replaceIds(spliceEsonArray(eson, 1, 5)), replaceIds(jsonToEson([1])))
  t.deepEqual(replaceIds(spliceEsonArray(eson, 1, 0, [10])), replaceIds(jsonToEson([1,5,3])))
  t.deepEqual(replaceIds(spliceEsonArray(eson, 1, 0, [10,20])), replaceIds(jsonToEson([1,10,20,3])))
})

// helper function to replace all id properties with a constant value
function replaceIds (eson, value = '[ID]') {
  eson._meta.id = value

  if (eson._meta.type === 'Object' || eson._meta.type === 'Array') {
    for (let key in eson) {
      if (eson.hasOwnProperty(key) && key !== '_meta') {
        replaceIds(eson[key], value)
      }
    }
  }
}

// helper function to replace all id properties with a constant value
function replaceIds2 (data, key = 'id', value = '[ID]') {
  return deepMap(data, (v, k) => k === key ? value : v)
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
