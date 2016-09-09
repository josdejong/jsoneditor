// TODO: rename type 'array' to 'Array' and 'object' to 'Object'
/**
 * @typedef {{
 *   type: 'array',
 *   expanded: boolean?,
 *   props: Array.<{name: string, value: JSONData}>?
 * }} ObjectData
 *
 * @typedef {{
 *   type: 'object',
 *   expanded: boolean?,
 *   items: JSONData[]?
 * }} ArrayData
 *
 * @typedef {{
 *   type: 'value' | 'string',
 *   value: *?
 * }} ValueData
 *
 * @typedef {Array.<string>} Path
 *
 * @typedef {ObjectData | ArrayData | ValueData} JSONData
 *
 * @typedef {'object' | 'array' | 'value' | 'string'} JSONDataType
 *
 * @typedef {{
 *
 * }} Options
 *
 * @typedef {{
 *   name: string?,
 *   expand: function (path: Path)?
 * }} SetOptions
 */

var ans = {
  "type": "object",
  "expanded": true,
  "props": [
    {
      "name": "obj",
      "value": {
        "type": "object",
        "expanded": true,
        "props": [
          {
            "name": "arr",
            "value": {
              "type": "array",
              "expanded": true,
              "items": [
                {
                  "type": "value",
                  "value": 1
                },
                {
                  "type": "value",
                  "value": 2
                },
                {
                  "type": "object",
                  "expanded": true,
                  "props": [
                    {
                      "name": "a",
                      "value": {
                        "type": "value",
                        "value": 3
                      }
                    },
                    {
                      "name": "b",
                      "value": {
                        "type": "value",
                        "value": 4
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "str",
      "value": {
        "type": "value",
        "value": "hello world"
      }
    },
    {
      "name": "nill",
      "value": {
        "type": "value",
        "value": null
      }
    },
    {
      "name": "bool",
      "value": {
        "type": "value",
        "value": false
      }
    }
  ]
}
