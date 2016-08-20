
/**
 * @typedef {{
 *   type: 'array',
 *   expanded: boolean?,
 *   menu: boolean?,
 *   props: Array.<{name: string, value: JSONData}>?
 * }} ObjectData
 *
 * @typedef {{
 *   type: 'object',
 *   expanded: boolean?,
 *   menu: boolean?,
 *   items: JSONData[]?
 * }} ArrayData
 *
 * @typedef {{
 *   type: 'value' | 'string',
 *   expanded: boolean?,
 *   menu: boolean?,
 *   value: *?
 * }} ValueData
 *
 * @typedef {Array.<string | number>} Path
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