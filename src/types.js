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

export type JSONType = | string | number | boolean | null | JSONObjectType | JSONArrayType
export type JSONObjectType = { [key:string]: JSONType }
export type JSONArrayType = JSONType[]


/********************** TYPES FOR THE ESON OBJECT MODEL *************************/

export type SearchResultStatus = 'normal' | 'active'
export type ESONPointerType = 'value' | 'property'

export type ESONObjectProperty = {
  id: number,
  name: string,
  value: ESON,
  searchResult?: SearchResultStatus
}

export type ESONArrayItem = {
  id: number,
  value: ESON
}

export type ESONObject = {
  type: 'Object',
  expanded?: boolean,
  props: ESONObjectProperty[]
}

export type ESONArray = {
  type: 'Array',
  expanded?: boolean,
  items: ESONArrayItem[]
}

export type ESONValue = {
  type: 'value' | 'string',
  value?: any,
  searchResult?: SearchResultStatus
}

export type ESON = ESONObject | ESONArray | ESONValue

export type ESONType = 'Object' | 'Array' | 'value' | 'string'

export type Path = string[]  // TODO: Path must become redundant, replace with JSONPath or ESONPath everywhere
export type JSONPath = string[]
export type ESONPath = string[]

export type ESONPointer = {
  path: ESONPath,
  type: ESONPointerType
}

// TODO: ESONPointer.path is an array, JSONSchemaError.path is a string -> make this consistent


// TODO: remove SetOptions, merge into Options (everywhere in the public API)
export type SetOptions = {
  expand?: (path: Path) => boolean
}

export type ESONPatchAction = {
  op: string,     // TODO: define allowed ops
  path: string,
  from?: string,
  value?: any,
  jsoneditor?: ESONPatchOptions
}
export type ESONPatch = ESONPatchAction[]

export type ESONPatchOptions = {
  type: ESONType,
  expand: (Path) => boolean
}

export type ESONPatchResult = {
  patch: ESONPatch,
  revert: ESONPatch,
  error: null | Error
}

export type JSONSchemaError = {
  path: string, // TODO: change type to JSONPath
  message: string
}
