// @flow

/**
 *
 * @typedef {'Object' | 'Array' | 'value' | 'string'} JSONDataType
 *
 * @typedef {{
 *   patch: JSONPatch,
 *   revert: JSONPatch,
 *   error: null | Error
 * }} JSONPatchResult
 *
 * @typedef {{
 *   dataPath: string,
 *   message: string
 * }} JSONSchemaError
 *
 * @typedef {{
 *   name: string?,
 *   mode: 'code' | 'form' | 'text' | 'tree' | 'view'?,
 *   modes: string[]?,
 *   history: boolean?,
 *   indentation: number | string?,
 *   onChange: function (patch: JSONPatch, revert: JSONPatch)?,
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
 *
 * @typedef {{
 *   expand: function (path: Path)?
 * }} PatchOptions
 *
 */


/**************************** GENERIC JSON TYPES ******************************/

export type JSONType = | string | number | boolean | null | JSONObjectType | JSONArrayType;
export type JSONObjectType = { [key:string]: JSONType };
export type JSONArrayType = Array<JSONType>;


/********************** TYPES FOR THE JSON DATA MODEL *************************/

export type SearchResultStatus = 'normal' | 'active'
export type DataPointerType = 'value' | 'property'

export type PropertyData = {
  name: string,
  value: JSONData,
  searchResult: ?SearchResultStatus
}

export type ObjectData = {
  type: 'Object',
  expanded: ?boolean,
  props: PropertyData[]
}

export type ArrayData = {
  type: 'Array',
  expanded: ?boolean,
  items: ?JSONData[]
}

export type ValueData = {
  type: 'value' | 'string',
  value: ?any,
  searchResult: ?SearchResultStatus
}

export type JSONData = ObjectData | ArrayData | ValueData



export type Path = string[]

export type DataPointer = {
  dataPath: Path,
  type: DataPointerType
}
// TODO: DataPointer.dataPath is an array, JSONSchemaError.dataPath is a string -> make this consistent


// TODO: remove SetOptions, merge into Options (everywhere in the public API)
export type SetOptions = {
  expand?: (path: Path) => boolean
}

export type JSONPatchAction = {
  op: string,     // TODO: define allowed ops
  path?: string,
  from?: string,
  value?: any
}
export type JSONPatch = JSONPatchAction[]
