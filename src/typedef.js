
/**
 * @typedef {{
 *   type: string,
 *   expanded: boolean?,
 *   menu: boolean?,
 *   props: Array.<{name: string, value: Data}>?
 * }} ObjectData
 *
 * @typedef {{
 *   type: string,
 *   expanded: boolean?,
 *   menu: boolean?,
 *   items: Data[]?
 * }} ArrayData
 *
 * @typedef {{
 *   type: string,
 *   expanded: boolean?,
 *   menu: boolean?,
 *   value: *?
 * }} ValueData
 *
 * @typedef {ObjectData | ArrayData | ValueData} Data
 *
 * @typedef {{
 *   name: string?
 *   expand: function?
 * }} Options
 */