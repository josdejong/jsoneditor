// @flow weak

/**
 * This file contains functions to act on a JSONData object.
 * All functions are pure and don't mutate the JSONData.
 */

import { setIn, getIn } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import { last, allButLast } from  './utils/arrayUtils'
import isEqual from 'lodash/isEqual'

import type { JSONData, ObjectData, ItemData, DataPointer, Path } from './types'

type RecurseCallback = (value: JSONData, path: Path, root: JSONData) => JSONData

/**
 * Expand function which will expand all nodes
 * @param {Path} path
 * @return {boolean}
 */
export function expandAll (path) {
  return true
}

/**
 * Convert a JSON object into the internally used data model
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Path)} [expand]
 * @param {Path} [path=[]]
 * @param {JSONDataType} [type='value']  Optional json data type for the created value
 * @return {JSONData}
 */
export function jsonToData (json, expand = expandAll, path = [], type = 'value') : JSONData {
  if (Array.isArray(json)) {
    return {
      type: 'Array',
      expanded: expand(path),
      items: json.map((child, index) => {
        return {
          id: getId(), // TODO: use id based on index (only has to be unique within this array)
          value: jsonToData(child, expand, path.concat(index))
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
          value: jsonToData(json[name], expand, path.concat(name))
        }
      })
    }
  }
  else { // value
    return {
      type,
      value: json
    }
  }
}

/**
 * Convert the internal data model to a regular JSON object
 * @param {JSONData} data
 * @return {Object | Array | string | number | boolean | null} json
 */
export function dataToJson (data: JSONData) {
  switch (data.type) {
    case 'Array':
      return data.items.map(item => dataToJson(item.value))

    case 'Object':
      const object = {}

      data.props.forEach(prop => {
        object[prop.name] = dataToJson(prop.value)
      })

      return object

    default: // type 'string' or 'value'
      return data.value
  }
}

/**
 * Convert a path of a JSON object into a path in the corresponding data model
 * @param {JSONData} data
 * @param {Path} path
 * @return {Path} dataPath
 * @private
 */
export function toDataPath (data: JSONData, path: Path) : Path {
  if (path.length === 0) {
    return []
  }

  if (data.type === 'Array') {
    // index of an array
    const index = path[0]
    const item = data.items[parseInt(index)]
    if (!item) {
      throw new Error('Array item "' + index + '" not found')
    }

    return ['items', index, 'value'].concat(toDataPath(item.value, path.slice(1)))
  }
  else if (data.type === 'Object') {
    // object property. find the index of this property
    const index = findPropertyIndex(data, path[0])
    const prop = data.props[index]
    if (!prop) {
      throw new Error('Object property "' + path[0] + '" not found')
    }

    return ['props', index, 'value']
        .concat(toDataPath(prop.value, path.slice(1)))
  }
  else {
    return []
  }
}

type ExpandCallback = (Path) => boolean

/**
 * Expand or collapse one or multiple items or properties
 * @param {JSONData} data
 * @param {function(path: Path) : boolean | Path} callback
 *              When a path, the object/array at this path will be expanded/collapsed
 *              When a function, all objects and arrays for which callback
 *              returns true will be expanded/collapsed
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {JSONData}
 */
export function expand (data: JSONData, callback: Path | (Path) => boolean, expanded: boolean = true) {
  // console.log('expand', callback, expand)

  if (typeof callback === 'function') {
    return transform(data, function (value: JSONData, path: Path, root: JSONData) : JSONData {
      if (value.type === 'Array' || value.type === 'Object') {
        if (callback(path)) {
          return setIn(value, ['expanded'], expanded)
        }
      }

      return value
    })
  }
  else if (Array.isArray(callback)) {
    const dataPath: Path = toDataPath(data, callback)

    return setIn(data, dataPath.concat(['expanded']), expanded)
  }
  else {
    throw new Error('Callback function or path expected')
  }
}

/**
 * Expand all Objects and Arrays on a path
 */
export function expandPath (data: JSONData, path?: Path) : JSONData {
  let updatedData = data

  if (path) {
    updatedData = expand(updatedData, [], true) // expand root

    for (let i = 0; i < path.length; i++) {
      const pathPart = path.slice(0, i + 1)
      updatedData = expand(updatedData, pathPart, true)
    }
  }

  return updatedData
}

/**
 * Merge one or multiple errors (for example JSON schema errors)
 * into the data
 *
 * @param {JSONData} data
 * @param {JSONSchemaError[]} errors
 */
export function addErrors (data: JSONData, errors) {
  let updatedData = data

  if (errors) {
    errors.forEach(error => {
      const dataPath = toDataPath(data, parseJSONPointer(error.dataPath))
      // TODO: do we want to be able to store multiple errors per item?
      updatedData = setIn(updatedData, dataPath.concat('error'), error)
    })
  }

  return updatedData
}

