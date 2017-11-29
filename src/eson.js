// @flow weak

/**
 * This file contains functions to act on a ESON object.
 * All functions are pure and don't mutate the ESON.
 */

import { setIn, getIn, updateIn, deleteIn, transform } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import isEqual from 'lodash/isEqual'
import times from 'lodash/times'
import initial from 'lodash/initial'
import last from 'lodash/last'

import type {
  ESON, ESONObject, ESONArrayItem, ESONPointer, Selection, ESONType, ESONPath,
  Path,
  JSONPath, JSONType
} from './types'

type RecurseCallback = (value: ESON, path: Path, root: ESON) => ESON

export const SELECTED = 1
export const SELECTED_END = 2
export const SELECTED_BEFORE = 3
export const SELECTED_AFTER = 4

/**
 *
 * @param {JSONType} json
 * @param {JSONPath} path
 * @return {ESON}
 */
// TODO: rename to jsonToEson after refactoring of ESON is finished
export function toEson2 (json, path = []) {
  const id = createId()

  if (isObject(json)) {
    let eson = {}
    const keys = Object.keys(json)
    keys.forEach((key) => eson[key] = toEson2(json[key], path.concat(key)))
    eson._meta = { id, path, type: 'Object', keys }
    return eson
  }
  else if (Array.isArray(json)) {
    let eson = {}
    json.forEach((value, index) => eson[index] = toEson2(value, path.concat(index)))
    eson._meta = { id, path, type: 'Array', length: json.length }
    return eson
  }
  else { // json is a number, string, boolean, or null
    return {
      _meta: { id, path, type: 'value', value: json }
    }
  }
}

/**
 * Map over an eson array
 * @param {ESONArray} esonArray
 * @param {function (value, index, array)} callback
 * @return {Array}
 */
export function mapEsonArray (esonArray, callback) {
  const length = esonArray._meta.length
  let result = []
  for (let i = 0; i < length; i++) {
    result[i] = callback(esonArray[i], i, esonArray)
  }
  return result
}

/**
 * Expand function which will expand all nodes
 * @param {Path} path
 * @return {boolean}
 */
export function expandAll (path) {
  return true
}

/**
 * Convert a JSON object into ESON
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: JSONPath)} [expand]
 * @param {JSONPath} [path=[]]
 * @param {ESONType} [type='value']  Optional eson type for the created value
 * @return {ESON}
 */
export function jsonToEson (json, expand = expandAll, path: JSONPath = [], type: ESONType = 'value') : ESON {
  if (Array.isArray(json)) {
    return {
      type: 'Array',
      expanded: expand(path),
      items: json.map((child, index) => {
        return {
          id: createId(), // TODO: use id based on index (only has to be unique within this array)
          value: jsonToEson(child, expand, path.concat(index))
        }
      })
    }
  }
  else if (isObject(json)) {
    return {
      type: 'Object',
      expanded: expand(path),
      props: Object.keys(json).map((name, index) => {
        return {
          id: createId(), // TODO: use id based on index (only has to be unique within this array)
          name,
          value: jsonToEson(json[name], expand, path.concat(name))
        }
      })
    }
  }
  else { // value
    return {
      type: (type === 'string') ? 'string' : 'value',
      value: json
    }
  }
}

/**
 * Convert an ESON object to a JSON object
 * @param {ESON} eson
 * @return {Object | Array | string | number | boolean | null} json
 */
export function esonToJson (eson: ESON) {
  switch (eson.type) {
    case 'Array':
      return eson.items.map(item => esonToJson(item.value))

    case 'Object':
      const object = {}

      eson.props.forEach(prop => {
        object[prop.name] = esonToJson(prop.value)
      })

      return object

    default: // type 'string' or 'value'
      return eson.value
  }
}

/**
 * Convert a path of a JSON object into a path in the corresponding ESON object
 * @param {ESON} eson
 * @param {JSONPath} path
 * @return {ESONPath} esonPath
 * @private
 */
export function toEsonPath (eson: ESON, path: JSONPath) : ESONPath {
  if (path.length === 0) {
    return []
  }

  if (eson.type === 'Array') {
    // index of an array
    const index = path[0]
    const item = eson.items[parseInt(index)]
    if (!item) {
      throw new Error('Array item "' + index + '" not found')
    }

    return ['items', String(index), 'value'].concat(toEsonPath(item.value, path.slice(1)))
  }
  else if (eson.type === 'Object') {
    // object property. find the index of this property
    const index = findPropertyIndex(eson, path[0])
    const prop = eson.props[index]
    if (!prop) {
      throw new Error('Object property "' + path[0] + '" not found')
    }

    return ['props', String(index), 'value']
        .concat(toEsonPath(prop.value, path.slice(1)))
  }
  else {
    return []
  }
}

