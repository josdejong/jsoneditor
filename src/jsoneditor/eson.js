/**
 * This file contains functions to act on a ESON object.
 * All functions are pure and don't mutate the ESON.
 */

import { setIn, getIn, updateIn, deleteIn, cloneWithSymbols } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import range from 'lodash/range'
import times from 'lodash/times'
import initial from 'lodash/initial'
import last from 'lodash/last'

export const SELECTED = 1
export const SELECTED_END = 2
export const SELECTED_BEFORE = 3
export const SELECTED_AFTER = 4

export const META = Symbol('meta')

/**
 * Expand function which will expand all nodes
 * @param {Path} path
 * @return {boolean}
 */
export function expandAll (path) {
  return true
}

/**
 *
 * @param {JSON} json
 * @param {Path} path
 * @return {ESON}
 */
export function jsonToEson (json, path = []) {
  const id = createId()

  if (isObject(json)) {
    let eson = {}
    const props = Object.keys(json)
    props.forEach((prop) => eson[prop] = jsonToEson(json[prop], path.concat(prop)))
    eson[META] = { id, path, type: 'Object', props }
    return eson
  }
  else if (Array.isArray(json)) {
    let eson = json.map((value, index) => jsonToEson(value, path.concat(String(index))))
    eson[META] = { id, path, type: 'Array' }
    return eson
  }
  else { // json is a number, string, boolean, or null
    let eson = {}
    eson[META] = { id, path, type: 'value', value: json }
    return eson
  }
}

/**
 * Convert an ESON object to a JSON object
 * @param {ESON} eson
 * @return {Object | Array | string | number | boolean | null} json
 */
export function esonToJson (eson) {
  switch (eson[META].type) {
    case 'Array':
      return eson.map(item => esonToJson(item))

    case 'Object':
      const object = {}

      eson[META].props.forEach(prop => {
        object[prop] = esonToJson(eson[prop])
      })

      return object

    default: // type 'string' or 'value'
      return eson[META].value
  }
}

/**
 * Transform an eson object, traverse over the whole object (excluding the _meta)
 * objects, and allow replacing Objects/Arrays/values
 * @param {ESON} eson
 * @param {function (ESON, Path) : ESON} callback
 * @param {Path} [path]
 * @return {ESON}
 */
export function transform (eson, callback, path = []) {
  const updated = callback(eson, path)

  if (updated[META].type === 'Object') {
    let changed = false
    let updatedChilds = {}
    for (let key in updated) {
      if (updated.hasOwnProperty(key)) {
        updatedChilds[key] = transform(updated[key], callback, path.concat(key))
        changed = changed || (updatedChilds[key] !== updated[key])
      }
    }
    updatedChilds[META] = updated[META]
    return changed ? updatedChilds : updated
  }
  else if (updated[META].type === 'Array') {
    let changed = false
    let updatedChilds = []
    for (let i = 0; i < updated.length; i++) {
      updatedChilds[i] = transform(updated[i], callback, path.concat(String(i)))
        changed = changed || (updatedChilds[i] !== updated[i])
    }
    updatedChilds[META] = updated[META]
    return changed ? updatedChilds : updated
  }
  else {  // eson[META].type === 'value'
    return updated
  }
}

/**
 * Recursively update all paths in an eson object, array or value
 * @param {ESON} eson
 * @param {Path} [path]
 * @return {ESON}
 */
export function updatePaths(eson, path = []) {
  return transform(eson, function (value, path) {
    if (!isEqual(value[META].path, path)) {
      return setIn(value, [META, 'path'], path)
    }
    else {
      return value
    }
  }, path)
}

/**
 * Expand or collapse all items matching a filter callback
 * @param {ESON} eson
 * @param {function(Path) : boolean | Path} filterCallback
 *              When a path, the object/array at this path will be expanded/collapsed
 *              When a function, all objects and arrays for which callback
 *              returns true will be expanded/collapsed
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {ESON}
 */
export function expand (eson, filterCallback, expanded = true) {
  // TODO: adjust expand to have a filterCallback which can return true, false, or undefined. In the latter case, the expanded state is left as is.
  return transform(eson, function (value, path) {
    return ((value[META].type === 'Array' || value[META].type === 'Object') && filterCallback(path))
        ? expandOne(value, [], expanded)
        : value
  })
}

