// @flow

/**
 *
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

export type ESONObject = {
  _meta: {
    type: 'Object',
    path: Path,
    expanded?: boolean,
    selected?: boolean,
    searchProperty?: SearchResultStatus,
    searchValue?: SearchResultStatus
  }
}

export type ESONArray = {
  _meta: {
    type: 'Array',
    path: Path,
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
    path: Path,
    value: null | boolean | string | number,
    selected?: boolean,
    searchProperty?: SearchResultStatus,
    searchValue?: SearchResultStatus
  }
}

export type ESON = ESONObject | ESONArray | ESONValue

export type ESONType = 'Object' | 'Array' | 'value' | 'string'

export type Path = string[]

export type ESONPointer = {
  path: Path,
  area?: ESONPointerArea
}

export type Selection = {
  start?: Path,
  end?: Path,
  before?: Path,
  after?: Path
}

export type ESONPatchAction = {
  op: string,     // TODO: define allowed ops
  path: string,
  from?: string,
  value?: any,
  meta?: ESONPatchOptions
}
export type ESONPatch = ESONPatchAction[]

export type ESONPatchOptions = {
  type: ESONType,
  expand: (Path) => boolean
}

// TODO: ESONPointer.path is an array, JSONSchemaError.path is a string -> make this consistent
export type JSONSchemaError = {
  dataPath: string, // TODO: change type to Path
  message: string
}
