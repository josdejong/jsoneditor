'use strict'

import { sort } from './actions'
import { assertDeepEqualEson } from './utils/assertDeepEqualEson'
import {esonToJson, expandOne, jsonToEson, META} from './eson'
import {patchEson} from './patchEson'

// TODO: test changeValue
// TODO: test changeProperty
// TODO: test changeType (or cleanup the function)
// TODO: test duplicate
// TODO: test insertBefore
// TODO: test replace
// TODO: test append
// TODO: test remove
// TODO: test removeAll

it('sort root Array', () => {
  const eson = jsonToEson([1,3,2])

  assertDeepEqualEson(patchEson(eson, sort(eson, [])).data, jsonToEson([1,2,3]))
  assertDeepEqualEson(patchEson(eson, sort(eson, [], 'asc')).data, jsonToEson([1,2,3]))
  assertDeepEqualEson(patchEson(eson, sort(eson, [], 'desc')).data, jsonToEson([3,2,1]))
})

it('sort nested Array', () => {
  const eson = jsonToEson({arr: [4,1,8,5,3,9,2,7,6]})
  const actual = patchEson(eson, sort(eson, ['arr'])).data
  const expected = jsonToEson({arr: [1,2,3,4,5,6,7,8,9]})
  assertDeepEqualEson(actual, expected)
})

it('sort nested Array reverse order', () => {
  // no order provided -> order ascending, but if nothing changes, order descending
  const eson = jsonToEson({arr: [1,2,3,4,5,6,7,8,9]})
  const actual = patchEson(eson, sort(eson, ['arr'])).data
  const expected = jsonToEson({arr: [9,8,7,6,5,4,3,2,1]})
  assertDeepEqualEson(actual, expected)

  // id's and META should be the same
  expect(actual.arr[META].id).toEqual(eson.arr[META].id)
  expect(actual.arr[7][META].id).toEqual(eson.arr[1][META].id)
})


it('sort root Object', () => {
  const eson = jsonToEson({c: 2, b: 3, a:4})

  expect(patchEson(eson, sort(eson, [])).data[META].props).toEqual(['a', 'b', 'c'])
  expect(patchEson(eson, sort(eson, [], 'asc')).data[META].props).toEqual(['a', 'b', 'c'])
  expect(patchEson(eson, sort(eson, [], 'desc')).data[META].props).toEqual(['c', 'b', 'a'])
})

it('sort nested Object', () => {
  const eson = jsonToEson({obj: {c: 2, b: 3, a:4}})
  eson.obj[META].expanded = true
  eson.obj.c[META].expanded = true

  const actual = patchEson(eson, sort(eson, ['obj'])).data

  // should keep META data
  expect(actual.obj[META].props).toEqual(['a', 'b', 'c'])
  expect(actual.obj[META].expanded).toEqual(true)
  expect(actual.obj.c[META].expanded).toEqual(true)
  expect(actual.obj[META].id).toEqual(eson.obj[META].id)
  expect(actual.obj.a[META].id).toEqual(eson.obj.a[META].id)
  expect(actual.obj.b[META].id).toEqual(eson.obj.b[META].id)
  expect(actual.obj.c[META].id).toEqual(eson.obj.c[META].id)

  // asc, desc
  expect(patchEson(eson, sort(eson, ['obj'])).data.obj[META].props).toEqual(['a', 'b', 'c'])
  expect(patchEson(eson, sort(eson, ['obj'], 'asc')).data.obj[META].props).toEqual(['a', 'b', 'c'])
  expect(patchEson(eson, sort(eson, ['obj'], 'desc')).data.obj[META].props).toEqual(['c', 'b', 'a'])
})

it('sort nested Object (larger)', () => {
  const eson = jsonToEson({obj: {h:1, c:1, e:1, d:1, g:1, b:1, a:1, f:1}})
  const actual = patchEson(eson, sort(eson, ['obj'])).data

  expect(actual.obj[META].props).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
})