/**
 * Convert an ESON object to a JSON object
 * @param {ESON} eson
 * @param {ESONPath} esonPath
 * @return {JSONPath} path
 */
export function toJsonPath (eson: ESON, esonPath: ESONPath) : JSONPath {
  if (esonPath.length === 0) {
    return []
  }

  if (eson.type === 'Array') {
    // index of an array
    const index = esonPath[1]
    const item = eson.items[parseInt(index)]
    if (!item) {
      throw new Error('Array item "' + index + '" not found')
    }

    return [index].concat(toJsonPath(item.value, esonPath.slice(3)))
  }
  else if (eson.type === 'Object') {
    // object property. find the index of this property
    const index = esonPath[1]
    const prop = eson.props[parseInt(index)]
    if (!prop) {
      throw new Error('Object property "' + esonPath[1] + '" not found')
    }

    return [prop.name].concat(toJsonPath(prop.value, esonPath.slice(3)))
  }
  else {
    return []
  }
}

/**
 * Get a nested property from an ESON object using a JSON path
 */
export function getInEson (eson: ESON, jsonPath: JSONPath) {
  return getIn(eson, toEsonPath(eson, jsonPath))
}

/**
 * Set the value of a nested property in an ESON object using a JSON path
 */
export function setInEson (eson: ESON, jsonPath: JSONPath, value: JSONType) {
  return setIn(eson, toEsonPath(eson, jsonPath), value)
}

/**
 * Set the value of a nested property in an ESON object using a JSON path
 */
export function updateInEson (eson: ESON, jsonPath: JSONPath, callback) {
  return updateIn(eson, toEsonPath(eson, jsonPath), callback)
}

/**
 * Set the value of a nested property in an ESON object using a JSON path
 */
export function deleteInEson (eson: ESON, jsonPath: JSONPath) : JSONType {
  // with initial we remove the 'value' property,
  // we want to remove the whole item from the items array
  return deleteIn(eson, initial(toEsonPath(eson, jsonPath)))
}

/**
 * Expand or collapse one or multiple items or properties
 * @param {ESON} eson
 * @param {function(Path) : boolean | Path} filterCallback
 *              When a path, the object/array at this path will be expanded/collapsed
 *              When a function, all objects and arrays for which callback
 *              returns true will be expanded/collapsed
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {ESON}
 */
export function expand (eson, filterCallback, expanded = true) {
  // console.log('expand', callback, expand)

  if (typeof filterCallback === 'function') {
    return transform(eson, function (value, path) {
      return (value && value._meta && (value._meta.type === 'Array' || value._meta.type === 'Object') && filterCallback(path))
          ? setIn(value, ['_meta', 'expanded'], expanded)
          : value
    })
  }
  else if (Array.isArray(filterCallback)) {
    return setIn(eson, filterCallback.concat(['_meta', 'expanded']), expanded)
  }
  else {
    throw new Error('Callback function or path expected')
  }
}

/**
 * Expand all Objects and Arrays on a path
 */
export function expandPath (eson: ESON, path?: JSONPath) : ESON {
  let updatedEson = eson

  if (path) {
    updatedEson = expand(updatedEson, [], true) // expand root

    for (let i = 0; i < path.length; i++) {
      const pathPart = path.slice(0, i + 1)
      updatedEson = expand(updatedEson, pathPart, true)
    }
  }

  return updatedEson
}

/**
 * Merge one or multiple errors (for example JSON schema errors) into the ESON object
 *
 * @param {ESON} eson
 * @param {JSONSchemaError[]} errors
 */
export function addErrors (eson: ESON, errors) {
  let updatedEson = eson

  if (errors) {
    errors.forEach(error => {
      const esonPath = toEsonPath(eson, parseJSONPointer(error.dataPath))
      // TODO: do we want to be able to store multiple errors per item?
      updatedEson = setIn(updatedEson, esonPath.concat('error'), error)
    })
  }

  return updatedEson
}

/**
 * Search some text in all properties and values
 */