/**
 * Expand or collapse one or multiple items or properties
 * @param {ESON} eson
 * @param {Path} path  Path to be expanded
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {ESON}
 */
export function expandOne (eson, path, expanded = true) {
  return setIn(eson, path.concat([META, 'expanded']), expanded)
}

/**
 * Expand all parent Objects and Arrays along a path
 * @param {ESON} eson
 * @param {Path} path  Path to be expanded
 * @param {boolean} [expanded=true]  New expanded state: true to expand, false to collapse
 * @return {ESON}
 */
export function expandPath (eson, path, expanded = true) {
  let updatedEson = expandOne(eson, [], expanded) // expand root

  for (let i = 0; i < path.length; i++) {
    const pathPart = path.slice(0, i + 1)
    updatedEson = expandOne(updatedEson, pathPart, expanded)
  }

  return updatedEson
}

/**
 * Merge one or multiple errors (for example JSON schema errors) into the ESON object
 * Cleanup old error messages
 *
 * @param {ESON} eson
 * @param {JSONSchemaError[]} errors
 * @return {ESON}
 */
export function applyErrors (eson, errors = []) {
  const errorPaths = errors.map(error => error.dataPath)

  const esonWithErrors = errors.reduce((eson, error) => {
    const path = parseJSONPointer(error.dataPath)
    // TODO: do we want to be able to store multiple errors per item?
    return setIn(eson, path.concat([META, 'error']), error)
  }, eson)

  // cleanup any old error messages
  return cleanupMetaData(esonWithErrors, 'error', errorPaths)
}

/**
 * Cleanup meta data from an eson object
 * @param {ESON} eson                 Object to be cleaned up
 * @param {String} field              Field name, for example 'error' or 'selected'
 * @param {Path[]} [ignorePaths=[]]   An optional array with paths to be ignored
 * @return {ESON}
 */
export function cleanupMetaData(eson, field, ignorePaths = []) {
  const pathsMap = {}
  ignorePaths.forEach(path => {
    const pathString = (typeof path === 'string') ? path : compileJSONPointer(path)
    pathsMap[pathString] = true
  })

  return transform(eson, function (value, path) {
    return (value[META][field] && !pathsMap[compileJSONPointer(path)])
        ? deleteIn(value, [META, field])
        : value
  })
}

/**
 * Search some text in all properties and values
 * @param {ESON} eson
 * @param {String} text Search text
 * @return {SearchResult} Returns search result:
 *              An updated eson object containing the search results,
 *              and an array with the paths of all matches
 */
export function search (eson, text) {
  let matches = []

  // TODO: keep active result from previous search if any?

  const updatedEson = transform (eson, function (value, path) {
    let updatedValue = value

    // check property name
    const prop = last(path)
    if (text !== '' && containsCaseInsensitive(prop, text) &&
        getIn(eson, initial(path))[META].type === 'Object') { // parent must be an Object
      const searchState = isEmpty(matches) ? 'active' : 'normal'
      matches.push({path, area: 'property'})
      updatedValue = setIn(updatedValue, [META, 'searchProperty'], searchState)
    }
    else {
      updatedValue = deleteIn(updatedValue, [META, 'searchProperty'])
    }

    // check value
    if (value[META].type === 'value' && text !== '' && containsCaseInsensitive(value[META].value, text)) {
      const searchState = isEmpty(matches) ? 'active' : 'normal'
      matches.push({path, area: 'value'})
      updatedValue = setIn(updatedValue, [META, 'searchValue'], searchState)
    }
    else {
      updatedValue = deleteIn(updatedValue, [META, 'searchValue'])
    }

    return updatedValue
  })

  return {
    eson: updatedEson,
    searchResult: {
      text,
      matches,
      active: matches[0] || null
    }
  }
}

/**
 * Find the previous search result given a current search result
 * When the current search result is the first one, the search will wrap around
 * and return the last result as next.
 *
 * @param {ESON} eson
 * @param {SearchResult} searchResult
 * @return {{eson: ESON, searchResult: SearchResult}}
 */
