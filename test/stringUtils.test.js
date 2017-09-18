import test from 'ava';
import { escapeHTML, unescapeHTML, findUniqueName } from '../src/utils/stringUtils'

test('escapeHTML', t => {
  t.is(escapeHTML('   hello  '), '\u00A0\u00A0 hello \u00A0')
  t.is(escapeHTML('\u00A0 hello'), '\u00A0 hello')
  t.is(escapeHTML('hello\nworld'), 'hello\\nworld')

  // TODO: test escapeHTML more thorougly
})

test('unescapeHTML', t => {
  t.is(unescapeHTML(' \u00A0 hello \u00A0'), '   hello  ')
  t.is(unescapeHTML('\u00A0 hello'), '  hello')

  t.is(unescapeHTML('hello\\nworld'), 'hello\nworld')

  // TODO: test unescapeHTML more thorougly
})

test('findUniqueName', t => {
  t.is(findUniqueName('other', ['a', 'b', 'c']), 'other')
  t.is(findUniqueName('b', ['a', 'b', 'c']), 'b (copy)')
  t.is(findUniqueName('b', ['a', 'b', 'c', 'b (copy)']), 'b (copy 2)')
  t.is(findUniqueName('b', ['a', 'b', 'c', 'b (copy)', 'b (copy 2)']), 'b (copy 3)')
})
