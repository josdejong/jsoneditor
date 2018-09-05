'use strict'

import { sort } from './actions'
import { createAssertEqualEson } from './utils/assertEqualEson'
import { ID, syncEson } from './eson'
import { immutableJSONPatch } from './immutableJSONPatch'

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

it('sort root Array (json)', () => {
  const json = [1,3,2]
  const sorted1 = immutableJSONPatch(json, sort(json, [])).json
  const sorted2 = immutableJSONPatch(json, sort(json, [], 'asc')).json
  const sorted3 = immutableJSONPatch(json, sort(json, [], 'desc')).json

  assertEqualEson(json, [1,3, 2]) // should be untouched
  assertEqualEson(sorted1, [1,2,3])
  assertEqualEson(sorted2, [1,2,3])
  assertEqualEson(sorted3, [3,2,1])
})

it('sort root Array (eson)', () => {
  const eson = syncEson([1,3,2])
  const sorted1 = immutableJSONPatch(eson, sort(eson, [])).json
  const sorted2 = immutableJSONPatch(eson, sort(eson, [], 'asc')).json
  const sorted3 = immutableJSONPatch(eson, sort(eson, [], 'desc')).json

  assertEqualEson(sorted1, syncEson([1, 2, 3]))
  assertEqualEson(sorted1[0], eson[0], false)
  assertEqualEson(sorted1[1], eson[2], false)
  assertEqualEson(sorted1[2], eson[1], false)
  expect(sorted1).not.toBe(eson)

  assertEqualEson(sorted2[0], eson[0], false)
  assertEqualEson(sorted2[1], eson[2], false)
  assertEqualEson(sorted2[2], eson[1], false)
  expect(sorted2).not.toBe(eson)

  assertEqualEson(sorted3[0], eson[1], false)
  assertEqualEson(sorted3[1], eson[2], false)
  assertEqualEson(sorted3[2], eson[0], false)
  expect(sorted3).not.toBe(eson)
})

it('sort nested Array', () => {
  const eson = syncEson({arr: [4,1,8,5,3,9,2,7,6]})
  const actual = immutableJSONPatch(eson, sort(eson, ['arr'])).json
  const expected = syncEson({arr: [1,2,3,4,5,6,7,8,9]})
  assertEqualEson(actual, expected)
})

it('sort nested Array reverse order', () => {
  // no order provided -> order ascending, but if nothing changes, order descending
  const eson = syncEson({arr: [1,2,3,4,5,6,7,8,9]})
  const actual = immutableJSONPatch(eson, sort(eson, ['arr'])).json
  const expected = syncEson({arr: [9,8,7,6,5,4,3,2,1]})
  assertEqualEson(actual, expected)

  // id's and META should be the same
  expect(actual.arr[ID]).toEqual(eson.arr[ID])
  expect(actual.arr[7][ID]).toEqual(eson.arr[1][ID])
})