export function previousSearchResult (eson, searchResult) {
  if (searchResult.matches.length === 0) {
    return { eson, searchResult }
  }

  const index = searchResult.matches.findIndex(match => isEqual(match, searchResult.active))
  const previous = (index !== -1)
      ? index > 0
          ? searchResult.matches[index - 1]
          : last(searchResult.matches)
      : searchResult.matches[0]

  return {
    eson: setSearchStatus(setSearchStatus(eson, searchResult.active, 'normal'), previous, 'active'),
    searchResult: Object.assign({}, searchResult, { active: previous})
  }
}

/**
 * Find the next search result given a current search result
 * When the current search result is the last one, the search will wrap around
 * and return the first result as next.
 *
 * @param {ESON} eson
 * @param {SearchResult} searchResult
 * @return {{eson: ESON, searchResult: SearchResult}}
 */
export function nextSearchResult (eson, searchResult) {
  if (isEmpty(searchResult.matches)) {
    return { eson, searchResult }
  }

  const index = searchResult.matches.findIndex(match => isEqual(match, searchResult.active))
  const next = (index !== -1)
      ? index < searchResult.matches.length - 1
          ? searchResult.matches[index + 1]
          : searchResult.matches[0]
      : searchResult.matches[0]

  return {
    eson: setSearchStatus(setSearchStatus(eson, searchResult.active, 'normal'), next, 'active'),
    searchResult: Object.assign({}, searchResult, { active: next})
  }
}

/**
 * @param {ESON} eson
 * @param {ESONPointer} esonPointer
 * @param {SearchResultStatus} searchStatus
 * @return {Object|Array}
 */
function setSearchStatus (eson, esonPointer, searchStatus) {
  const metaProp = esonPointer.area === 'property' ? 'searchProperty': 'searchValue'

  return setIn(eson, esonPointer.path.concat([META, metaProp]), searchStatus)
}

/**
 * Merge selection status into the eson object, cleanup previous selection
 * @param {ESON} eson
 * @param {Selection} [selection]
 * @return {ESON} Returns updated eson object
 */
export function applySelection (eson, selection) {
  if (!selection) {
    return cleanupMetaData(eson, 'selected')
  }
  else if (selection.before) {
    const updatedEson = setIn(eson, selection.before.concat([META, 'selected']), SELECTED_BEFORE)
    return cleanupMetaData(updatedEson, 'selected', [selection.before])
  }
  else if (selection.after) {
    const updatedEson = setIn(eson, selection.after.concat([META, 'selected']), SELECTED_AFTER)
    return cleanupMetaData(updatedEson, 'selected', [selection.after])
  }
  else { // selection.start and selection.end
    // find the parent node shared by both start and end of the selection
    const rootPath = findRootPath(selection)
    let selectedPaths = null

    const updatedEson = updateIn(eson, rootPath, (root) => {
      const start = selection.start[rootPath.length]
      const end   = selection.end[rootPath.length]

      // TODO: simplify the update function. Use pathsFromSelection ?

      if (root[META].type === 'Object') {
        const startIndex = root[META].props.indexOf(start)
        const endIndex   = root[META].props.indexOf(end)

        const minIndex = Math.min(startIndex, endIndex)
        const maxIndex = Math.max(startIndex, endIndex) + 1 // include max index itself

        const selectedProps = root[META].props.slice(minIndex, maxIndex)
        selectedPaths = selectedProps.map(prop => rootPath.concat(prop))
        let updatedObj = cloneWithSymbols(root)
        selectedProps.forEach(prop => {
          updatedObj[prop] = setIn(updatedObj[prop], [META, 'selected'],
              prop === end ? SELECTED_END : SELECTED)
        })

        return updatedObj
      }
      else { // root[META].type === 'Array'
        const startIndex = parseInt(start, 10)
        const endIndex   = parseInt(end, 10)

        const minIndex = Math.min(startIndex, endIndex)
        const maxIndex = Math.max(startIndex, endIndex) + 1 // include max index itself

        const selectedIndices = range(minIndex, maxIndex)
        selectedPaths = selectedIndices.map(index => rootPath.concat(String(index)))

        let updatedArr = root.slice()
        updatedArr = cloneWithSymbols(root)
        selectedIndices.forEach(index => {
          updatedArr[index] = setIn(updatedArr[index], [META, 'selected'],
              index === endIndex ? SELECTED_END : SELECTED)
        })

        return updatedArr
      }
    })

    return cleanupMetaData(updatedEson, 'selected', selectedPaths)
  }
}

