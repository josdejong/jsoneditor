import last from 'lodash/last'
import initial from 'lodash/initial'
import isEmpty from 'lodash/isEmpty'
import first from 'lodash/first'
import { findRootPath, pathsFromSelection } from './eson'
import { getIn } from './utils/immutabilityHelpers'
import { findUniqueName } from './utils/stringUtils'
import { isObject, stringConvert } from './utils/typeUtils'
import { compareAsc, compareDesc } from './utils/arrayUtils'
import { compileJSONPointer } from './jsonPointer'

/**
 * Create a JSONPatch to change the value of a property or item
 * @param {JSON} eson
 * @param {Path} path
 * @param {*} value
 * @return {Array}
 */
export function changeValue (eson, path, value) {
  // console.log('changeValue', data, value)

  return [{
    op: 'replace',
    path: compileJSONPointer(path),
    value
  }]
}

/**
 * Create a JSONPatch to change a property name
 * @param {JSON} json
 * @param {Path} parentPath
 * @param {string} oldProp
 * @param {string} newProp
 * @return {Array}
 */
export function changeProperty (json, parentPath, oldProp, newProp) {
  // console.log('changeProperty', parentPath, oldProp, newProp)
  const parent = getIn(json, parentPath)

  // prevent duplicate property names
  const uniqueNewProp = findUniqueName(newProp, parent)

  return [{
    op: 'move',
    from: compileJSONPointer(parentPath.concat(oldProp)),
    path: compileJSONPointer(parentPath.concat(uniqueNewProp))
  }]
}

/**
 * Create a JSONPatch to change the type of a property or item
 * @param {JSON} json
 * @param {Path} path
 * @param {ESONType} type
 * @return {Array}
 */
export function changeType (json, path, type) {
  const oldValue = getIn(json, path)
  const newValue = convertType(oldValue, type)

  // console.log('changeType', path, type, oldValue, newValue)

  return [{
    op: 'replace',
    path: compileJSONPointer(path),
    value: newValue
  }]
}

/**
 * Create a JSONPatch for a duplicate action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the duplicated node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Selection} selection
 * @return {Array}
 */
export function duplicate (json, selection) {
  // console.log('duplicate', path)
  if (!selection.start || !selection.end) {
    return []
  }

  const rootPath = findRootPath(selection)
  const root = getIn(json, rootPath)
  const paths = pathsFromSelection(json, selection)

  if (Array.isArray(root)) {
    const lastPath = last(paths)
    const offset = lastPath ? (parseInt(last(lastPath), 10) + 1) : 0

    return paths.map((path, index) => ({
      op: 'copy',
      from: compileJSONPointer(path),
      path: compileJSONPointer(rootPath.concat(index + offset))
    }))
  }
  else { // 'object'
    return paths.map(path => {
      const prop = last(path)
      const newProp = findUniqueName(prop, root)

      return {
        op: 'copy',
        from: compileJSONPointer(path),
        path: compileJSONPointer(rootPath.concat(newProp))
      }
    })
  }
}

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path} path
 * @param {Array.<{name?: string, value: JSON}>} values
 * @return {Array}
 */
export function insertBefore (json, path, values) {  // TODO: find a better name and define datastructure for values
  // TODO: refactor. path should be parent path
  const parentPath = initial(path)
  const parent = getIn(json, parentPath)

  if (Array.isArray(parent)) {
    const startIndex = parseInt(last(path), 10)
    return values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(startIndex + offset)),
      value: entry.value
    }))
  }
  else { // 'object'
    return values.map(entry => {
      const newProp = findUniqueName(entry.name, parent)
      return {
        op: 'add',
        path: compileJSONPointer(parentPath.concat(newProp)),
        value: entry.value
      }
    })
  }
}

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path} path
 * @param {Array.<{name?: string, value: JSON}>} values
 * @return {Array}
 */
export function insertAfter (json, path, values) {  // TODO: find a better name and define datastructure for values
  // TODO: refactor. path should be parent path
  const parentPath = initial(path)
  const parent = getIn(json, parentPath)

  if (Array.isArray(parent)) {
    const startIndex = parseInt(last(path), 10)
    return values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(startIndex + 1 + offset)), // +1 to insert after
      value: entry.value
    }))
  }
  else { // 'object'
    return values.map(entry => {
      const newProp = findUniqueName(entry.name, parent)
      return {
        op: 'add',
        path: compileJSONPointer(parentPath.concat(newProp)),
        value: entry.value
      }
    })
  }
}

/**
 * Insert values at the start of an Object or Array
 * @param {JSON} json
 * @param {Path} parentPath
 * @param {Array.<{name?: string, value: JSON}>} values
 * @return {Array}
 */
export function insertInside (json, parentPath, values) {
  const parent = getIn(json, parentPath)

  if (Array.isArray(parent)) {
    return insertBefore(json, parentPath.concat('0'), values)
  }
  else if (parent && typeof parent === 'object') {
    // TODO: refactor. path should be parent path
    return insertBefore(json, parentPath.concat('foobar'), values)
  }
  else {
    throw new Error('Cannot insert in a value, only in an Object or Array')
  }
}

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Selection} selection
 * @param {Array.<{name?: string, value: JSON}>} values
 * @return {Array}
 */
