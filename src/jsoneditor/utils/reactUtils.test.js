import { weakKey } from './reactUtils'

test('weakKey should keep the key the same for objects and arrays', () => {
  const a = {x: 1}
  const b = {x: 1}
  const c = b
  const d = [1, 2, 3]
  const e = [1, 2, 3]

  expect(weakKey(a)).toEqual(weakKey(a))
  expect(weakKey(b)).toEqual(weakKey(b))
  expect(weakKey(a)).not.toEqual(weakKey(b))
  expect(weakKey(b)).toEqual(weakKey(c))
  expect(weakKey(d)).toEqual(weakKey(d))
  expect(weakKey(e)).toEqual(weakKey(e))
  expect(weakKey(d)).not.toEqual(weakKey(e))
  expect(weakKey(d)).not.toEqual(weakKey(e))
})

test('weakKey should return null for non-object and non-array items', () => {
  expect(weakKey('foo')).toBeNull()
  expect(weakKey(123)).toBeNull()
  expect(weakKey(null)).toBeNull()
  expect(weakKey(undefined)).toBeNull()
  expect(weakKey(true)).toBeNull()
})
