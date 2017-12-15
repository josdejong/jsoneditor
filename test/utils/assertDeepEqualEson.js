// TODO: move assertDeepEqualEson into a separate function
import {META} from "../../src/eson"
import lodashTransform from "lodash/transform"

export function assertDeepEqualEson (t, actual, expected, path = [], ignoreIds = true) {
  if (expected === undefined) {
    throw new Error('Argument "expected" is undefined')
  }

  // console.log('assertDeepEqualEson', actual, expected)

  const actualMeta = ignoreIds ? normalizeMetaIds(actual[META]) : actual[META]
  const expectedMeta = ignoreIds ? normalizeMetaIds(expected[META]) : expected[META]

  t.deepEqual(actualMeta, expectedMeta, `Meta data not equal, path=[${path.join(', ')}], actual[META]=${JSON.stringify(actualMeta)}, expected[META]=${JSON.stringify(expectedMeta)}`)

  if (actualMeta.type === 'Array') {
    t.deepEqual(actual.length, expected.length, 'Actual lengths of arrays should be equal, path=[${path.join(\', \')}]')
    actual.forEach((item, index) => assertDeepEqualEson(t, actual[index], expected[index], path.concat(index)), ignoreIds)
  }
  else if (actualMeta.type === 'Object') {
    t.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'Actual properties should be equal, path=[${path.join(\', \')}]')
    actualMeta.props.forEach(key => assertDeepEqualEson(t, actual[key], expected[key], path.concat(key)), ignoreIds)
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