export function search (eson: ESON, text: string): ESONPointer[] {
  let results: ESONPointer[] = []

  if (text !== '') {
    traverse(eson, function (value, path: JSONPath) {
      // check property name
      if (path.length > 0) {
        const prop = last(path)
        if (containsCaseInsensitive(prop, text)) {
          // only add search result when this is an object property name,
          // don't add search result for array indices
          const parentPath = initial(path)
          const parent = getInEson(eson, parentPath)
          if (parent.type === 'Object') {
            results.push({path, area: 'property'})
          }
        }
      }

      // check value
      if (value.type === 'value') {
        if (containsCaseInsensitive(value.value, text)) {
          results.push({path, area: 'value'})
        }
      }
    })
  }

  return results
}

/**
 * Find the next search result given a current search result
 * - When the current search result is the last one, the search will wrap around
 *   and return the first result as next.
 * - When current search result is not found, the first search result will be
 *   returned as next
 * - When `searchResults` is empty, null will be returned
 */
export function nextSearchResult (searchResults: ESONPointer[], current: ESONPointer): ESONPointer | null {
  if (searchResults.length === 0) {
    return null
  }

  const index = searchResults.findIndex(searchResult => isEqual(searchResult, current))
  if (index !== -1) {
    return index < searchResults.length - 1
        ? searchResults[index + 1]
        : searchResults[0]
  }
  else {
    return searchResults[0]
  }
}

/**
 * Find the previous search result given a current search result
 * - When the current search result is the first one, the search will wrap around
 *   and return the last result as next.
 * - When current search result is not found, the last search result will be
 *   returned as next
 * - When `searchResults` is empty, null will be returned
 */
export function previousSearchResult (searchResults: ESONPointer[], current: ESONPointer): ESONPointer | null {
  if (searchResults.length === 0) {
    return null
  }

  const index = searchResults.findIndex(searchResult => isEqual(searchResult, current))
  if (index !== -1) {
    return index > 0
        ? searchResults[index - 1]
        : last(searchResults)
  }
  else {
    return searchResults[0]
  }
}

/**
 * Merge searchResults into the eson object
 */
export function applySearchResults (eson: ESON, searchResults: ESONPointer[], activeSearchResult: ESONPointer) {
  let updatedEson = eson

  searchResults.forEach(function (searchResult) {
    if (searchResult.area === 'value') {
      const esonPath = toEsonPath(updatedEson, searchResult.path).concat('searchResult')
      const value = isEqual(searchResult, activeSearchResult) ? 'active' : 'normal'
      updatedEson = setIn(updatedEson, esonPath, value)
    }

    if (searchResult.area === 'property') {
      const esonPath = toEsonPath(updatedEson, searchResult.path)
      const propertyPath = initial(esonPath).concat('searchResult')
      const value = isEqual(searchResult, activeSearchResult) ? 'active' : 'normal'
      updatedEson = setIn(updatedEson, propertyPath, value)
    }
  })

  return updatedEson
}

/**
 * Merge searchResults into the eson object
 */
export function applySelection (eson: ESON, selection: Selection) {
  if (!selection) {
    return eson
  }

  if (selection.before) {
    const esonPath = toEsonPath(eson, selection.before)
    return setIn(eson, esonPath.concat('selected'), SELECTED_BEFORE)
  }
  else if (selection.after) {
    const esonPath = toEsonPath(eson, selection.after)
    return setIn(eson, esonPath.concat('selected'), SELECTED_AFTER)
  }
  else { // selection.start and selection.end
    // find the parent node shared by both start and end of the selection
    const rootPath = findRootPath(selection)

    return updateInEson(eson, rootPath, (root) => {
      const { minIndex, maxIndex } = findSelectionIndices(root, rootPath, selection)

      const childsKey = (root.type === 'Object') ? 'props' : 'items' // property name of the array with props/items
      const childsBefore = root[childsKey].slice(0, minIndex)
      const childsUpdated = root[childsKey].slice(minIndex, maxIndex)
          .map((child, index) => setIn(child, ['value', 'selected'], index === 0 ? SELECTED_END : SELECTED))
      const childsAfter = root[childsKey].slice(maxIndex)
      // FIXME: actually mark the end index as SELECTED_END, currently we select the first index

      return setIn(root, [childsKey], childsBefore.concat(childsUpdated, childsAfter))
    })
  }
}

/**
 * Find the min and max index of a start and end child.
 * Start and end can be a property name in case of an Object,
 * or a matrix index (string with a number) in case of an Array.
 */
