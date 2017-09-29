// @flow weak

/**
 * This file contains functions to act on a ESON object.
 * All functions are pure and don't mutate the ESON.
 */

import { setIn, getIn, updateIn } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import isEqual from 'lodash/isEqual'
import times from 'lodash/times'
import initial from 'lodash/initial'
import last from 'lodash/last'

import type {
  ESON, ESONObject, ESONArrayItem, ESONPointer, ESONSelection, ESONType, ESONPath,
  Path,
  JSONPath, JSONType
} from './types'

type RecurseCallback = (value: ESON, path: Path, root: ESON) => ESON

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
          id: getId(), // TODO: use id based on index (only has to be unique within this array)
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
          id: getId(), // TODO: use id based on index (only has to be unique within this array)
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

type ExpandCallback = (Path) => boolean

/**
 * Expand or collapse one or multiple items or properties
 * @param {ESON} eson
 * @param {function(path: Path) : boolean | Path} callback
 *              When a path, the object/array at this path will be expanded/collapsed
 *              When a function, all objects and arrays for which callback
 *              returns true will be expanded/collapsed
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {ESON}
 */
export function expand (eson: ESON, callback: Path | (Path) => boolean, expanded: boolean = true) {
  // console.log('expand', callback, expand)

  if (typeof callback === 'function') {
    return transform(eson, function (value: ESON, path: Path, root: ESON) : ESON {
      if (value.type === 'Array' || value.type === 'Object') {
        if (callback(path)) {
          return setIn(value, ['expanded'], expanded)
        }
      }

      return value
    })
  }
  else if (Array.isArray(callback)) {
    const esonPath: Path = toEsonPath(eson, callback)

    return setIn(eson, esonPath.concat(['expanded']), expanded)
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
          const parent = getIn(eson, toEsonPath(eson, parentPath))
          if (parent.type === 'Object') {
            results.push({path, field: 'property'})
          }
        }
      }

      // check value
      if (value.type === 'value') {
        if (containsCaseInsensitive(value.value, text)) {
          results.push({path, field: 'value'})
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
    if (searchResult.field === 'value') {
      const esonPath = toEsonPath(updatedEson, searchResult.path).concat('searchResult')
      const value = isEqual(searchResult, activeSearchResult) ? 'active' : 'normal'
      updatedEson = setIn(updatedEson, esonPath, value)
    }

    if (searchResult.field === 'property') {
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
export function applySelection (eson: ESON, selection: ESONSelection) {
  if (!selection || !selection.start || !selection.end) {
    return eson
  }

  // find the parent node shared by both start and end of the selection
  const rootPath = findSharedPath(selection.start.path, selection.end.path)
  const rootEsonPath = toEsonPath(eson, rootPath)

  if (rootPath.length === selection.start.path.length || rootPath.length === selection.end.path.length) {
    // select a single node
    return setIn(eson, rootEsonPath.concat(['selected']), true)
  }
  else {
    // select multiple childs of an object or array
    return updateIn(eson, rootEsonPath, (root) => {
      const start = selection.start.path[rootPath.length]
      const end = selection.end.path[rootPath.length]
      const { minIndex, maxIndex } = findSelectionIndices(root, start, end)

      const childsKey = (root.type === 'Object') ? 'props' : 'items' // property name of the array with props/items
      const childsBefore = root[childsKey].slice(0, minIndex)
      const childsUpdated = root[childsKey].slice(minIndex, maxIndex)
          .map(child => setIn(child, ['value', 'selected'], true))
      const childsAfter = root[childsKey].slice(maxIndex)

      return setIn(root, [childsKey], childsBefore.concat(childsUpdated, childsAfter))
    })
  }
}

/**
 * Find the min and max index of a start and end child.
 * Start and end can be a property name in case of an Object,
 * or a matrix index (string with a number) in case of an Array.
 */
export function findSelectionIndices (root: ESON, start: string, end: string) : { minIndex: number, maxIndex: number } {
  // if no object we assume it's an Array
  const startIndex = root.type === 'Object' ? findPropertyIndex(root, start) : parseInt(start)
  const endIndex   = root.type === 'Object' ? findPropertyIndex(root, end)   : parseInt(end)

  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex) + 1 // include max index itself

  return { minIndex, maxIndex }
}

/**
 * Get the JSON paths from a selection, sorted from first to last
 */
export function pathsFromSelection (eson: ESON, selection: ESONSelection): JSONPath[] {
  // find the parent node shared by both start and end of the selection
  const rootPath = findSharedPath(selection.start.path, selection.end.path)
  const rootEsonPath = toEsonPath(eson, rootPath)

  if (rootPath.length === selection.start.path.length || rootPath.length === selection.end.path.length) {
    // select a single node
    return [ rootPath ]
  }
  else {
    // select multiple childs of an object or array
    const root = getIn(eson, rootEsonPath)
    const start = selection.start.path[rootPath.length]
    const end = selection.end.path[rootPath.length]
    const { minIndex, maxIndex } = findSelectionIndices(root, start, end)

    if (root.type === 'Object') {
      return times(maxIndex - minIndex, i => rootPath.concat(root.props[i + minIndex].name))
    }
    else { // root.type === 'Array'
      return times(maxIndex - minIndex, i => rootPath.concat(String(i + minIndex)))
    }
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
    }
  })
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

/**
 * Recursively transform ESON: a recursive "map" function
 * @param {ESON} eson
 * @param {function(value: ESON, path: Path, root: ESON)} callback
 * @return {ESON} Returns the transformed eson object
 */
export function transform (eson: ESON, callback: RecurseCallback) : ESON {
  return recurseTransform (eson, [], eson, callback)
}

/**
 * Recursively transform ESON
 * @param {ESON} value
 * @param {JSONPath} path
 * @param {ESON} root    The root object, object at path=[]
 * @param {function(value: ESON, path: Path, root: ESON)} callback
 * @return {ESON} Returns the transformed eson object
 */
function recurseTransform (value: ESON, path: JSONPath, root: ESON, callback: RecurseCallback) : ESON {
  let updatedValue: ESON = callback(value, path, root)

  if (value.type === 'Array') {
    let updatedItems = updatedValue.items

    updatedValue.items.forEach((item, index) => {
      const updatedItem = recurseTransform(item.value, path.concat(String(index)), root, callback)
      updatedItems = setIn(updatedItems, [index, 'value'], updatedItem)
    })

    updatedValue = setIn(updatedValue, ['items'], updatedItems)
  }

  if (value.type === 'Object') {
    let updatedProps = updatedValue.props

    updatedValue.props.forEach((prop, index) => {
      const updatedItem = recurseTransform(prop.value, path.concat(prop.name), root, callback)
      updatedProps = setIn(updatedProps, [index, 'value'], updatedItem)
    })

    updatedValue = setIn(updatedValue, ['props'], updatedProps)
  }

  // (for type 'string' or 'value' there are no childs to traverse)

  return updatedValue
}

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
    const parent = getIn(eson, toEsonPath(eson, parentPath))

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

// TODO: move getId and createUniqueId to a separate file

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
// TODO: use createUniqueId instead of getId()
export function getId () : number {
  _id++
  return _id
}
let _id = 0

/**
 * Find a unique id from an array with properties each having an id field.
 * The
 * @param {{id: string}} array
 */
// TODO: use createUniqueId instead of getId()
function createUniqueId (array) {
  return Math.max(...array.map(item => item.id)) + 1
}
