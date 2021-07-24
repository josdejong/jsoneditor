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

    it('should find referenced schema within multi-level object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          aProperty: {
            $ref: 'second_schema#/definitions/some_def'
          }
        }
      }
      const schemaRefs = {
        second_schema: {
          definitions: {
            some_def: {
              type: 'object',
              properties: {
                enumProp: {
                  enum: [1, 2, 3]
                }
              }
            }
          }
        }
      }
      const path = ['aProperty', 'enumProp']
      const expectedSchema = {
        enum: [1, 2, 3]
      }
      assert.deepStrictEqual(Node._findSchema(schema, schemaRefs, path), expectedSchema)
    })

    it('should find array referenced schema within multi-level object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          aProperty: {
            type: 'array',
            items: {
              $ref: 'second_schema#/definitions/some_def'
            }
          }
        }
      }
      const schemaRefs = {
        second_schema: {
          definitions: {
            some_def: {
              type: 'object',
              properties: {
                enumProp: {
                  enum: [1, 2, 3]
                }
              }
            }
          }
        }
      }
      const path = ['aProperty', 0, 'enumProp']
      const expectedSchema = {
        enum: [1, 2, 3]
      }
      assert.deepStrictEqual(Node._findSchema(schema, schemaRefs, path), expectedSchema)
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

    it('should find one of required properties', () => {
      const schema = {
        properties: {
          company: {
            type: 'string',
            enum: ['1', '2']
          },
          worker: {
            type: 'string',
            enum: ['a', 'b']
          },
          manager: {
            type: 'string',
            enum: ['c', 'd']
          }
        },
        additionalProperties: false,
        oneOf: [
          {
            required: ['worker']
          },
          {
            required: ['manager']
          }
        ]
      }
      let path = ['company']
      assert.deepStrictEqual(Node._findSchema(schema, {}, path), {
        type: 'string',
        enum: ['1', '2']
      })
      path = ['worker']
      assert.deepStrictEqual(Node._findSchema(schema, {}, path), {
        type: 'string',
        enum: ['a', 'b']
      })
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

      it('should find a referenced schema property', () => {
        const schema = {
          type: 'object',
          properties: {
            foo: {
              $ref: 'foo'
            }
          }
        }
        const fooSchema = {
          type: 'object',
          properties: {
            levelTwo: {
              type: 'string'
            }
          }
        }
        const path = ['foo', 'levelTwo']
        assert.strictEqual(Node._findSchema(schema, { foo: fooSchema }, path), fooSchema.properties.levelTwo)
      })

      it('should find a referenced schema definition', () => {
        const schema = {
          type: 'object',
          properties: {
            foo: {
              type: 'array',
              items: {
                $ref: 'foo#/definitions/some_def'
              }
            }
          }
        }
        const fooSchema = {
          definitions: {
            some_def: {
              type: 'object',
              properties: {
                propA: {
                  type: 'string'
                },
                propB: {
                  type: 'string'
                }
              }
            }
          }
        }
        const path = ['foo', 0]
        assert.strictEqual(Node._findSchema(schema, { foo: fooSchema }, path), fooSchema.definitions.some_def)
      })

      it('should find a referenced schema definition 2', () => {
        const schema = {
          type: 'object',
          properties: {
            foo: {
              type: 'array',
              items: {
                $ref: 'foo#/definitions/some_def'
              }
            }
          }
        }
        const fooSchema = {
          definitions: {
            some_def: {
              type: 'object',
              properties: {
                propA: {
                  type: 'string'
                },
                propB: {
                  type: 'string'
                }
              }
            }
          }
        }
        const path = ['foo', 0, 'propA']
        assert.strictEqual(Node._findSchema(schema, { foo: fooSchema }, path), fooSchema.definitions.some_def.properties.propA)
      })

      it('should find a referenced schema definition 3', () => {
        const schema = {
          type: 'object',
          properties: {
            foo: {
              type: 'array',
              items: {
                $ref: 'foo#/definitions/some_def'
              }
            }
          }
        }
        const fooSchema = {
          definitions: {
            some_def: {
              type: 'object',
              properties: {
                propA: {
                  type: 'object',
                  properties: {
                    propA1: { type: 'boolean' }
                  }
                },
                propB: { type: 'string' }
              }
            }
          }
        }
        const path = ['foo', 0, 'propA', 'propA1']
        assert.strictEqual(Node._findSchema(schema, { foo: fooSchema }, path), fooSchema.definitions.some_def.properties.propA.properties.propA1)
      })
    })

    describe('with $ref to internal definition', () => {
      it('should find a referenced schema', () => {
        const schema = {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          patternProperties: {
            '^/[a-z0-9]*$': {
              $ref: '#/definitions/component'
            }
          },
          definitions: {
            component: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  minLength: 1
                },
                config: {
                  type: 'object'
                },
                children: {
                  type: 'object',
                  patternProperties: {
                    '^/[a-z0-9]+$': {
                      $ref: '#/definitions/component'
                    }
                  }
                }
              }
            }
          }
        }
        const path = ['/status', 'children', '/bus', 'config']
        const foundSchema = {
          type: 'object'
        }
        assert.notStrictEqual(Node._findSchema(schema, {}, path), foundSchema)
      })
    })

    describe('with $ref to external definition', () => {
      it('should find a referenced schema', () => {
        const schema = {
          type: 'object',
          properties: {
            address: {
              $ref: 'definitions.json#/address'
            }
          }
        }
        const definitions = {
          address: {
            type: 'object',
            properties: {
              country: {
                type: 'string'
              },
              city: {
                type: 'string'
              }
            }
          }
        }
        const path = ['address', 'city']
        const foundSchema = { type: 'string' }
        assert.notStrictEqual(Node._findSchema(schema, { 'definitions.json': definitions }, path), foundSchema)
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

      it('should return additionalProperties schema', () => {
        const schema = {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              enum: ['1', '2']
            },
            nested: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              }
            }
          },
          additionalProperties: {
            type: 'string',
            enum: ['1', '2']
          }
        }
        let path = ['company2']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.additionalProperties,
          'additionalProperties schema'
        )
        path = ['nested', 'virtual']
        assert.strictEqual(
          Node._findSchema(schema, {}, path),
          schema.properties.nested.additionalProperties,
          'additionalProperties schema'
        )
      })
    })
  })
  describe('_findEnum', () => {
    it('should find enum', () => {
      const schema = {
        type: 'object',
        enum: [1, 2, 3]
      }
      assert.strictEqual(Node._findEnum(schema), schema.enum)
    })
  })
})
