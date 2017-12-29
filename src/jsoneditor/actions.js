import last from 'lodash/last'
import initial from 'lodash/initial'
import isEmpty from 'lodash/isEmpty'
import {
  META,
  compileJSONPointer, esonToJson, findNextProp,
  pathsFromSelection, findRootPath, findSelectionIndices
} from './eson'
import { getIn } from './utils/immutabilityHelpers'
import { findUniqueName } from  './utils/stringUtils'
import { isObject, stringConvert } from  './utils/typeUtils'
import { compareAsc, compareDesc } from './utils/arrayUtils'


/**
 * Create a JSONPatch to change the value of a property or item
 * @param {ESON} eson
 * @param {Path} path
 * @param {*} value
 * @return {Array}
 */
export function changeValue (eson, path, value) {
  // console.log('changeValue', data, value)
  const oldDataValue = getIn(eson, path)

  return [{
    op: 'replace',
    path: compileJSONPointer(path),
    value: value,
    meta: {
      type: oldDataValue[META].type
    }
  }]
}

/**
 * Create a JSONPatch to change a property name
 * @param {ESON} eson
 * @param {Path} parentPath
 * @param {string} oldProp
 * @param {string} newProp
 * @return {Array}
 */
export function changeProperty (eson, parentPath, oldProp, newProp) {
  // console.log('changeProperty', parentPath, oldProp, newProp)
  const parent = getIn(eson, parentPath)

  // prevent duplicate property names
  const uniqueNewProp = findUniqueName(newProp, parent[META].props)

  return [{
    op: 'move',
    from: compileJSONPointer(parentPath.concat(oldProp)),
    path: compileJSONPointer(parentPath.concat(uniqueNewProp)),
    meta: {
      before: findNextProp(parent, oldProp)
    }
  }]
}

/**
 * Create a JSONPatch to change the type of a property or item
 * @param {ESON} eson
 * @param {Path} path
 * @param {ESONType} type
 * @return {Array}
 */
export function changeType (eson, path, type) {
  const oldValue = esonToJson(getIn(eson, path))
  const newValue = convertType(oldValue, type)

  // console.log('changeType', path, type, oldValue, newValue)

  return [{
    op: 'replace',
    path: compileJSONPointer(path),
    value: newValue,
    meta: {
      type
    }
  }]
}

/**
 * Create a JSONPatch for a duplicate action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the duplicated node in case of duplicating
 * and object property
 *
 * @param {ESON} eson
 * @param {Selection} selection
 * @return {Array}
 */
