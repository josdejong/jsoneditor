import test from 'ava';
import { jsonToData, dataToJson, expand } from '../src/jsonData'


// TODO: test all functions like append, insert, duplicate etc.

const JSON_EXAMPLE = {
  obj: {
    arr: [1,2, {a:3,b:4}]
  },
  str: 'hello world',
  nill: null,
  bool: false
}

const JSON_DATA_EXAMPLE = {
  type: 'object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'object',
                  expanded: true,
                  props: [
                    {
                      name: 'a',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'b',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const JSON_DATA_EXAMPLE_COLLAPSED_1 = {
  type: 'object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'object',
        expanded: true,
        props: [
          {
            name: 'arr',
            value: {
              type: 'array',
              expanded: true,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'object',
                  expanded: false,
                  props: [
                    {
                      name: 'a',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'b',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

const JSON_DATA_EXAMPLE_COLLAPSED_2 = {
  type: 'object',
  expanded: true,
  props: [
    {
      name: 'obj',
      value: {
        type: 'object',
        expanded: false,
        props: [
          {
            name: 'arr',
            value: {
              type: 'array',
              expanded: false,
              items: [
                {
                  type: 'value',
                  value: 1
                },
                {
                  type: 'value',
                  value: 2
                },
                {
                  type: 'object',
                  expanded: false,
                  props: [
                    {
                      name: 'a',
                      value: {
                        type: 'value',
                        value: 3
                      }
                    },
                    {
                      name: 'b',
                      value: {
                        type: 'value',
                        value: 4
                      }
                    }
                  ]
                },
              ]
            }
          }
        ]
      }
    },
    {
      name: 'str',
      value: {
        type: 'value',
        value: 'hello world'
      }
    },
    {
      name: 'nill',
      value: {
        type: 'value',
        value: null
      }
    },
    {
      name: 'bool',
      value: {
        type: 'value',
        value: false
      }
    }
  ]
}

test('jsonToData', t => {
  function expand (path) {
    return true
  }

  t.deepEqual(jsonToData([], JSON_EXAMPLE, expand), JSON_DATA_EXAMPLE)
})

test('dataToJson', t => {
  t.deepEqual(dataToJson(JSON_DATA_EXAMPLE), JSON_EXAMPLE)
})

test('expand a single path', t => {
  const collapsed = expand(JSON_DATA_EXAMPLE, ['obj', 'arr', 2], false)

  t.deepEqual(collapsed, JSON_DATA_EXAMPLE_COLLAPSED_1)
})

test('expand a callback', t => {
  function callback (path) {
    return path.length >= 1
  }
  const expanded = false
  const collapsed = expand(JSON_DATA_EXAMPLE, callback, expanded)

  t.deepEqual(collapsed, JSON_DATA_EXAMPLE_COLLAPSED_2)
})

test('expand a callback should not change the object when nothing happens', t => {
  function callback (path) {
    return false
  }
  const expanded = false
  const collapsed = expand(JSON_DATA_EXAMPLE, callback, expanded)

  t.is(collapsed, JSON_DATA_EXAMPLE)
})



