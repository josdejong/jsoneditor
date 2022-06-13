import assert from 'assert'
import { schema, schemaRefs } from './data/schemas'
import { autocompleteJsonStr } from './data/jsons'
import { SchemaTextCompleter } from '../src/js/SchemaTextCompleter'

const sessionMock = {
  getValue: () => autocompleteJsonStr
}

describe('SchemaTextCompleter tests', () => {
  let schemaTextCompleter
  before(() => {
    schemaTextCompleter = new SchemaTextCompleter(schema, schemaRefs)
  })

  it('should initiate and expose getCompletions function', () => {
    assert.strictEqual(typeof schemaTextCompleter.getCompletions, 'function')
  })

  it('should validate completions of single schema ref', (done) => {
    schemaTextCompleter.getCompletions(
      undefined,
      sessionMock,
      { row: 2, column: 18 },
      '',
      (a, completions) => {
        assert.strictEqual(completions.length, 1)
        assert.strictEqual(completions[0].caption, 'John')
        assert.strictEqual(completions[0].meta, 'schema [examples]')
        assert.strictEqual(completions[0].score, 0)
        assert.strictEqual(completions[0].value, 'John')
        done()
      }
    )
  })

  it('should validate completions of triple schema refs', (done) => {
    schemaTextCompleter.getCompletions(
      undefined,
      sessionMock,
      { row: 15, column: 14 },
      '',
      (a, completions) => {
        assert.strictEqual(completions.length, 3)

        assert.strictEqual(completions[0].caption, 'junior')
        assert.strictEqual(completions[0].meta, 'schema [enum]')
        assert.strictEqual(completions[0].score, 0)
        assert.strictEqual(completions[0].value, 'junior')

        assert.strictEqual(completions[1].caption, 'experienced')
        assert.strictEqual(completions[1].meta, 'schema [enum]')
        assert.strictEqual(completions[1].score, 1)
        assert.strictEqual(completions[1].value, 'experienced')

        assert.strictEqual(completions[2].caption, 'senior')
        assert.strictEqual(completions[2].meta, 'schema [enum]')
        assert.strictEqual(completions[2].score, 2)
        assert.strictEqual(completions[2].value, 'senior')

        done()
      }
    )
  })

  it('should validate completions of recursive schema refs', (done) => {
    schemaTextCompleter.getCompletions(
      undefined,
      sessionMock,
      { row: 22, column: 21 },
      '',
      (a, completions) => {
        assert.strictEqual(completions.length, 1)

        assert.strictEqual(completions[0].caption, 'Smith')
        assert.strictEqual(completions[0].meta, 'schema [examples]')
        assert.strictEqual(completions[0].score, 0)
        assert.strictEqual(completions[0].value, 'Smith')

        done()
      }
    )
  })
})