export function duplicate (eson, selection) {
  // console.log('duplicate', path)
  if (!selection.start || !selection.end) {
    return []
  }

  const rootPath = findRootPath(selection)
  const root = getIn(eson, rootPath)
  const { maxIndex } = findSelectionIndices(root, rootPath, selection)
  const paths = pathsFromSelection(eson, selection)

  if (root[META].type === 'Array') {
    return paths.map((path, offset) => ({
      op: 'copy',
      from: compileJSONPointer(path),
      path: compileJSONPointer(rootPath.concat(maxIndex + offset))
    }))
  }
  else { // root[META].type === 'Object'
    const before = root[META].props[maxIndex] || null

    return paths.map(path => {
      const prop = last(path)
      const newProp = findUniqueName(prop, root[META].props)

      return {
        op: 'copy',
        from: compileJSONPointer(path),
        path: compileJSONPointer(rootPath.concat(newProp)),
        meta: {
          before
        }
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
 * @param {ESON} eson
 * @param {Path} path
 * @param {Array.<{name?: string, value: JSON, type?: ESONType}>} values
 * @return {Array}
 */
export function insertBefore (eson, path, values) {  // TODO: find a better name and define datastructure for values
  const parentPath = initial(path)
  const parent = getIn(eson, parentPath)

  if (parent[META].type === 'Array') {
    const startIndex = parseInt(last(path), 10)
    return values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(startIndex + offset)),
      value: entry.value,
      meta: {
        type: entry.type
      }
    }))
  }
  else { // parent[META].type === 'Object'
    const before = last(path)
    return values.map(entry => {
      const newProp = findUniqueName(entry.name, parent[META].props)
      return {
        op: 'add',
        path: compileJSONPointer(parentPath.concat(newProp)),
        value: entry.value,
        meta: {
          type: entry.type,
          before
        }
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
 * @param {ESON} eson
 * @param {Selection} selection
 * @param {Array.<{name?: string, value: JSON, state: Object}>} values
 * @return {Array}
 */
export function replace (eson, selection, values) {  // TODO: find a better name and define datastructure for values
  const rootPath = findRootPath(selection)
  const root = getIn(eson, rootPath)
  const { minIndex, maxIndex } = findSelectionIndices(root, rootPath, selection)

  if (root[META].type === 'Array') {
    const removeActions = removeAll(pathsFromSelection(eson, selection))
    const insertActions = values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(rootPath.concat(minIndex + offset)),
      value: entry.value,
      meta: {
        state: entry.state
      }
    }))

    return removeActions.concat(insertActions)
  }
  else { // root[META].type === 'Object'
    const before = root[META].props[maxIndex] || null

    const removeActions = removeAll(pathsFromSelection(eson, selection))
    const insertActions = values.map(entry => {
      const newProp = findUniqueName(entry.name, root[META].props)
      return {
        op: 'add',
        path: compileJSONPointer(rootPath.concat(newProp)),
        value: entry.value,
        meta: {
          before,
          state: entry.state
        }
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
 * @param {ESON} eson
 * @param {Path} parentPath
 * @param {ESONType} type
 * @return {Array}
 */
export function append (eson, parentPath, type) {
  // console.log('append', parentPath, value)

  const parent = getIn(eson, parentPath)
  const value = createEntry(type)

  if (parent[META].type === 'Array') {
    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat('-')),
      value,
      meta: {
        type
      }
    }]
  }
  else { // parent[META].type === 'Object'
    const newProp = findUniqueName('', parent[META].props)

    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat(newProp)),
      value,
      meta: {
        type
      }
    }]
  }
}

/**
 * Create a JSONPatch for a remove action
 * @param {Path} path
 * @return {ESONPatch}
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
 * @return {ESONPatch}
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
 * or descending order
 * @param {ESON} eson
 * @param {Path} path
 * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
 * @return {Array}
 */
export function sort (eson, path, order = null) {
  const compare = order === 'desc' ? compareDesc : compareAsc
  const reverseCompare = (a, b) => -compare(a, b)
  const object = getIn(eson, path)

  if (object[META].type === 'Array') {
    const items = object.map(item => item[META].value)
    const createAction = ({item, fromIndex, toIndex}) => ({
      op: 'move',
      from: compileJSONPointer(path.concat(String(fromIndex))),
      path: compileJSONPointer(path.concat(String(toIndex)))
    })

    const actions = sortWithComparator(items, compare).map(createAction)

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && isEmpty(actions)) {
      return sortWithComparator(items, reverseCompare).map(createAction)
    }

    return actions
  }
  else { // object[META].type === 'Object'

    const props = object[META].props
    const createAction = ({item, beforeItem, fromIndex, toIndex}) => ({
      op: 'move',
      from: compileJSONPointer(path.concat(item)),
      path: compileJSONPointer(path.concat(item)),
      meta: {
        before: beforeItem
      }
    })

    const actions = sortWithComparator(props, compare).map(createAction)

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && isEmpty(actions)) {
      return sortWithComparator(props, reverseCompare).map(createAction)
    }

    return actions
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
      const beforeItem = orderedItems[i]
      orderedItems.splice(firstIndex, 1)
      orderedItems.unshift(item)

      moveActions.push({
        item,
        fromIndex: firstIndex,
        toIndex: i,
        beforeItem
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
  if (type === 'Array') {
    return []
  }
  else if (type === 'Object') {
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

  if (type === 'Object') {
    let object = {}

    if (Array.isArray(value)) {
      value.forEach((item, index) => object[index] = item)
    }

    return object
  }

  if (type === 'Array') {
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