/**
 * Search some text in all properties and values
 */
export function search (data: JSONData, text: string): DataPointer[] {
  let results: DataPointer[] = []

  if (text !== '') {
    traverse(data, function (value, path) {
      // check property name
      if (path.length > 0) {
        const prop = last(path)
        if (containsCaseInsensitive(prop, text)) {
          // only add search result when this is an object property name,
          // don't add search result for array indices
          const parentPath = allButLast(path)
          const parent = getIn(data, toDataPath(data, parentPath))
          if (parent.type === 'Object') {
            results.push({path, type: 'property'})
          }
        }
      }

      // check value
      if (value.type === 'value') {
        if (containsCaseInsensitive(value.value, text)) {
          results.push({path, type: 'value'})
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
export function nextSearchResult (searchResults: DataPointer[], current: DataPointer): DataPointer | null {
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
export function previousSearchResult (searchResults: DataPointer[], current: DataPointer): DataPointer | null {
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
 * Merge searchResults into the data
 */
export function addSearchResults (data: JSONData, searchResults: DataPointer[], activeSearchResult: DataPointer) {
  let updatedData = data

  searchResults.forEach(function (searchResult) {
    if (searchResult.type === 'value') {
      const dataPath = toDataPath(data, searchResult.path).concat('searchResult')
      const value = isEqual(searchResult, activeSearchResult) ? 'active' : 'normal'
      updatedData = setIn(updatedData, dataPath, value)
    }

    if (searchResult.type === 'property') {
      const valueDataPath = toDataPath(data, searchResult.path)
      const propertyDataPath = allButLast(valueDataPath).concat('searchResult')
      const value = isEqual(searchResult, activeSearchResult) ? 'active' : 'normal'
      updatedData = setIn(updatedData, propertyDataPath, value)
    }
  })

  return updatedData
}

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
 * Recursively transform JSONData: a recursive "map" function
 * @param {JSONData} data
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 * @return {JSONData} Returns the transformed data
 */
export function transform (data: JSONData, callback: RecurseCallback) {
  return recurseTransform (data, [], data, callback)
}

/**
 * Recursively transform JSONData
 * @param {JSONData} value
 * @param {Path} path
 * @param {JSONData} root    The root object, object at path=[]
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 * @return {JSONData} Returns the transformed data
 */
function recurseTransform (value: JSONData, path: Path, root: JSONData, callback: RecurseCallback) : JSONData {
  let updatedValue = callback(value, path, root)

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
 * Recursively loop over a JSONData object: a recursive "forEach" function.
 * @param {JSONData} data
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 */
export function traverse (data: JSONData, callback: RecurseCallback) {
  return recurseTraverse (data, [], data, callback)
}

/**
 * Recursively traverse a JSONData object
 * @param {JSONData} value
 * @param {Path} path
 * @param {JSONData | null} root    The root object, object at path=[]
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 */
function recurseTraverse (value: JSONData, path: Path, root: JSONData, callback: RecurseCallback) {
  callback(value, path, root)

  switch (value.type) {
    case 'Array': {
      value.items.forEach((item: ItemData, index) => {
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
 * Test whether a path exists in the json data
 * @param {JSONData} data
 * @param {Path} path
 * @return {boolean} Returns true if the path exists, else returns false
 * @private
 */
export function pathExists (data, path) {
  if (data === undefined) {
    return false
  }

  if (path.length === 0) {
    return true
  }

  let index
  if (data.type === 'Array') {
    // index of an array
    index = path[0]
    const item = data.items[index]

    return pathExists(item && item.value, path.slice(1))
  }
  else {
    // object property. find the index of this property
    index = findPropertyIndex(data, path[0])
    const prop = data.props[index]

    return pathExists(prop && prop.value, path.slice(1))
  }
}

/**
 * Resolve the index for `arr/-`, replace it with an index value equal to the
 * length of the array
 * @param {JSONData} data
 * @param {Path} path
 * @return {Path}
 */
export function resolvePathIndex (data, path) {
  if (path[path.length - 1] === '-') {
    const parentPath = path.slice(0, path.length - 1)
    const parent = getIn(data, toDataPath(data, parentPath))

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
 * @param {JSONData} parent
 * @param {string} prop
 * @return {string | null} Returns the name of the next property,
 *                         or null if there is none
 */
export function findNextProp (parent: ObjectData, prop: string) : string | null {
  const index = findPropertyIndex(parent, prop)
  if (index === -1) {
    return null
  }

  const next = parent.props[index + 1]
  return next && next.name || null
}

/**
 * Find the index of a property
 * @param {ObjectData} object
 * @param {string} prop
 * @return {number}  Returns the index when found, -1 when not found
 */
export function findPropertyIndex (object: ObjectData, prop: string) {
  return object.props.findIndex(p => p.name === prop)
}

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
