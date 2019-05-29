var assert = require('assert');
var setUpTestEnvironment = require('./setup');
setUpTestEnvironment();

var JSONEditor = require('../src/js/JSONEditor');
var Node = require('../src/js/Node');

describe('Node', function () {
    var node;
    
    beforeEach(function () {
        var editor = new JSONEditor(document.createElement('foo'));
        node = new Node(editor);
    });

    describe('_findSchema', function () {
        it('should find schema', function () {
            var schema = {
                type: 'object',
                properties: {
                    child: {
                        type: 'string'
                    }
                }
            };
            var path = ['child'];
            assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.child);
        });

        it('should find schema inside an array item', function () {
            var schema = {
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
            };

            assert.strictEqual(Node._findSchema(schema, {}, []), schema);

            assert.strictEqual(Node._findSchema(schema, {}, ['job']), schema.properties.job);

            assert.strictEqual(Node._findSchema(schema, {}, ['job', 0]),
                schema.properties.job.items);

            assert.strictEqual(Node._findSchema(schema, {}, ['job', 0, 'company']),
                schema.properties.job.items.properties.company);
        });

        it('should find schema within multi-level object properties', function () {
            var schema = {
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
            };
            var path = [];
            assert.strictEqual(Node._findSchema(schema, {}, path), schema);
            path = ['levelTwo'];
            assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo);
            path = ['levelTwo', 'levelThree'];
            assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo.properties.levelThree);
            path = ['levelTwo', 'levelThree', 'bool'];
            assert.strictEqual(
                Node._findSchema(schema, {}, path),
                schema.properties.levelTwo.properties.levelThree.properties.bool
            );
        });

        it('should return null for path that has no schema', function () {
            var schema = {
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
            };
            var path = ['bar'];
            assert.strictEqual(Node._findSchema(schema, {}, path), null);
            path = ['foo', 'bar'];
            assert.strictEqual(Node._findSchema(schema, {}, path), null);
        });

        describe('with $ref', function () {
            it('should find a referenced schema', function () {
                var schema = {
                    type: 'object',
                    properties: {
                        foo: {
                            $ref: 'foo'
                        }
                    }
                };
                var fooSchema = {
                    type: 'number',
                    title: 'Foo'
                };
                var path = ['foo'];
                assert.strictEqual(Node._findSchema(schema, {foo: fooSchema}, path), fooSchema);
            });
        });

        describe('with pattern properties', function () {
            it('should find schema', function () {
                var schema = {
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
                };
                var path = [];
                assert.strictEqual(Node._findSchema(schema, {}, path), schema, 'top level');
                path = ['str'];
                assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.str, 'normal property');
            });
    
            it('should find schema within multi-level object properties', function () {
                var schema = {
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
                };
                var path = [];
                assert.strictEqual(Node._findSchema(schema, {}, path), schema, 'top level');
                path = ['levelTwo'];
                assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo, 'level two');
                path = ['levelTwo', 'levelThree'];
                assert.strictEqual(Node._findSchema(schema, {}, path), schema.properties.levelTwo.properties.levelThree, 'level three');
                path = ['levelTwo', 'levelThree', 'bool'];
                assert.strictEqual(
                    Node._findSchema(schema, {}, path),
                    schema.properties.levelTwo.properties.levelThree.properties.bool,
                    'normal property'
                );
            });

            it('should find schema for pattern properties', function () {
                var schema = {
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
                };
                var path = ['foo1'];
                assert.strictEqual(
                    Node._findSchema(schema, {}, path),
                    schema.patternProperties['^foo[0-9]'],
                    'first pattern property'
                );
                path = ['bar5'];
                assert.strictEqual(
                    Node._findSchema(schema, {}, path),
                    schema.patternProperties['^bar[0-9]'],
                    'second pattern property'
                );
            });

            it('should find schema for multi-level pattern properties', function () {
                var schema = {
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
                };
                var path = ['foo1', 'fooChild', 'fooChild2'];
                assert.strictEqual(
                    Node._findSchema(schema, {}, path),
                    schema.patternProperties['^foo[0-9]'].properties.fooChild.properties.fooChild2,
                    'first pattern property child of child'
                );
                path = ['bar5', 'barChild'];
                assert.strictEqual(
                    Node._findSchema(schema, {}, path),
                    schema.patternProperties['^bar[0-9]'].properties.barChild,
                    'second pattern property child'
                );
            });

            it('should return null for path that has no schema', function () {
                var schema = {
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
                };
                var path = ['not-in-schema'];
                assert.strictEqual(Node._findSchema(schema, {}, path), null);
                path = ['levelOne', 'not-in-schema'];
                assert.strictEqual(Node._findSchema(schema, {}, path), null);
            });
        });
    });
});
