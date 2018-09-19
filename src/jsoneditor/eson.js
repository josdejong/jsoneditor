import { deleteIn, getIn, setIn, shallowCloneWithSymbols, transform, updateIn } from './utils/immutabilityHelpers'
import range from 'lodash/range'
import { compileJSONPointer, parseJSONPointer } from './jsonPointer'
import last from 'lodash/last'
import initial from 'lodash/initial'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import naturalSort from 'javascript-natural-sort'
import times from 'lodash/times'
import { immutableJSONPatch } from './immutableJSONPatch'
import { compareArrays } from './utils/arrayUtils'
import { compareStrings } from './utils/stringUtils'

export const ID = typeof Symbol === 'function' ? Symbol('id') : '@jsoneditor-id'
export const TYPE = typeof Symbol === 'function' ? Symbol('type') : '@jsoneditor-type' // 'object', 'array', 'value', or 'undefined'
export const VALUE = typeof Symbol === 'function' ? Symbol('value') : '@jsoneditor-value'
export const EXPANDED = typeof Symbol === 'function' ? Symbol('expanded') : '@jsoneditor-expanded'
export const ERROR = typeof Symbol === 'function' ? Symbol('error') : '@jsoneditor-error'
export const SEARCH_PROPERTY = typeof Symbol === 'function' ? Symbol('searchProperty') : '@jsoneditor-search-property'
export const SEARCH_VALUE = typeof Symbol === 'function' ? Symbol('searchValue') : '@jsoneditor-search-value'
export const SELECTION = typeof Symbol === 'function' ? Symbol('selection') : '@jsoneditor-selection'

export const SELECTED = 1
export const SELECTED_START = 2
export const SELECTED_END = 4
export const SELECTED_FIRST = 8
export const SELECTED_LAST = 16
export const SELECTED_INSIDE = 32
export const SELECTED_AFTER = 64
export const SELECTED_EMPTY = 128
export const SELECTED_EMPTY_BEFORE = 256

// TODO: comment
export function syncEson(json, eson) {
  const jsonType = getType(json)
  const esonType = eson ? eson[TYPE] : 'undefined'
  const sameType = jsonType === esonType

  if (jsonType === 'array') {
    // TODO: instead of creating updatedEson beforehand, only created as soon as we have a changed item
    let changed = (esonType !== jsonType) || (eson.length !== esonType.length)
    let updatedEson = []

    for (let i = 0; i < json.length; i++) {
      const esonI = eson ? eson[i] : undefined

      updatedEson[i] = syncEson(json[i], esonI)

      if (updatedEson[i] !== esonI) {
        changed = true
      }
    }

    if (changed) {
      updatedEson[ID] = sameType ? eson[ID] : createId()
      updatedEson[TYPE] = jsonType
      updatedEson[EXPANDED] = sameType ? eson[EXPANDED] : false

      return updatedEson
    }
    else {
      return eson
    }
  }
  else if (jsonType === 'object') {
    const jsonKeys = Object.keys(json)
    const esonKeys = esonType === 'object' ? Object.keys(eson) : []

    // TODO: instead of creating updatedEson beforehand, only created as soon as we have a changed item
    let changed = (esonType !== jsonType) || (jsonKeys.length !== esonKeys.length)
    let updatedEson = {}

    for (let i = 0; i < jsonKeys.length; i++) {
      const key = jsonKeys[i]
      const esonValue = eson ? eson[key] : undefined

      updatedEson[key] = syncEson(json[key], esonValue)

      if (updatedEson[key] !== esonValue) {
        changed = true
      }
    }

    if (changed) {
      updatedEson[ID] = sameType ? eson[ID] : createId()
      updatedEson[TYPE] = jsonType
      updatedEson[EXPANDED] = sameType ? eson[EXPANDED] : false

      return updatedEson
    }
    else {
      return eson
    }
  }
  else if (jsonType === 'value') { // json is a value
    if (sameType && eson && eson[VALUE] === json) {
      return eson
    }
    else {
      const updatedEson = {}

      updatedEson[ID] = sameType ? eson[ID] : createId()
      updatedEson[TYPE] = jsonType
      updatedEson[VALUE] = json
      updatedEson[EXPANDED] = false
      updatedEson.valueOf = () => json

      return updatedEson
    }
  }
  else { // jsonType === 'undefined'
    return undefined
  }
}

/**
 * Expand or collapse all items matching a filter callback
 * @param {ESON} eson
 * @param {function(Path) : boolean | undefined} callback
 *              All objects and arrays for which callback returns true will be expanded
 *              All objects and arrays for which callback returns false will be collapsed
 *              All objects and arrays for which callback returns undefined will be left as is
 * @return {ESON}
 */
