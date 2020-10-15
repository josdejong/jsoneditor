import assert from 'assert'
import './setup'
import { Node } from '../src/js/Node'

describe('Node', () => {
  describe('_findSchema', () => {
    it('should find schema', () => {
      const schema = {
        type: 'object',
        properties: {
          child: {
            type: 'string'
          }
        }
      }
      const path = ['child']
      assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.child)
    })

    it('should find schema inside an array item', () => {
      const schema = {
        properties: {
          job: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                company: {
                  enum: ['test1', 'test2']
                }
              }
            }
          }
        }
      }

      assert.strictEqual(Node._findSchema(schema, {}, []), schema)

      assert.strictEqual(Node._findSchema(schema, {}, ['job']), schema.properties.job)

      assert.strictEqual(Node._findSchema(schema, {}, ['job', 0]),
        schema.properties.job.items)

      assert.strictEqual(Node._findSchema(schema, {}, ['job', 0, 'company']),
        schema.properties.job.items.properties.company)
    })

    it('should find schema within multi-level object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          levelTwo: {
            type: 'object',
            properties: {
              levelThree: {
                type: 'object',
                properties: {
                  bool: {
                    type: 'boolean'
                  }
                }
              }
            }
          }
        }
      }
      let path = []
      assert.strictEqual(Node._findSchema(schema, {}, path), schema)
      path = ['levelTwo']
      assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo)
      path = ['levelTwo', 'levelThree']
      assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo.properties.levelThree)
      path = ['levelTwo', 'levelThree', 'bool']
      assert.strictEqual(
        Node._findSchema(schema, {}, path),
        schema.properties.levelTwo.properties.levelThree.properties.bool
      )
    })

    it('should return null for path that has no schema', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              baz: {
                type: 'number'
              }
            }
          }
        }
      }
      let path = ['bar']
      assert.strictEqual(Node._findSchema(schema, {}, path), null)
      path = ['foo', 'bar']
      assert.strictEqual(Node._findSchema(schema, {}, path), null)
    })

    describe('with $ref', () => {
      it('should find a referenced schema', () => {
        const schema = {
          type: 'object',
          properties: {
            foo: {
              $ref: 'foo'
            }
          }
        }
        const fooSchema = {
          type: 'number',
          title: 'Foo'
        }
        const path = ['foo']
        assert.strictEqual(Node._findSchema(schema, { foo: fooSchema }, path), fooSchema)
      })
    })

    describe('with pattern properties', () => {
      it('should find schema', () => {
        const schema = {
          type: 'object',
          properties: {
            str: {
              title: 'str',
              type: 'boolean'
            }
          },
          patternProperties: {
            '^foo[0-9]': {
              title: 'foo[0-] pattern property',
              type: 'string'
            }
          }
        }
        let path = []
        assert.strictEqual(Node._findSchema(schema, {}, path), schema, 'top level')
        path = ['str']
        assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.str, 'normal property')
      })

      it('should find schema within multi-level object properties', () => {
        const schema = {
          type: 'object',
          properties: {
            levelTwo: {
              type: 'object',
              properties: {
                levelThree: {
                  type: 'object',
                  properties: {
                    bool: {
                      title: 'bool',
                      type: 'boolean'
                    }
                  }
                }
              }
            }
          },
          patternProperties: {
            '^foo[0-9]': {
              title: 'foo[0-9] pattern property',
              type: 'string'
            }
          }
        }
        let path = []
        assert.strictEqual(Node._findSchema(schema, {}, path), schema, 'top level')
        path = ['levelTwo']
        assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo, 'level two')
        path = ['levelTwo', 'levelThree']
        assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo.properties.levelThree, 'level three')
        path = ['levelTwo', 'levelThree', 'bool']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.properties.levelTwo.properties.levelThree.properties.bool,
          'normal property'
        )
      })

      it('should find schema for pattern properties', () => {
        const schema = {
          type: 'object',
          patternProperties: {
            '^foo[0-9]': {
              title: 'foo[0-9] pattern property',
              type: 'string'
            },
            '^bar[0-9]': {
              title: 'bar[0-9] pattern property',
              type: 'string'
            }
          }
        }
        let path = ['foo1']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.patternProperties['^foo[0-9]'],
          'first pattern property'
        )
        path = ['bar5']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.patternProperties['^bar[0-9]'],
          'second pattern property'
        )
      })

      it('should find schema for multi-level pattern properties', () => {
        const schema = {
          type: 'object',
          patternProperties: {
            '^foo[0-9]': {
              title: 'foo[0-9] pattern property',
              type: 'object',
              properties: {
                fooChild: {
                  type: 'object',
                  properties: {
                    fooChild2: {
                      type: 'string'
                    }
                  }
                }
              }
            },
            '^bar[0-9]': {
              title: 'bar[0-9] pattern property',
              type: 'object',
              properties: {
                barChild: {
                  type: 'string'
                }

              }
            }
          }
        }
        let path = ['foo1', 'fooChild', 'fooChild2']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.patternProperties['^foo[0-9]'].properties.fooChild.properties.fooChild2,
          'first pattern property child of child'
        )
        path = ['bar5', 'barChild']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.patternProperties['^bar[0-9]'].properties.barChild,
          'second pattern property child'
        )
      })

      it('should return null for path that has no schema', () => {
        const schema = {
          type: 'object',
          properties: {
            levelTwo: {
              type: 'object',
              properties: {
                levelThree: {
                  type: 'number'
                }
              }
            }
          },
          patternProperties: {
            '^foo[0-9]': {
              title: 'foo[0-9] pattern property',
              type: 'string'
            },
            '^bar[0-9]': {
              title: 'bar[0-9] pattern property',
              type: 'string'
            }
          }
        }
        let path = ['not-in-schema']
        assert.strictEqual(Node._findSchema(schema, {}, path), null)
        path = ['levelOne', 'not-in-schema']
        assert.strictEqual(Node._findSchema(schema, {}, path), null)
      })
    })
  })
})
