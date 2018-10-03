import {
  applyErrors,
  applySelection, ERROR,
  expand,
  EXPANDED,
  expandOne,
  expandPath,
  ID,
  nextSearchResult,
  pathsFromSelection,
  previousSearchResult,
  applySearch, SEARCH_PROPERTY, SEARCH_VALUE,
  SELECTED,
  SELECTED_END,
  SELECTED_FIRST,
  SELECTED_LAST,
  SELECTED_START, SELECTION,
  syncEson,
  TYPE,
  VALUE
} from './eson'
import { getIn, setIn } from './utils/immutabilityHelpers'
import { createAssertEqualEson } from './utils/assertEqualEson'

const assertEqualEson = createAssertEqualEson(expect)

test('syncEson', () => {
  const json1 = {
    arr: [1,2,3],
    obj: {a : 2}
  }

  const nodeState1 = syncEson(json1, undefined)

  expect(nodeState1[ID]).toBeDefined()
  expect(nodeState1[TYPE]).toEqual('object')
  expect(nodeState1[EXPANDED]).toEqual(false)
  expect(nodeState1[VALUE]).toBeUndefined()
  expect(nodeState1.arr[ID]).toBeDefined()
  expect(nodeState1.arr[TYPE]).toEqual('array')
  expect(nodeState1.arr[VALUE]).toBeUndefined()
  expect(nodeState1.arr[EXPANDED]).toEqual(false)
  expect(nodeState1.arr[0][ID]).toBeDefined()
  expect(nodeState1.arr[0][TYPE]).toEqual('value')
  expect(nodeState1.arr[0][VALUE]).toEqual(1)
  expect(nodeState1.arr[0][EXPANDED]).toEqual(false)
  expect(nodeState1.arr[1][ID]).toBeDefined()
  expect(nodeState1.arr[1][TYPE]).toEqual('value')
  expect(nodeState1.arr[1][VALUE]).toEqual(2)
  expect(nodeState1.arr[1][EXPANDED]).toEqual(false)
  expect(nodeState1.arr[2][ID]).toBeDefined()
  expect(nodeState1.arr[2][TYPE]).toEqual('value')
  expect(nodeState1.arr[2][VALUE]).toEqual(3)
  expect(nodeState1.arr[2][EXPANDED]).toEqual(false)
  expect(nodeState1.obj[ID]).toBeDefined()
  expect(nodeState1.obj[TYPE]).toEqual('object')
  expect(nodeState1.obj[VALUE]).toBeUndefined()
  expect(nodeState1.obj[EXPANDED]).toEqual(false)
  expect(nodeState1.obj.a[ID]).toBeDefined()
  expect(nodeState1.obj.a[TYPE]).toEqual('value')
  expect(nodeState1.obj.a[VALUE]).toEqual(2)
  expect(nodeState1.obj.a[EXPANDED]).toEqual(false)

  const json2 = {
    arr: [1, 2],
    obj: {a : 2, b : 4}
  }
  const nodeState2 = syncEson(json2, nodeState1)

  // ID's should be the same for unchanged contents
  expect(nodeState2[ID]).toEqual(nodeState1[ID])
  expect(nodeState2.arr[ID]).toEqual(nodeState1.arr[ID])
  expect(nodeState2.arr[0][ID]).toEqual(nodeState1.arr[0][ID])
  expect(nodeState2.arr[1][ID]).toEqual(nodeState1.arr[1][ID])
  expect(nodeState2.obj[ID]).toEqual(nodeState1.obj[ID])
  expect(nodeState2.obj.a[ID]).toEqual(nodeState1.obj.a[ID])
})

test('syncEson (replace a value)', () => {
  const json1 = {
    value: 1
  }
  const eson1 = syncEson(json1, undefined)

  expect(eson1.value[ID]).toBeDefined()
  expect(eson1.value[TYPE]).toEqual('value')
  expect(eson1.value[VALUE]).toEqual(1)

  const json2 = {
    value: 2
  }
  const eson2 = syncEson(json2, eson1)

  expect(eson2.value[ID]).toBeDefined()
  expect(eson2.value[TYPE]).toEqual('value')
  expect(eson2.value[VALUE]).toEqual(2)

  // eson1 should be untouched
  expect(eson1.value[VALUE]).toEqual(1)

  const json3 = {
    value: 2 // samve as json2
  }
  const eson3 = syncEson(json3, eson2)
  expect(eson3.value).toBe(eson2.value)
  expect(eson3).toBe(eson2)
})