/**
 * Find the min and max index of a start and end child.
 * Start and end can be a property name in case of an Object,
 * or a matrix index (string with a number) in case of an Array.
 *
 * @param {ESON} root
 * @param {Path} rootPath
 * @param {Selection} selection
 * @return {{minIndex: number, maxIndex: number}}
 */
export function findSelectionIndices (root, rootPath, selection) {
  const start = (selection.after || selection.before || selection.start)[rootPath.length]
  const end = (selection.after || selection.before || selection.end)[rootPath.length]

  // if no object we assume it's an Array
  const startIndex = root[META].type === 'Object' ? root[META].props.indexOf(start) : parseInt(start, 10)
  const endIndex   = root[META].type === 'Object' ? root[META].props.indexOf(end) : parseInt(end, 10)

  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex) +
      ((selection.after || selection.before) ? 0 : 1) // include max index itself

  return { minIndex, maxIndex }
}

/**
 * Get the JSON paths from a selection, sorted from first to last
 * @param {ESON} eson
 * @param {Selection} selection
 * @return {Path[]}
 */
export function pathsFromSelection (eson, selection) {
  // find the parent node shared by both start and end of the selection
  const rootPath = findRootPath(selection)
  const root = getIn(eson, rootPath)

  const { minIndex, maxIndex } = findSelectionIndices(root, rootPath, selection)

  if (root[META].type === 'Object') {
    return times(maxIndex - minIndex, i => rootPath.concat(root[META].props[i + minIndex]))
  }
  else { // root[META].type === 'Array'
    return times(maxIndex - minIndex, i => rootPath.concat(String(i + minIndex)))
  }
}

/**
 * Get the contents of a list with paths
 * @param {ESON} data
 * @param {Path[]} paths
 * @return {Array.<{name: string, value: JSON}>}
 */
export function contentsFromPaths (data, paths) {
  return paths.map(path => {
    return {
      name: last(path),
      value: esonToJson(getIn(data, path))
      // FIXME: also store the type and expanded state
    }
  })
}

/**
 * Find the root path of a selection: the parent node shared by both start
 * and end of the selection
 * @param {Selection} selection
 * @return {Path}
 */
export function findRootPath(selection) {
  if (selection.before) {
    return initial(selection.before)
  }
  else if (selection.after) {
    return initial(selection.after)
  }
  else { // selection.start and selection.end
    const sharedPath = findSharedPath(selection.start, selection.end)

    if (sharedPath.length === selection.start.length ||
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
 * @param {Path} path1
 * @param {Path} path2
 * @return {Path}
 */
function findSharedPath (path1, path2) {
  let i = 0;
  while (i < path1.length && path1[i] === path2[i]) {
    i++;
  }

  return path1.slice(0, i)
}

/**
 * Test whether a path exists in the eson object
 * @param {ESON} eson
 * @param {Path} path
 * @return {boolean} Returns true if the path exists, else returns false
 * @private
 */
export function pathExists (eson, path) {
  if (eson === undefined) {
    return false
  }

  if (path.length === 0) {
    return true
  }

  if (Array.isArray(eson)) {
    // index of an array
    return pathExists(eson[parseInt(path[0], 10)], path.slice(1))
  }
  else { // Object
    // object property. find the index of this property
    return pathExists(eson[path[0]], path.slice(1))
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
    const parentPath = initial(path)
    const parent = getIn(eson, parentPath)

    if (Array.isArray(parent)) {
      const index = parent.length
      return parentPath.concat(String(index))
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
export function findNextProp (parent, prop) {
  const index = parent[META].props.indexOf(prop)
  return parent[META].props[index + 1] || null
}

// TODO: move parseJSONPointer and compileJSONPointer to a separate file

/**
 * Parse a JSON Pointer
 * WARNING: this is not a complete implementation
 * @param {string} pointer
 * @return {Path}
 */
export function parseJSONPointer (pointer) {
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
export function compileJSONPointer (path) {
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
export function containsCaseInsensitive (text, search) {
  return String(text).toLowerCase().indexOf(search.toLowerCase()) !== -1
}

/**
 * Get a new "unique" id. Id's are created from an incremental counter.
 * @return {number}
 */
export function createId () {
  _id++
  return _id
}
let _id = 0
