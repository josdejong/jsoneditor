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
 * @typedef {string[]} Path
 *
 * @typedef {{matches: ESONPointer[], active: ESONPointer, text: String}} SearchResult
 *
 */

// FIXME: redefine all ESON related types


/**************************** GENERIC JSON TYPES ******************************/

export type JSONType = | string | number | boolean | null | JSONObjectType | JSONArrayType
export type JSONObjectType = { [key:string]: JSONType }
export type JSONArrayType = JSONType[]


/********************** TYPES FOR THE ESON OBJECT MODEL *************************/

export type SearchResultStatus = 'normal' | 'active'
export type ESONPointerArea = 'value' | 'property'

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
  _meta: {
    type: 'Object',
    path: JSONPath,
    expanded?: boolean,
    selected?: boolean,
    searchProperty?: SearchResultStatus,
    searchValue?: SearchResultStatus
  }
}

export type ESONArray = {
  _meta: {
    type: 'Array',
    path: JSONPath,
    length: number
    expanded?: boolean,
    selected?: boolean,
    searchProperty?: SearchResultStatus,
    searchValue?: SearchResultStatus
  }
}

export type ESONValue = {
  _meta: {
    type: 'value' | 'string',
    path: JSONPath,
    value: null | boolean | string | number,
    selected?: boolean,
    searchProperty?: SearchResultStatus,
    searchValue?: SearchResultStatus
  }
}

export type ESON = ESONObject | ESONArray | ESONValue

export type ESONType = 'Object' | 'Array' | 'value' | 'string'

export type Path = string[]  // TODO: Path must become redundant, replace with JSONPath or ESONPath everywhere
export type JSONPath = string[]
export type ESONPath = string[]

export type ESONPointer = {
  path: JSONPath, // TODO: change path to an ESONPath?
  area?: ESONPointerArea
}

export type Selection = {
  start?: JSONPath,
  end?: JSONPath,
  before?: JSONPath,
  after?: JSONPath
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
  dataPath: string, // TODO: change type to JSONPath
  message: string
}