export function findSelectionIndices (root: ESON, rootPath: JSONPath, selection: Selection) : { minIndex: number, maxIndex: number } {
  const start = (selection.after || selection.before || selection.start)[rootPath.length]
  const end = (selection.after || selection.before || selection.end)[rootPath.length]

  // if no object we assume it's an Array
  const startIndex = root.type === 'Object' ? findPropertyIndex(root, start) : parseInt(start)
  const endIndex   = root.type === 'Object' ? findPropertyIndex(root, end)   : parseInt(end)

  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex) +
      ((selection.after || selection.before) ? 0 : 1) // include max index itself

  return { minIndex, maxIndex }
}

/**
 * Get the JSON paths from a selection, sorted from first to last
 */
export function pathsFromSelection (eson: ESON, selection: Selection): JSONPath[] {
  // find the parent node shared by both start and end of the selection
  const rootPath = findRootPath(selection)
  const root = getInEson(eson, rootPath)

  const { minIndex, maxIndex } = findSelectionIndices(root, rootPath, selection)

  if (root.type === 'Object') {
    return times(maxIndex - minIndex, i => rootPath.concat(root.props[i + minIndex].name))
  }
  else { // root.type === 'Array'
    return times(maxIndex - minIndex, i => rootPath.concat(String(i + minIndex)))
  }
}

/**
 * Get the contents of a list with paths
 * @param {ESON} data
 * @param {JSONPath[]} paths
 * @return {Array.<{name: string, value: JSONType}>}
 */
export function contentsFromPaths (data: ESON, paths: JSONPath[]) {
  return paths.map(path => {
    const esonPath = toEsonPath(data, path)
    return {
      name: getIn(data, initial(esonPath).concat('name')) || String(esonPath[esonPath.length - 2]),
      value: esonToJson(getIn(data, esonPath))
      // FIXME: also store the type and expanded state
    }
  })
}

/**
 * Find the root path of a selection: the parent node shared by both start
 * and end of the selection
 * @param {Selection} selection
 * @return {JSONPath}
 */
export function findRootPath(selection) {
  if (selection.before) {
    return initial(selection.before)
  }
  else if (selection.after) {
    return initial(selection.after)
  }
  else { // .start and .end
    const sharedPath = findSharedPath(selection.start, selection.end)

    if (sharedPath.length === selection.start.length &&
        sharedPath.length === selection.end.length) {
      // there is just one node selected, return it's parent
      return initial(sharedPath)
    }
    else {
      return sharedPath
    }
  }
}

/**
 * Find the common path of two paths.
 * For example findCommonRoot(['arr', '1', 'name'], ['arr', '1', 'address', 'contact']) returns ['arr', '1']
 */
function findSharedPath (path1: JSONPath, path2: JSONPath): JSONPath {
  let i = 0;
  while (i < path1.length && path1[i] === path2[i]) {
    i++;
  }

  return path1.slice(0, i)
}
//
// /**
//  * Recursively transform ESON: a recursive "map" function
//  * @param {ESON} eson
//  * @param {function(value: ESON, path: Path, root: ESON)} callback
//  * @return {ESON} Returns the transformed eson object
//  */
// export function transform (eson: ESON, callback: RecurseCallback) : ESON {
//   return recurseTransform (eson, [], eson, callback)
// }
//
// /**
//  * Recursively transform ESON
//  * @param {ESON} value
//  * @param {JSONPath} path
//  * @param {ESON} root    The root object, object at path=[]
//  * @param {function(value: ESON, path: Path, root: ESON)} callback
//  * @return {ESON} Returns the transformed eson object
//  */
// function recurseTransform (value: ESON, path: JSONPath, root: ESON, callback: RecurseCallback) : ESON {
//   let updatedValue: ESON = callback(value, path, root)
//
//   if (value.type === 'Array') {
//     let updatedItems = updatedValue.items
//
//     updatedValue.items.forEach((item, index) => {
//       const updatedItem = recurseTransform(item.value, path.concat(String(index)), root, callback)
//       updatedItems = setIn(updatedItems, [index, 'value'], updatedItem)
//     })
//
//     updatedValue = setIn(updatedValue, ['items'], updatedItems)
//   }
//
//   if (value.type === 'Object') {
//     let updatedProps = updatedValue.props
//
//     updatedValue.props.forEach((prop, index) => {
//       const updatedItem = recurseTransform(prop.value, path.concat(prop.name), root, callback)
//       updatedProps = setIn(updatedProps, [index, 'value'], updatedItem)
//     })
//
//     updatedValue = setIn(updatedValue, ['props'], updatedProps)
//   }
//
//   // (for type 'string' or 'value' there are no childs to traverse)
//
//   return updatedValue
// }

