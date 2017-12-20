'use strict'

import test from 'ava'
import {
  sort
} from '../src/actions'
import { assertDeepEqualEson } from './utils/assertDeepEqualEson'
import {esonToJson, expandOne, jsonToEson, META} from '../src/eson'
import {patchEson} from '../src/patchEson'

// TODO: test changeValue
// TODO: test changeProperty
// TODO: test changeType (or cleanup the function)
// TODO: test duplicate
// TODO: test insertBefore
// TODO: test replace
// TODO: test append
// TODO: test remove
// TODO: test removeAll

test('sort root Array', t => {
  const eson = jsonToEson([1,3,2])

  assertDeepEqualEson(t, patchEson(eson, sort(eson, [])).data, jsonToEson([1,2,3]))
  assertDeepEqualEson(t, patchEson(eson, sort(eson, [], 'asc')).data, jsonToEson([1,2,3]))
  assertDeepEqualEson(t, patchEson(eson, sort(eson, [], 'desc')).data, jsonToEson([3,2,1]))
})

test('sort nested Array', t => {
  const eson = jsonToEson({arr: [4,1,8,5,3,9,2,7,6]})
  const actual = patchEson(eson, sort(eson, ['arr'])).data
  const expected = jsonToEson({arr: [1,2,3,4,5,6,7,8,9]})
  assertDeepEqualEson(t, actual, expected)
})

test('sort nested Array reverse order', t => {
  // no order provided -> order ascending, but if nothing changes, order descending
  const eson = jsonToEson({arr: [1,2,3,4,5,6,7,8,9]})
  const actual = patchEson(eson, sort(eson, ['arr'])).data
  const expected = jsonToEson({arr: [9,8,7,6,5,4,3,2,1]})
  assertDeepEqualEson(t, actual, expected)

  // id's and META should be the same
  t.deepEqual(actual.arr[META].id, eson.arr[META].id)
  t.deepEqual(actual.arr[7][META].id, eson.arr[1][META].id)
})


test('sort root Object', t => {
  const eson = jsonToEson({c: 2, b: 3, a:4})

  t.deepEqual(patchEson(eson, sort(eson, [])).data[META].props, ['a', 'b', 'c'])
  t.deepEqual(patchEson(eson, sort(eson, [], 'asc')).data[META].props, ['a', 'b', 'c'])
  t.deepEqual(patchEson(eson, sort(eson, [], 'desc')).data[META].props, ['c', 'b', 'a'])
})

test('sort nested Object', t => {
  const eson = jsonToEson({obj: {c: 2, b: 3, a:4}})
  eson.obj[META].expanded = true
  eson.obj.c[META].expanded = true

  const actual = patchEson(eson, sort(eson, ['obj'])).data

  // should keep META data
  t.deepEqual(actual.obj[META].props, ['a', 'b', 'c'])
  t.deepEqual(actual.obj[META].expanded, true)
  t.deepEqual(actual.obj.c[META].expanded, true)
  t.deepEqual(actual.obj[META].id, eson.obj[META].id)
  t.deepEqual(actual.obj.a[META].id, eson.obj.a[META].id)
  t.deepEqual(actual.obj.b[META].id, eson.obj.b[META].id)
  t.deepEqual(actual.obj.c[META].id, eson.obj.c[META].id)

  // asc, desc
  t.deepEqual(patchEson(eson, sort(eson, ['obj'])).data.obj[META].props, ['a', 'b', 'c'])
  t.deepEqual(patchEson(eson, sort(eson, ['obj'], 'asc')).data.obj[META].props, ['a', 'b', 'c'])
  t.deepEqual(patchEson(eson, sort(eson, ['obj'], 'desc')).data.obj[META].props, ['c', 'b', 'a'])
})
