/** JSDoc type definitions */

/**
 * @typedef {{} | [] | string | number | boolean | null} JSON
 */

/**
 * @typedef {{
 *   name: string?,
 *   mode: 'code' | 'form' | 'text' | 'tree' | 'view'?,
 *   modes: string[]?,
 *   history: boolean?,
 *   indentation: number | string?,
 *   onChange: function (patch: ESONPatch, revert: ESONPatch)?,
 *   onChangeText: function ()?,
 *   onChangeMode: function (mode: string, prevMode: string)?,
 *   onError:  function (err: Error)?,
 *   isPropertyEditable: function (Path)?
 *   isValueEditable: function (Path)?,
 *   escapeUnicode: boolean?,
 *   expand: function(path: Path) : boolean?,
 *   ajv: Object?,
 *   ace: Object?
 * }} Options
 */

/**
 * @typedef {string[]} Path
 */

/**
 * @typedef {{
 *   start?: Path,
 *   end?: Path,
 *   before?: Path,
 *   after?: Path,
 * }} Selection
 */

/**
 * @typedef {{matches: ESONPointer[], active: ESONPointer, text: String}} SearchResult
 */

/**
 * @typedef {'value' | 'property'} ESONPointerArea
 */

/**
 * @typedef {{
 *   path: Path,
 *   area?: ESONPointerArea
 * }} ESONPointer
 */

/**
 * @typedef {'normal' | 'active'} SearchResultStatus
 */

/**
 * @typedef {'Object' | 'Array' | 'value' | 'string'} ESONType
 */

/**
 * @typedef {{
 *   op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test',
 *   path: string,
 *   from?: string,
 *   value?: *,
 *   meta?: ESONPatchOptions
 * }} ESONPatchAction
 */

/**
 * @typedef {ESONPatchAction[]} ESONPatch
 */

/**
 * @typedef {{
 *   id: string,
 *   path: Path,
 *   type: ESONType,
 *   before?: string
 *   props?: string[],
 *   expanded?: boolean,
 *   selected?: boolean,
 *   searchProperty?: SearchResultStatus,
 *   searchValue?: SearchResultStatus
 * }} ESONPatchOptions
 *
 * // TODO: describe search results and selection
 */

/**
 * @typedef {Object | Array} ESON
 */

/**
 * TODO: change type of dataPath to Path? ESONPointer.path is an array, JSONSchemaError.path is a string -> make this consistent
 *
 * @typedef {{
 *   dataPath: string,
 *   message: string
 * }} JSONSchemaError
 */
