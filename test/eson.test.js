import { readFileSync } from 'fs'
import test from 'ava'
import { setIn, getIn } from '../src/utils/immutabilityHelpers'
import {
    jsonToEson, esonToJson, toEsonPath, toJsonPath, pathExists, transform, traverse,
    parseJSONPointer, compileJSONPointer,
    toEson2,
    expand, addErrors, search, applySearchResults, nextSearchResult, previousSearchResult,
    applySelection, pathsFromSelection,
    SELECTED, SELECTED_END
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

test('toEson2', t => {
  t.deepEqual(replaceIds2(toEson2(1)),     {_meta: {id: '[ID]', path: [], type: 'value', value: 1}})
  t.deepEqual(replaceIds2(toEson2("foo")), {_meta: {id: '[ID]', path: [], type: 'value', value: "foo"}})
  t.deepEqual(replaceIds2(toEson2(null)),  {_meta: {id: '[ID]', path: [], type: 'value', value: null}})
  t.deepEqual(replaceIds2(toEson2(false)), {_meta: {id: '[ID]', path: [], type: 'value', value: false}})
  t.deepEqual(replaceIds2(toEson2({a:1, b: 2})), {
    _meta: {id: '[ID]', path: [], type: 'Object', keys: ['a', 'b']},
    a: {_meta: {id: '[ID]', path: ['a'], type: 'value', value: 1}},
    b: {_meta: {id: '[ID]', path: ['b'], type: 'value', value: 2}}
  })

  printJSON(replaceIds2(toEson2([1,2])))
  t.deepEqual(replaceIds2(toEson2([1,2])), {
    _meta: {id: '[ID]', path: [], type: 'Array', length: 2},
    0: {_meta: {id: '[ID]', path: [0], type: 'value', value: 1}},
    1: {_meta: {id: '[ID]', path: [1], type: 'value', value: 2}}
  })
})

test('jsonToEson', t => {
  function expand (path) {
    return true
  }

  const eson = jsonToEson(JSON1, expand, [])
  replaceIds(eson)

  t.deepEqual(eson, ESON1)
})

test('esonToJson', t => {
  t.deepEqual(esonToJson(ESON1), JSON1)
})

test('expand a single path', t => {
  const path = ['obj', 'arr', 2]
  const collapsed = expand(ESON1, path, false)

  const expected = setIn(ESON1, toEsonPath(ESON1, path).concat('expanded'), false)

  t.deepEqual(collapsed, expected)
})

test('expand a callback', t => {
  function callback (path) {
    return path.length >= 1
  }
  const expanded = false
  const collapsed = expand(ESON1, callback, expanded)

  let expected = ESON1
  expected = setIn(expected, toEsonPath(ESON1, ['obj']).concat('expanded'), false)
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr']).concat('expanded'), false)
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr', '2']).concat('expanded'), false)

  t.deepEqual(collapsed, expected)
})

test('expand a callback should not change the object when nothing happens', t => {
  function callback (path) {
    return false
  }
  const expanded = false
  const collapsed = expand(ESON1, callback, expanded)

  t.is(collapsed, ESON1)
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
  const jsonSchemaErrors = [
    {dataPath: '/obj/arr/2/last', message: 'String expected'},
    {dataPath: '/nill', message: 'Null expected'}
  ]

  const actual = addErrors(ESON1, jsonSchemaErrors)

  let expected = ESON1
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr', '2', 'last']).concat(['error']), jsonSchemaErrors[0])
  expected = setIn(expected, toEsonPath(ESON1, ['nill']).concat(['error']), jsonSchemaErrors[1])

  t.deepEqual(actual, expected)
})

test('transform', t => {
  // {obj: {a: 2}, arr: [3]}

  let log = []
  const transformed = transform(ESON2, function (value, path, root) {
    t.is(root, ESON2)

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
  t.not(transformed, ESON2)
  t.not(transformed.props[0].value, ESON2.props[0].value)
  t.not(transformed.props[0].value.props[0].value, ESON2.props[0].value.props[0].value)
  t.is(transformed.props[1].value, ESON2.props[1].value)
  t.is(transformed.props[1].value.items[0].value, ESON2.props[1].value.items[0].value)

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
  const searchResults = search(ESON1, 'L')
  // printJSON(searchResults)

  t.deepEqual(searchResults, [
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ])

  const activeSearchResult = searchResults[0]
  const updatedData = applySearchResults(ESON1, searchResults, activeSearchResult)
  // printJSON(updatedData)

  let expected = ESON1
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr', '2', 'last']).slice(0, -1).concat(['searchResult']), 'active')
  expected = setIn(expected, toEsonPath(ESON1, ['str']).concat(['searchResult']), 'normal')
  expected = setIn(expected, toEsonPath(ESON1, ['nill']).slice(0, -1).concat(['searchResult']), 'normal')
  expected = setIn(expected, toEsonPath(ESON1, ['nill']).concat(['searchResult']), 'normal')
  expected = setIn(expected, toEsonPath(ESON1, ['bool']).slice(0, -1).concat(['searchResult']), 'normal')
  expected = setIn(expected, toEsonPath(ESON1, ['bool']).concat(['searchResult']), 'normal')

  t.deepEqual(updatedData, expected)
})

test('nextSearchResult', t => {
  const searchResults = [
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'}
  ]

  t.deepEqual(nextSearchResult(searchResults,
      {path: ['nill'], area: 'property'}),
      {path: ['nill'], area: 'value'})

  // wrap around
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['bool'], area: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], area: 'property'})

  // return first when current is not found
  t.deepEqual(nextSearchResult(searchResults,
      {path: ['non', 'existing'], area: 'value'}),
      {path: ['obj', 'arr', '2', 'last'], area: 'property'})

  // return null when searchResults are empty
  t.deepEqual(nextSearchResult([], {path: ['non', 'existing'], area: 'value'}), null)
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
    start: ['obj', 'arr', '2', 'last'],
    end: ['nill']
  }

  const actual = applySelection(ESON1, selection)

  let expected = ESON1
  expected = setIn(expected, toEsonPath(ESON1, ['obj']).concat(['selected']), SELECTED_END)
  expected = setIn(expected, toEsonPath(ESON1, ['str']).concat(['selected']), SELECTED)
  expected = setIn(expected, toEsonPath(ESON1, ['nill']).concat(['selected']), SELECTED)

  t.deepEqual(actual, expected)
})

test('selection (array)', t => {
  const selection = {
    start: ['obj', 'arr', '1'],
    end: ['obj', 'arr', '0'] // note the "wrong" order of start and end
  }

  const actual = applySelection(ESON1, selection)

  // FIXME: SELECTE_END should be selection.start, not the first
  let expected = ESON1
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr', '0']).concat(['selected']), SELECTED_END)
  expected = setIn(expected, toEsonPath(ESON1, ['obj', 'arr', '1']).concat(['selected']), SELECTED)

  t.deepEqual(actual, expected)
})

test('selection (value)', t => {
  const selection = {
    start: ['obj', 'arr', '2', 'first'],
    end: ['obj', 'arr', '2', 'first']
  }

  const actual = applySelection(ESON1, selection)
  const expected = setIn(ESON1, toEsonPath(ESON1, ['obj', 'arr', '2', 'first']).concat(['selected']), SELECTED_END)
  t.deepEqual(actual, expected)
})

test('selection (node)', t => {
  const selection = {
    start: ['obj', 'arr'],
    end: ['obj', 'arr']
  }

  const actual = applySelection(ESON1, selection)
  const expected = setIn(ESON1, toEsonPath(ESON1, ['obj', 'arr']).concat(['selected']), SELECTED_END)
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
