import last from 'lodash/last'
import initial from 'lodash/initial'
import {
  META,
  compileJSONPointer, esonToJson, findNextProp,
  pathsFromSelection, findRootPath, findSelectionIndices
} from './eson'
import { cloneWithSymbols, getIn, setIn } from './utils/immutabilityHelpers'
import { findUniqueName } from  './utils/stringUtils'
import { isObject, stringConvert } from  './utils/typeUtils'
import { compareAsc, compareDesc, strictShallowEqual } from './utils/arrayUtils'


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
 * @param {Array.<{name?: string, value: JSONType, type?: ESONType}>} values
 * @return {Array}
 */
export function insertBefore (eson, path, values) {  // TODO: find a better name and define datastructure for values
  const parentPath = initial(path)
  const parent = getIn(eson, parentPath)

  if (parent[META].type === 'Array') {
    const startIndex = parseInt(last(path))
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
 * @param {Array.<{name?: string, value: JSONType, type?: ESONType}>} values
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
        type: entry.type
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
          type: entry.type,
          before
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
  // console.log('sort', path, order)

  const compare = order === 'desc' ? compareDesc : compareAsc
  const object = getIn(eson, path)

  if (object[META].type === 'Array') {
    const orderedItems = cloneWithSymbols(object)

    // order the items by value
    orderedItems.sort((a, b) => compare(a[META].value, b[META].value))

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && strictShallowEqual(object, orderedItems)) {
      orderedItems.reverse()
    }

    // TODO: refactor into a set of move actions, so we keep eson state of the items

    return [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: esonToJson(orderedItems)
    }]
  }
  else { // object[META].type === 'Object'

    // order the properties by key
    const orderedProps = object[META].props.slice().sort(compare)

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && strictShallowEqual(object[META].props, orderedProps)) {
      orderedProps.reverse()
    }

    const orderedObject = cloneWithSymbols(object)
    orderedObject[META] = setIn(object[META], ['props'], orderedProps)

    // TODO: refactor into a set of move actions, so we keep eson state of the items

    return [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: esonToJson(orderedObject),
      meta: {
        order: orderedProps // TODO: order isn't used right now in patchEson.
      }
    }]
  }
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
