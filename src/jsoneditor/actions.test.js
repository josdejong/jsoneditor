'use strict'

import { sort } from './actions'
import { createAssertEqualEson } from './utils/assertEqualEson'
import { ID, syncEson } from './eson'
import { immutableJsonPatch } from './immutableJsonPatch'

const assertEqualEson = createAssertEqualEson(expect)

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
  const eson = syncEson([1,3,2])

  assertEqualEson(immutableJsonPatch(eson, sort(eson, [])).json, syncEson([1,2,3]))
  assertEqualEson(immutableJsonPatch(eson, sort(eson, [], 'asc')).json, syncEson([1,2,3]))
  assertEqualEson(immutableJsonPatch(eson, sort(eson, [], 'desc')).json, syncEson([3,2,1]))
})

it('sort nested Array', () => {
  const eson = syncEson({arr: [4,1,8,5,3,9,2,7,6]})
  const actual = immutableJsonPatch(eson, sort(eson, ['arr'])).json
  const expected = syncEson({arr: [1,2,3,4,5,6,7,8,9]})
  assertEqualEson(actual, expected)
})

it('sort nested Array reverse order', () => {
  // no order provided -> order ascending, but if nothing changes, order descending
  const eson = syncEson({arr: [1,2,3,4,5,6,7,8,9]})
  const actual = immutableJsonPatch(eson, sort(eson, ['arr'])).json
  const expected = syncEson({arr: [9,8,7,6,5,4,3,2,1]})
  assertEqualEson(actual, expected)

  // id's and META should be the same
  expect(actual.arr[ID]).toEqual(eson.arr[ID])
  expect(actual.arr[7][ID]).toEqual(eson.arr[1][ID])
})
