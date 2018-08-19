import { ID, TYPE, VALUE } from '../eson'
import uniq from 'lodash/uniq'
import each from 'lodash/each'

export function createAssertEqualEson(expect) {

  function assertEqualEson (actual, expected, ignoreIds = true) {
    if (expected === undefined) {
      throw new Error('Argument "expected" is undefined')
    }

    // regular deep equal
    expect(actual).toEqual(expected)

    assertEqualEsonKeys(actual, expected, ignoreIds)
  }

  function assertEqualEsonKeys (actual, expected, ignoreIds = true) {
    // collect all symbols
    const symbols = uniq(Object.getOwnPropertySymbols(actual)
        .concat(Object.getOwnPropertySymbols(expected)))

    // test whether all meta data is the same
    symbols
        .filter(symbol => symbol !== ID || ignoreIds)
        .forEach(symbol => expect(actual[symbol]).toEqual(expected[symbol]))

    if (actual[TYPE] === 'array') {
      each(expected, (item, index) => assertEqualEsonKeys(actual[index], expected[index], ignoreIds))
    }
    else if (actual[TYPE] === 'object') {
      each(actual, (value, key) => assertEqualEsonKeys(actual[key], expected[key]), ignoreIds)
    }
    else { // actual[TYPE] === 'value'
      expect(actual[VALUE]).toEqual(expected[VALUE])
    }
  }

  return assertEqualEson
}