export function replace (json, selection, values) {  // TODO: find a better name and define datastructure for values
  const rootPath = findRootPath(selection)
  const root = getIn(json, rootPath)

  if (Array.isArray(root)) {
    const paths = pathsFromSelection(json, selection)
    const firstPath = first(paths)
    const offset = firstPath ? parseInt(last(firstPath), 10) : 0

    const removeActions = removeAll(paths)
    const insertActions = values.map((entry, index) => ({
      op: 'add',
      path: compileJSONPointer(rootPath.concat(index + offset)),
      value: entry.value
    }))

    return removeActions.concat(insertActions)
  }
  else { // root is Object
    const removeActions = removeAll(pathsFromSelection(json, selection))
    const insertActions = values.map(entry => {
      const newProp = findUniqueName(entry.name, root)
      return {
        op: 'add',
        path: compileJSONPointer(rootPath.concat(newProp)),
        value: entry.value
      }
    })

    return removeActions.concat(insertActions)
  }
}

/**
 * Create a JSONPatch for an append action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path} parentPath
 * @param {ESONType} type
 * @return {Array}
 */
export function append (json, parentPath, type) {
  // console.log('append', parentPath, value)

  const parent = getIn(json, parentPath)
  const value = createEntry(type)

  if (Array.isArray(parent)) {
    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat('-')),
      value
    }]
  }
  else { // 'object'
    const newProp = findUniqueName('', parent)

    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat(newProp)),
      value
    }]
  }
}

/**
 * Create a JSONPatch for a remove action
 * @param {Path} path
 * @return {ESONPatchDocument}
 */
export function remove (path) {
  return [{
    op: 'remove',
    path: compileJSONPointer(path)
  }]
}

/**
 * Create a JSONPatch for a multiple remove action
 * @param {Path[]} paths
 * @return {ESONPatchDocument}
 */
export function removeAll (paths) {
  return paths
      .map(path => ({
        op: 'remove',
        path: compileJSONPointer(path)
      }))
      .reverse() // reverse is needed for arrays: delete the last index first
}
// TODO: test removeAll

/**
 * Create a JSONPatch to order the items of an array or the properties of an object in ascending
 * or descending order. In case of ESON, this will maintain state of expanded items
 * @param {JSON} json
 * @param {Path} path
 * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
 * @return {Array}
 */
export function sort (json, path, order = null) {
  const compare = order === 'desc' ? compareDesc : compareAsc
  const reverseCompare = (a, b) => -compare(a, b)
  const object = getIn(json, path)

  if (Array.isArray(object)) {
    const createAction = ({item, fromIndex, toIndex}) => ({
      op: 'move',
      from: compileJSONPointer(path.concat(String(fromIndex))),
      path: compileJSONPointer(path.concat(String(toIndex)))
    })

    const actions = sortWithComparator(object, compare).map(createAction)

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && isEmpty(actions)) {
      return sortWithComparator(object, reverseCompare).map(createAction)
    }

    return actions
  }
  else { // object is an Object, we don't allow sorting properties
    return []
  }
}

/**
 * Sort an array with items using given comparator, and generate move actions
 * (json patch) to apply the ordering.
 *
 * @param {Array} items
 * @param {function (a, b)} comparator  Accepts to values,
 *                                      returns 1 when a is larger than b
 *                                      returns 0 when a is equal to b
 *                                      returns -1 when a is smaller than b
 * @return {Array.<{item: *, beforeItem: *, fromIndex: number, toIndex: number}>}
 *                Returns an array with move actions that need to be
 *                performed to order the items of the array.
 *                This can be turned into json-patch actions
 */
function sortWithComparator (items, comparator) {
  const orderedItems = items.slice()

  let moveActions = []
  for (let i = 0; i < orderedItems.length; i++) {
    let firstIndex = i
    for (let j = i; j < orderedItems.length; j++) {
      if (comparator(orderedItems[firstIndex], orderedItems[j]) > 0) {
        firstIndex = j
      }
    }

    if (i !== firstIndex) {
      const item = orderedItems[firstIndex]
      orderedItems.splice(firstIndex, 1)
      orderedItems.unshift(item)

      moveActions.push({
        item,
        fromIndex: firstIndex,
        toIndex: i
      })
    }
  }

  return moveActions
}

/**
 * Create a JSON entry
 * @param {ESONType} type
 * @return {Array | Object | string}
 */
export function createEntry (type) {
  if (type === 'array') {
    return []
  }
  else if (type === 'object') {
    return {}
  }
  else {
    return ''
  }
}

/**
 * Convert a JSON object into a different type. When possible, data is retained
 * @param {*} value
 * @param {ESONType} type
 * @return {*}
 */
export function convertType (value, type) {
  // convert contents from old value to new value where possible
  if (type === 'value') {
    if (typeof value === 'string') {
      return stringConvert(value)
    }
    else {
      return ''
    }
  }

  if (type === 'string') {
    if (!isObject(value) && !Array.isArray(value)) {
      return value + ''
    }
    else {
      return ''
    }
  }

  if (type === 'object') {
    let object = {}

    if (Array.isArray(value)) {
      value.forEach((item, index) => object[index] = item)
    }

    return object
  }

  if (type === 'array') {
    let array = []

    if (isObject(value)) {
      Object.keys(value).forEach(key => {
        array.push(value[key])
      })
    }

    return array
  }

  throw new Error(`Unknown type '${type}'`)
}
