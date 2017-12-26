import { escapeHTML, unescapeHTML, findUniqueName } from './stringUtils'

test('escapeHTML', () => {
  expect(escapeHTML('   hello  ')).toEqual('\u00A0\u00A0 hello \u00A0')
  expect(escapeHTML('\u00A0 hello')).toEqual('\u00A0 hello')
  expect(escapeHTML('hello\nworld')).toEqual('hello\\nworld')

  // TODO: test escapeHTML more thoroughly
})

test('unescapeHTML', () => {
  expect(unescapeHTML(' \u00A0 hello \u00A0')).toEqual('   hello  ')
  expect(unescapeHTML('\u00A0 hello')).toEqual('  hello')

  expect(unescapeHTML('hello\\nworld')).toEqual('hello\nworld')

  // TODO: test unescapeHTML more thoroughly
})

test('findUniqueName', () => {
  expect(findUniqueName('other', ['a', 'b', 'c'])).toEqual('other')
  expect(findUniqueName('b', ['a', 'b', 'c'])).toEqual('b (copy)')
  expect(findUniqueName('b', ['a', 'b', 'c', 'b (copy)'])).toEqual('b (copy 2)')
  expect(findUniqueName('b', ['a', 'b', 'c', 'b (copy)', 'b (copy 2)'])).toEqual('b (copy 3)')
})
