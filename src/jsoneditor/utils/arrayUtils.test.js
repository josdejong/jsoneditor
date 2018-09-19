import { compareArrays } from './arrayUtils'

test('compareArrays', () => {
  expect(compareArrays([], [])).toEqual(0)
  expect(compareArrays(['a'], ['a'])).toEqual(0)
  expect(compareArrays(['a'], ['b'])).toEqual(-1)
  expect(compareArrays(['b'], ['a'])).toEqual(1)
  expect(compareArrays(['a'], ['a', 'b'])).toEqual(-1)
  expect(compareArrays(['a', 'b'], ['a'])).toEqual(1)
  expect(compareArrays(['a', 'b'], ['a', 'b'])).toEqual(0)

  const arrays = [
    ['b', 'a'],
    ['a'],
    [],
    ['b', 'c'],
    ['b'],
  ]

  expect(arrays.sort(compareArrays)).toEqual([
    [],
    ['a'],
    ['b'],
    ['b', 'a'],
    ['b', 'c']
  ])
})