test('expand a single path', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  const path = ['obj', 'arr', 2]
  const collapsed = expandOne(eson, path, false)
  expect(collapsed.obj.arr[2][EXPANDED]).toEqual(false)

  const expanded = expandOne(eson, path, true)
  expect(expanded.obj.arr[2][EXPANDED]).toEqual(true)
})

test('expand all objects/arrays on a path', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  const path = ['obj', 'arr', 2]

  const collapsed = expandPath(eson, path, false)
  expect(collapsed[EXPANDED]).toEqual(false)
  expect(collapsed.obj[EXPANDED]).toEqual(false)
  expect(collapsed.obj.arr[EXPANDED]).toEqual(false)
  expect(collapsed.obj.arr[2][EXPANDED]).toEqual(false)

  const expanded = expandPath(eson, path, true)
  expect(expanded[EXPANDED]).toEqual(true)
  expect(expanded.obj[EXPANDED]).toEqual(true)
  expect(expanded.obj.arr[EXPANDED]).toEqual(true)
  expect(expanded.obj.arr[2][EXPANDED]).toEqual(true)
})

test('expand a callback', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })

  function callback (path) {
    return (path.length >= 1)
        ? true     // expand
        : undefined // leave untouched
  }
  const expanded = expand(eson, callback)
  expect(expanded[EXPANDED]).toEqual(false)
  expect(expanded.obj[EXPANDED]).toEqual(true)
  expect(expanded.obj.arr[EXPANDED]).toEqual(true)
  expect(expanded.obj.arr[2][EXPANDED]).toEqual(true)
})

test('expand a callback should not change the object when nothing happens', () => {
  const eson = syncEson({a: [1,2,3], b: {c: 4}})
  function callback (path) {
    return undefined
  }
  const collapsed = expand(eson, callback)

  expect(collapsed).toBe(eson)
})

