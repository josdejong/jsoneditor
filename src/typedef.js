/**
 * @typedef {{
 *   type: 'Array',
 *   expanded: boolean?,
 *   props: Array.<{name: string, value: JSONData}>?
 * }} ObjectData
 *
 * @typedef {{
 *   type: 'Object',
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
 * @typedef {'Object' | 'Array' | 'value' | 'string'} JSONDataType
 *
 * @typedef {Array.<{op: string, path?: string, from?: string, value?: *}>} JSONPatch
 *
 * @typedef {{
 *   patch: JSONPatch,
 *   revert: JSONPatch,
 *   error: null | Error
 * }} JSONPatchResult
 *
 * @typedef {{
 *   mode?: 'code' | 'form' | 'text' | 'tree' | 'view',
 *   modes?: string[],
 *   indentation?: number | string,
 *   onChange?: function (patch: JSONPatch, revert: JSONPatch),
 *   onChangeText?: function (),
 *   onChangeMode?: function (mode: string, prevMode: string),
 *   onError?:  function (err: Error)
 * }} Options
 *
 * @typedef {{
 *   name: string?,
 *   expand: function (path: Path)?
 * }} SetOptions
 */
