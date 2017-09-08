// @flow

/**
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
 */


/**************************** GENERIC JSON TYPES ******************************/

export type JSONType = | string | number | boolean | null | JSONObjectType | JSONArrayType;
export type JSONObjectType = { [key:string]: JSONType };
export type JSONArrayType = Array<JSONType>;


/********************** TYPES FOR THE JSON DATA MODEL *************************/

export type SearchResultStatus = 'normal' | 'active'
export type DataPointerType = 'value' | 'property'

export type PropertyData = {
  id: number,
  name: string,
  value: JSONData,
  searchResult?: SearchResultStatus
}

export type ItemData = {
  id: number,
  value: JSONData
}

export type ObjectData = {
  type: 'Object',
  expanded?: boolean,
  props: PropertyData[]
}

export type ArrayData = {
  type: 'Array',
  expanded?: boolean,
  items: ItemData[]
}

export type ValueData = {
  type: 'value' | 'string',
  value?: any,
  searchResult?: SearchResultStatus
}

export type JSONData = ObjectData | ArrayData | ValueData

export type JSONDataType = 'Object' | 'Array' | 'value' | 'string'



export type Path = string[]

export type DataPointer = {
  path: Path,
  type: DataPointerType
}
// TODO: DataPointer.dataPath is an array, JSONSchemaError.dataPath is a string -> make this consistent


// TODO: remove SetOptions, merge into Options (everywhere in the public API)
export type SetOptions = {
  expand?: (path: Path) => boolean
}

export type JSONPatchAction = {
  op: string,     // TODO: define allowed ops
  path: string,
  from?: string,
  value?: any,
  jsoneditor?: PatchOptions
}
export type JSONPatch = JSONPatchAction[]

export type PatchOptions = {
  type: JSONDataType,
  expand: (Path) => boolean
}

export type JSONPatchResult = {
  patch: JSONPatch,
  revert: JSONPatch,
  error: null | Error
}

export type JSONSchemaError = {
  dataPath: string,
  message: string
}
