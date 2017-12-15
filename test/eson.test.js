import { readFileSync } from 'fs'
import test from 'ava'
import { setIn, getIn, deleteIn } from '../src/utils/immutabilityHelpers'
import {
  META,
  esonToJson, toEsonPath, toJsonPath, pathExists, transform, traverse,
  parseJSONPointer, compileJSONPointer,
  jsonToEson,
  expand, expandOne, expandPath, applyErrors, search, nextSearchResult,
  previousSearchResult,
  applySelection, pathsFromSelection,
  SELECTED, SELECTED_END
} from '../src/eson'
import 'console.table'
import lodashTransform from 'lodash/transform'
import repeat from 'lodash/repeat'

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
  assertDeepEqualEson(t, jsonToEson(1),     {[META]: {id: '[ID]', path: [], type: 'value', value: 1}})
  assertDeepEqualEson(t, jsonToEson("foo"), {[META]: {id: '[ID]', path: [], type: 'value', value: "foo"}})
  assertDeepEqualEson(t, jsonToEson(null),  {[META]: {id: '[ID]', path: [], type: 'value', value: null}})
  assertDeepEqualEson(t, jsonToEson(false), {[META]: {id: '[ID]', path: [], type: 'value', value: false}})
  assertDeepEqualEson(t, jsonToEson({a:1, b: 2}), {
    [META]: {id: '[ID]', path: [], type: 'Object', keys: ['a', 'b']},
    a: {[META]: {id: '[ID]', path: ['a'], type: 'value', value: 1}},
    b: {[META]: {id: '[ID]', path: ['b'], type: 'value', value: 2}}
  })

  const actual = jsonToEson([1,2])
  const expected = [
    {[META]: {id: '[ID]', path: [0], type: 'value', value: 1}},
    {[META]: {id: '[ID]', path: [1], type: 'value', value: 2}}
  ]
  expected[META] = {id: '[ID]', path: [], type: 'Array'}
  assertDeepEqualEson(t, actual, expected)
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
  const searchResult = search(eson, 'A')

  t.deepEqual(searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', 2, 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(searchResult.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(searchResult.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(searchResult.eson, ['bool', META, 'searchValue']), 'normal')

  const second = nextSearchResult(searchResult.eson, searchResult.matches, searchResult.active)
  t.deepEqual(second.active, {path: ['obj', 'arr', 2, 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', META, 'searchValue']), 'normal')

  const third = nextSearchResult(second.eson, second.matches, second.active)
  t.deepEqual(third.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', META, 'searchValue']), 'active')

  const wrappedAround = nextSearchResult(third.eson, third.matches, third.active)
  t.deepEqual(wrappedAround.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(wrappedAround.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
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
  const searchResult = search(eson, 'A')

  t.deepEqual(searchResult.matches, [
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', 2, 'last'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  t.deepEqual(searchResult.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(searchResult.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(searchResult.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(searchResult.eson, ['bool', META, 'searchValue']), 'normal')

  const third = previousSearchResult(searchResult.eson, searchResult.matches, searchResult.active)
  t.deepEqual(third.active, {path: ['bool'], area: 'value'})
  t.is(getIn(third.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
  t.is(getIn(third.eson, ['bool', META, 'searchValue']), 'active')

  const second = previousSearchResult(third.eson, third.matches, third.active)
  t.deepEqual(second.active, {path: ['obj', 'arr', 2, 'last'], area: 'property'})
  t.is(getIn(second.eson, ['obj', 'arr', META, 'searchProperty']), 'normal')
  t.is(getIn(second.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'active')
  t.is(getIn(second.eson, ['bool', META, 'searchValue']), 'normal')

  const first = previousSearchResult(second.eson, second.matches, second.active)
  t.deepEqual(first.active, {path: ['obj', 'arr'], area: 'property'})
  t.is(getIn(first.eson, ['obj', 'arr', META, 'searchProperty']), 'active')
  t.is(getIn(first.eson, ['obj', 'arr', 2, 'last', META, 'searchProperty']), 'normal')
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

function assertDeepEqualEson (t, actual, expected, path = [], ignoreIds = true) {
  const actualMeta = ignoreIds ? normalizeMetaIds(actual[META]) : actual[META]
  const expectedMeta = ignoreIds ? normalizeMetaIds(expected[META]) : expected[META]

  t.deepEqual(actualMeta, expectedMeta, `Meta data not equal, path=[${path.join(', ')}]`)

  if (actualMeta.type === 'Array') {
    t.deepEqual(actual.length, expected.length, 'Actual lengths of arrays should be equal, path=[${path.join(\', \')}]')
    actual.forEach((item, index) => assertDeepEqualEson(t, actual[index], expected[index], path.concat(index)), ignoreIds)
  }
  else if (actualMeta.type === 'Object') {
    t.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'Actual properties should be equal, path=[${path.join(\', \')}]')
    actualMeta.keys.forEach(key => assertDeepEqualEson(t, actual[key], expected[key], path.concat(key)), ignoreIds)
  }
  else {  // actual[META].type === 'value'
    t.deepEqual(Object.keys(actual), [], 'Value should not contain additional properties, path=[${path.join(\', \')}]')
  }
}

function normalizeMetaIds (meta) {
  return lodashTransform(meta, (result, value, key) => {
    if (key === 'id') {
      result[key] = '[ID]'
    }
    else {
      result[key] = value
    }
  }, {})
}

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