/**
 * Recursively loop over a ESON object: a recursive "forEach" function.
 * @param {ESON} eson
 * @param {function(value: ESON, path: JSONPath, root: ESON)} callback
 */
export function traverse (eson: ESON, callback: RecurseCallback) {
  return recurseTraverse (eson, [], eson, callback)
}

/**
 * Recursively traverse a ESON object
 * @param {ESON} value
 * @param {JSONPath} path
 * @param {ESON | null} root    The root object, object at path=[]
 * @param {function(value: ESON, path: Path, root: ESON)} callback
 */
function recurseTraverse (value: ESON, path: JSONPath, root: ESON, callback: RecurseCallback) {
  callback(value, path, root)

  switch (value.type) {
    case 'Array': {
      value.items.forEach((item: ESONArrayItem, index) => {
        recurseTraverse(item.value, path.concat(String(index)), root, callback)
      })
      break
    }

    case 'Object': {
      value.props.forEach((prop) => {
        recurseTraverse(prop.value, path.concat(prop.name), root, callback)
      })
      break
    }

    default: // type 'string' or 'value'
      // no childs to traverse
  }
}

/**
 * Test whether a path exists in the eson object
 * @param {ESON} eson
 * @param {JSONPath} path
 * @return {boolean} Returns true if the path exists, else returns false
 * @private
 */
export function pathExists (eson: ESON, path: JSONPath) {
  if (eson === undefined) {
    return false
  }

  if (path.length === 0) {
    return true
  }

  if (eson.type === 'Array') {
    // index of an array
    const index = path[0]
    const item = eson.items[parseInt(index)]

    return pathExists(item && item.value, path.slice(1))
  }
  else { // eson.type === 'Object'
    // object property. find the index of this property
    const index = findPropertyIndex(eson, path[0])
    const prop = eson.props[index]

    return pathExists(prop && prop.value, path.slice(1))
  }
}

/**
 * Resolve the index for `arr/-`, replace it with an index value equal to the
 * length of the array
 * @param {ESON} eson
 * @param {Path} path
 * @return {Path}
 */
export function resolvePathIndex (eson, path) {
  if (path[path.length - 1] === '-') {
    const parentPath = path.slice(0, path.length - 1)
    const parent = getInEson(eson, parentPath)

    if (parent.type === 'Array') {
      const index = parent.items.length
      const resolvedPath = path.slice(0)
      resolvedPath[resolvedPath.length - 1] = index

      return resolvedPath
    }
  }

  return path
}

/**
 * Find the property after provided property
 * @param {ESON} parent
 * @param {string} prop
 * @return {string | null} Returns the name of the next property,
 *                         or null if there is none
 */
export function findNextProp (parent: ESONObject, prop: string) : string | null {
  const index = findPropertyIndex(parent, prop)
  if (index === -1) {
    return null
  }

  const next = parent.props[index + 1]
  return next && next.name || null
}

/**
 * Find the index of a property
 * @param {ESONObject} object
 * @param {string} prop
 * @return {number}  Returns the index when found, -1 when not found
 */
export function findPropertyIndex (object: ESONObject, prop: string) {
  return object.props.findIndex(p => p.name === prop)
}

// TODO: move parseJSONPointer and compileJSONPointer to a separate file

/**
 * Parse a JSON Pointer
 * WARNING: this is not a complete implementation
 * @param {string} pointer
 * @return {Array}
 */
export function parseJSONPointer (pointer: string) {
  const path = pointer.split('/')
  path.shift() // remove the first empty entry

  return path.map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'))
}

/**
 * Compile a JSON Pointer
 * WARNING: this is not a complete implementation
 * @param {Path} path
 * @return {string}
 */
export function compileJSONPointer (path: Path) {
  return path
      .map(p => '/' + String(p).replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('')
}

// TODO: move createId to a separate file

/**
 * Do a case insensitive search for a search text in a text
 * @param {String} text
 * @param {String} search
 * @return {boolean} Returns true if `search` is found in `text`
 */
export function containsCaseInsensitive (text: string, search: string): boolean {
  return String(text).toLowerCase().indexOf(search.toLowerCase()) !== -1
}

/**
 * Get a new "unique" id. Id's are created from an incremental counter.
 * @return {number}
 */
export function createId () : number {
  _id++
  return _id
}
let _id = 0
