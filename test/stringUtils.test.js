import test from 'ava';
import { findUniqueName } from '../src/utils/stringUtils'

test('findUniqueName', t => {

  t.is(findUniqueName('other', ['a', 'b', 'c']), 'other')
  t.is(findUniqueName('b', ['a', 'b', 'c']), 'b (copy)')
  t.is(findUniqueName('b', ['a', 'b', 'c', 'b (copy)']), 'b (copy 2)')
  t.is(findUniqueName('b', ['a', 'b', 'c', 'b (copy)', 'b (copy 2)']), 'b (copy 3)')
})