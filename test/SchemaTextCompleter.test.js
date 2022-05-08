import assert from 'assert'
import { schema, schemaRefs } from './data/schemas'
import { SchemaTextCompleter } from '../src/js/SchemaTextCompleter'

describe('SchemaTextCompleter', () => {
  it('should initiate and expose getCompletions function', () => {
    const schemaTextCompleter = new SchemaTextCompleter(schema, schemaRefs);
    assert.strictEqual(typeof schemaTextCompleter.getCompletions, 'function');
  })
})
