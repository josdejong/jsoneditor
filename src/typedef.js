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
 * @typedef {Array.<{op: string, path?: string, from?: string, value?: *}>} JSONPatch
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