export function expand (eson, callback) {
  return transform(eson, function (value, path) {
    if (value[TYPE] === 'array' || value[TYPE] === 'object') {
      const expanded = callback(path)
      return (typeof expanded === 'boolean')
          ? expandOne(value, [], expanded) // adjust expanded state
          : value  // leave as is when returned value is null or undefined
    }
    else {
      return value
    }
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
  return setIn(eson, path.concat(EXPANDED), expanded)
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
    return setIn(eson, path.concat(ERROR), error)
  }, eson)

  // cleanup any old error messages
  return cleanupMetaData(esonWithErrors, ERROR, errorPaths)
}

/**
 * Cleanup meta data from an eson object
 * @param {ESON} eson                 Object to be cleaned up
 * @param {String | Symbol} symbol    A meta data field name, for example ERROR or SELECTED
 * @param {Array.<string | Path>} [ignorePaths=[]]   An optional array with paths to be ignored
 * @return {ESON}
 */
export function cleanupMetaData(eson, symbol, ignorePaths = []) {
  // TODO: change ignorePaths to an object with path as key and true as value
  const pathsMap = {}
  ignorePaths.forEach(path => {
    const pathString = (typeof path === 'string') ? path : compileJSONPointer(path)
    pathsMap[pathString] = true
  })

  return transform(eson, function (value, path) {
    return (value[symbol] && !pathsMap[compileJSONPointer(path)])
        ? deleteIn(value, [symbol])
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
        getIn(eson, initial(path))[TYPE] === 'object') { // parent must be an Object
      const searchState = isEmpty(matches) ? 'active' : 'normal'
      matches.push({path, area: 'property'})
      updatedValue = setIn(updatedValue, [SEARCH_PROPERTY], searchState)
    }
    else {
      updatedValue = deleteIn(updatedValue, [SEARCH_PROPERTY])
    }

    // check value
    if (value[TYPE] === 'value' && text !== '' && containsCaseInsensitive(value[VALUE], text)) {
      const searchState = isEmpty(matches) ? 'active' : 'normal'
      matches.push({path, area: 'value'})
      updatedValue = setIn(updatedValue, [SEARCH_VALUE], searchState)
    }
    else {
      updatedValue = deleteIn(updatedValue, [SEARCH_VALUE])
    }

    return updatedValue
  })

  matches.sort((a, b) => {
    const arrayOrder = compareArrays(a.path, b.path)
    if (arrayOrder !== 0) {
      return arrayOrder
    }

    // order property first, value second.
    // we can use regular string ordering here because the word
    // "property" comes before "value"
    return compareStrings(a.area, b.area)
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
  const searchSymbol = esonPointer.area === 'property' ? SEARCH_PROPERTY : SEARCH_VALUE

  return setIn(eson, esonPointer.path.concat([searchSymbol]), searchStatus)
}

/**
 * Merge selection status into the eson object, cleanup previous selection
 * @param {ESON} eson
 * @param {Selection | null} selection
 * @return {ESON} Returns updated eson object
 */
export function applySelection (eson, selection) {
  if (!selection) {
    return cleanupMetaData(eson, 'selected')
  }
  else if (selection.inside) {
    const updatedEson = setIn(eson, selection.inside.concat([SELECTION]), SELECTED_INSIDE)
    return cleanupMetaData(updatedEson, 'selected', [selection.inside])
  }
  else if (selection.after) {
    const updatedEson = setIn(eson, selection.after.concat([SELECTION]), SELECTED_AFTER)
    return cleanupMetaData(updatedEson, 'selected', [selection.after])
  }
  else if (selection.empty) {
    const updatedEson = setIn(eson, selection.empty.concat([SELECTION]), SELECTED_EMPTY)
    return cleanupMetaData(updatedEson, 'selected', [selection.empty])
  }
  else if (selection.emptyBefore) {
    const updatedEson = setIn(eson, selection.emptyBefore.concat([SELECTION]), SELECTED_EMPTY_BEFORE)
    return cleanupMetaData(updatedEson, 'selected', [selection.emptyBefore])
  }
  else { // selection.start and selection.end
    // find the parent node shared by both start and end of the selection
    const rootPath = findRootPath(selection)
    let selectedPaths = null

    const updatedEson = updateIn(eson, rootPath, (root) => {
      const start = selection.start[rootPath.length]
      const end   = selection.end[rootPath.length]

      // TODO: simplify the update function. Use pathsFromSelection ?

      if (root[TYPE] === 'object') {
        const props = Object.keys(root).sort(naturalSort) // TODO: create a util function getSortedProps
        const startIndex = props.indexOf(start)
        const endIndex   = props.indexOf(end)

        const firstIndex = Math.min(startIndex, endIndex)
        const lastIndex = Math.max(startIndex, endIndex)
        const firstProp = props[firstIndex]
        const lastProp = props[lastIndex]

        const selectedProps = props.slice(firstIndex, lastIndex + 1)// include max index itself
        selectedPaths = selectedProps.map(prop => rootPath.concat(prop))
        let updatedObj = shallowCloneWithSymbols(root)
        selectedProps.forEach(prop => {
          const selected = SELECTED +
              (prop === start ? SELECTED_START : 0) +
              (prop === end ? SELECTED_END : 0) +
              (prop === firstProp ? SELECTED_FIRST : 0) +
              (prop === lastProp ? SELECTED_LAST : 0)
          updatedObj[prop] = setIn(updatedObj[prop], [SELECTION], selected)
        })

        return updatedObj
      }
      else { // root[TYPE] === 'array'
        const startIndex = parseInt(start, 10)
        const endIndex   = parseInt(end, 10)

        const firstIndex = Math.min(startIndex, endIndex)
        const lastIndex = Math.max(startIndex, endIndex)

        const selectedIndices = range(firstIndex, lastIndex + 1)// include max index itself
        selectedPaths = selectedIndices.map(index => rootPath.concat(String(index)))

        let updatedArr = root.slice()
        updatedArr = shallowCloneWithSymbols(root)
        selectedIndices.forEach(index => {
          const selected = SELECTED +
              (index === startIndex ? SELECTED_START : 0) +
              (index === endIndex ? SELECTED_END : 0) +
              (index === firstIndex ? SELECTED_FIRST : 0) +
              (index === lastIndex ? SELECTED_LAST : 0)
          updatedArr[index] = setIn(updatedArr[index], [SELECTION], selected)
        })

        return updatedArr
      }
    })

    return cleanupMetaData(updatedEson, 'selected', selectedPaths)
  }
}

/**
 * Get the contents of a list with paths
 * @param {ESON} eson
 * @param {Path[]} paths
 * @return {Array.<{name: string, value: JSON, state: Object}>}
 */
export function contentsFromPaths (eson, paths) {
  return paths.map(path => {
    const value = getIn(eson, path.concat(VALUE))
    return {
      name: last(path),
      value,
      state: {} // FIXME: state
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
  if (selection.inside) {
    return initial(selection.inside)
  }
  else if (selection.after) {
    return initial(selection.after)
  }
  else if (selection.empty) {
    return initial(selection.empty)
  }
  else if (selection.emptyBefore) {
    return initial(selection.emptyBefore)
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
 * Get the JSON paths from a selection, sorted from first to last
 * @param {ESON} eson
 * @param {Selection} selection
 * @return {Path[]}
 */
// TODO: move pathsFromSelection to a separate file clipboard.js or selection.js?
export function pathsFromSelection (eson, selection) {
  // find the parent node shared by both start and end of the selection
  const rootPath = findRootPath(selection)
  const root = getIn(eson, rootPath)

  const start = (selection.after || selection.inside || selection.start)[rootPath.length]
  const end = (selection.after || selection.inside || selection.end)[rootPath.length]

  if (getType(root) === 'object') {
    // TODO: create a util function getSortedProps, cache results?
    const props = Object.keys(root).sort(naturalSort)
    const startIndex = props.indexOf(start)
    const endIndex   = props.indexOf(end)

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex) + ((selection.after || selection.inside) ? 0 : 1) // include max index itself

    return times(maxIndex - minIndex, i => rootPath.concat(props[i + minIndex]))
  }
  else { // root[TYPE] === 'array'
    const startIndex = parseInt(start, 10)
    const endIndex   = parseInt(end, 10)

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex) + ((selection.after || selection.inside) ? 0 : 1) // include max index itself

    return times(maxIndex - minIndex, i => rootPath.concat(String(i + minIndex)))
  }
}

/**
 * Apply a JSON patch document to an ESON object.
 * - Applies meta information to added values
 * - Reckons with creating unique id's when duplicating data
 * @param eson
 * @param operations
 * @returns {{json: JSON, revert: JSONPatchDocument, error: (Error|null)}}
 */
export function immutableESONPatch (eson, operations) {
  return immutableJSONPatch(eson, operations, {
    fromJSON: (value, previousEson) => syncEson(value, previousEson),
    toJSON: (eson) => eson.valueOf(),
    clone: (value) => setIn(value, [ID], createId())
  })
}

// TODO: comment
export function getType (any) {
  if (any === undefined) {
    return 'undefined'
  }

  if (any && any[TYPE]) {
    return any[TYPE]
  }

  if (Array.isArray(any)) {
    return 'array'
  }

  if (any && typeof any === 'object') {
    return 'object'
  }

  return 'value'
}

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
function createId () {
  _id++
  return 'node-' + _id
}
let _id = 0