test('add and remove errors', () => {
  const eson = syncEson({
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
  expected = setIn(expected, ['obj', 'arr', '2', 'last', ERROR], jsonSchemaErrors[0])
  expected = setIn(expected, ['nill', ERROR], jsonSchemaErrors[1])

  assertEqualEson(actual1, expected)

  // re-applying the same errors should not change eson
  const actual2 = applyErrors(actual1, jsonSchemaErrors)
  expect(actual2).toBe(actual1)

  // clear errors
  const actual3 = applyErrors(actual2, [])
  assertEqualEson(actual3, eson)
  expect(actual3.str).toEqual(eson.str) // shouldn't have touched values not affected by the errors
})

test('search', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const result = applySearch(eson, 'L')
  const esonWithSearch = result.eson
  const matches = result.searchResult.matches
  const active = result.searchResult.active

  expect(matches).toEqual([
    {path: ['bool'], area: 'property'},
    {path: ['bool'], area: 'value'},
    {path: ['nill'], area: 'property'},
    {path: ['nill'], area: 'value'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
    {path: ['str'], area: 'value'},
  ])
  expect(active).toEqual({path: ['bool'], area: 'property'})

  let expected = esonWithSearch
  expected = setIn(expected, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY], 'active')
  expected = setIn(expected, ['str', SEARCH_VALUE], 'normal')
  expected = setIn(expected, ['nill', SEARCH_PROPERTY], 'normal')
  expected = setIn(expected, ['nill', SEARCH_VALUE], 'normal')
  expected = setIn(expected, ['bool', SEARCH_PROPERTY], 'normal')
  expected = setIn(expected, ['bool', SEARCH_VALUE], 'normal')

  assertEqualEson(esonWithSearch, expected)
})

test('search number', () => {
  const eson = syncEson({
    "2": "two",
    "arr": ["a", "b", "c", "2"]
  })
  const result = applySearch(eson, '2')
  const matches = result.searchResult.matches

  // should not match an array index, only props and values
  expect(matches).toEqual([
    {path: ['2'], area: 'property'},
    {path: ['arr', '3'], area: 'value'}
  ])
})

test('nextSearchResult', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const first = applySearch(eson, 'A')

  expect(first.searchResult.matches).toEqual([
    {path: ['bool'], area: 'value'},
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
  ])

  expect(first.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(first.eson, ['bool', SEARCH_VALUE])).toEqual('active')
  expect(getIn(first.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(first.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')

  const second = nextSearchResult(first.eson, first.searchResult)
  expect(second.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(second.eson, ['bool', SEARCH_VALUE])).toEqual('normal')
  expect(getIn(second.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('active')
  expect(getIn(second.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')

  const third = nextSearchResult(second.eson, second.searchResult)
  expect(third.searchResult.active).toEqual({path: ['obj', 'arr', '2', 'last'], area: 'property'})
  expect(getIn(third.eson, ['bool', SEARCH_VALUE])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('active')

  const wrappedAround = nextSearchResult(third.eson, third.searchResult)
  expect(wrappedAround.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(wrappedAround.eson, ['bool', SEARCH_VALUE])).toEqual('active')
  expect(getIn(wrappedAround.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(wrappedAround.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')
})

test('previousSearchResult', () => {
  const eson = syncEson({
    "obj": {
      "arr": [1,2, {"first":3,"last":4}]
    },
    "str": "hello world",
    "nill": null,
    "bool": false
  })
  const init = applySearch(eson, 'A')

  expect(init.searchResult.matches).toEqual([
    {path: ['bool'], area: 'value'},
    {path: ['obj', 'arr'], area: 'property'},
    {path: ['obj', 'arr', '2', 'last'], area: 'property'},
  ])

  expect(init.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(init.eson, ['bool', SEARCH_VALUE])).toEqual('active')
  expect(getIn(init.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(init.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')

  const third = previousSearchResult(init.eson, init.searchResult)
  expect(third.searchResult.active).toEqual({path: ['obj', 'arr', '2', 'last'], area: 'property'})
  expect(getIn(third.eson, ['bool', SEARCH_VALUE])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(third.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('active')

  const second = previousSearchResult(third.eson, third.searchResult)
  expect(second.searchResult.active).toEqual({path: ['obj', 'arr'], area: 'property'})
  expect(getIn(second.eson, ['bool', SEARCH_VALUE])).toEqual('normal')
  expect(getIn(second.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('active')
  expect(getIn(second.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')

  const first = previousSearchResult(second.eson, second.searchResult)
  expect(first.searchResult.active).toEqual({path: ['bool'], area: 'value'})
  expect(getIn(first.eson, ['bool', SEARCH_VALUE])).toEqual('active')
  expect(getIn(first.eson, ['obj', 'arr', SEARCH_PROPERTY])).toEqual('normal')
  expect(getIn(first.eson, ['obj', 'arr', '2', 'last', SEARCH_PROPERTY])).toEqual('normal')
})

// FIXME: test selection
test('selection (object)', () => {
  const eson = syncEson({
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
  expected = setIn(expected, ['obj', SELECTION], SELECTED + SELECTED_START + SELECTED_FIRST)
  expected = setIn(expected, ['str', SELECTION], SELECTED)
  expected = setIn(expected, ['nill', SELECTION], SELECTED + SELECTED_END + SELECTED_LAST)
  assertEqualEson(actual, expected)

  // test whether old selection results are cleaned up
  const selection2 = {
    start: ['nill'],
    end: ['bool']
  }
  const actual2 = applySelection(actual, selection2)
  let expected2 = eson
  expected2 = setIn(expected2, ['nill', SELECTION], SELECTED + SELECTED_START + SELECTED_FIRST)
  expected2 = setIn(expected2, ['bool', SELECTION], SELECTED + SELECTED_END + SELECTED_LAST)
  assertEqualEson(actual2, expected2)
})

// FIXME: test selection
test('selection (array)', () => {
  const eson = syncEson({
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
  expected = setIn(expected, ['obj', 'arr', '0', SELECTION],
      SELECTED + SELECTED_END + SELECTED_FIRST)
  expected = setIn(expected, ['obj', 'arr', '1', SELECTION],
      SELECTED + SELECTED_START + SELECTED_LAST)

  assertEqualEson(actual, expected)
})

// FIXME: test selection
test('selection (value)', () => {
  const eson = syncEson({
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
  const expected = setIn(eson, ['obj', 'arr', '2', 'first', SELECTION],
      SELECTED + SELECTED_START + SELECTED_END + SELECTED_FIRST + SELECTED_LAST)
  assertEqualEson(actual, expected)
})

// FIXME: test selection
test('selection (node)', () => {
  const eson = syncEson({
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
  const expected = setIn(eson, ['obj', 'arr', SELECTION],
      SELECTED + SELECTED_START + SELECTED_END + SELECTED_FIRST + SELECTED_LAST)
  assertEqualEson(actual, expected)
})
