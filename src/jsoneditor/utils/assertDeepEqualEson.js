import {META} from "../eson"
import lodashTransform from "lodash/transform"

export function assertDeepEqualEson (actual, expected, path = [], ignoreIds = true) {
  if (expected === undefined) {
    throw new Error('Argument "expected" is undefined')
  }

  // console.log('assertDeepEqualEson', actual, expected)

  const actualMeta = ignoreIds ? normalizeMetaIds(actual[META]) : actual[META]
  const expectedMeta = ignoreIds ? normalizeMetaIds(expected[META]) : expected[META]

  expect(actualMeta).toEqual(expectedMeta)   // `Meta data not equal, path=[${path.join(', ')}], actual[META]=${JSON.stringify(actualMeta)}, expected[META]=${JSON.stringify(expectedMeta)}`

  if (actualMeta.type === 'Array') {
    expect(actual.length).toEqual(expected.length) // 'Actual lengths of arrays should be equal, path=[${path.join(\', \')}]'
    actual.forEach((item, index) => assertDeepEqualEson(actual[index], expected[index], path.concat(index)), ignoreIds)
  }
  else if (actualMeta.type === 'Object') {
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort()) // 'Actual properties should be equal, path=[${path.join(\', \')}]'
    actualMeta.props.forEach(key => assertDeepEqualEson(actual[key], expected[key], path.concat(key)), ignoreIds)
  }
  else {  // actual[META].type === 'value'
    expect(Object.keys(actual)).toEqual([]) // 'Value should not contain additional properties, path=[${path.join(\', \')}]'
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

