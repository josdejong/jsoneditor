import { ID } from '../eson'
import { deleteIn, transform } from './immutabilityHelpers'

export function createAssertEqualEson(expect) {

  function assertEqualEson (actual, expected, ignoreIds = true) {
    if (expected === undefined) {
      throw new Error('Argument "expected" is undefined')
    }

    if (ignoreIds) {
      const actualWithoutIds = stripValueOf(stripIdSymbols(actual))
      const expectedWithoutIds = stripValueOf(stripIdSymbols(expected))

      expect(actualWithoutIds).toEqual(expectedWithoutIds)
    }
    else {
      expect(actual).toEqual(expected)
    }
  }

  function stripIdSymbols (eson) {
    return transform(eson, (value) => deleteIn(value, [ID]))
  }

  function stripValueOf (eson) {
    return transform(eson, (value) => deleteIn(value, ['valueOf']))
  }

  return assertEqualEson
}
