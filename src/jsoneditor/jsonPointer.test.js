import {compileJSONPointer, parseJSONPointer} from './jsonPointer'

test('parseJSONPointer', () => {
  expect(parseJSONPointer('/obj/a')).toEqual(['obj', 'a'])
  expect(parseJSONPointer('/arr/-')).toEqual(['arr', '-'])
  expect(parseJSONPointer('/foo/~1~0 ~0~1')).toEqual(['foo', '/~ ~/'])
  expect(parseJSONPointer('/obj')).toEqual(['obj'])
  expect(parseJSONPointer('/')).toEqual([''])
  expect(parseJSONPointer('')).toEqual([])
})

test('compileJSONPointer', () => {
  expect(compileJSONPointer(['foo', 'bar'])).toEqual('/foo/bar')
  expect(compileJSONPointer(['foo', '/~ ~/'])).toEqual('/foo/~1~0 ~0~1')
  expect(compileJSONPointer([''])).toEqual('/')
  expect(compileJSONPointer([])).toEqual('')
})
