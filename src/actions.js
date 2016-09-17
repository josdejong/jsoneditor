import { compileJSONPointer, toDataPath, dataToJson } from './jsonData'
import { findUniqueName } from  './utils/stringUtils'
import { getIn } from  './utils/immutabilityHelpers'
import { isObject, stringConvert } from  './utils/typeUtils'
import { compareAsc, compareDesc, strictShallowEqual } from './utils/arrayUtils'

/**
 * Create a JSONPatch to change the value of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {*} value
 * @return {Array}
 */
export function changeValue (data, path, value) {
  // console.log('changeValue', data, value)

  const dataPath = toDataPath(data, path)
  const oldDataValue = getIn(data, dataPath)

  let patch = [{
    op: 'replace',
    path: compileJSONPointer(path),
    value: value
  }]

  // when the old type is not something that can be detected from the
  // value itself, store the type information
  if(!isNativeType(oldDataValue.type)) {
    // it's a string
    patch[0].jsoneditor = {
      type: oldDataValue.type
    }
  }

  return patch
}

/**
 * Create a JSONPatch to change a property name
 * @param {JSONData} data
 * @param {Path} parentPath
 * @param {string} oldProp
 * @param {string} newProp
 * @return {Array}
 */
export function changeProperty (data, parentPath, oldProp, newProp) {
  // console.log('changeProperty', parentPath, oldProp, newProp)

  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)

  // find property after this one
  const index = parent.props.findIndex(p => p.name === oldProp)
  const next = parent.props[index + 1]
  const nextProp = next && next.name

  // prevent duplicate property names
  const uniqueNewProp = findUniqueName(newProp, parent.props.map(p => p.name))

  return [{
    op: 'move',
    from: compileJSONPointer(parentPath.concat(oldProp)),
    path: compileJSONPointer(parentPath.concat(uniqueNewProp)),
    jsoneditor: {
      before: nextProp
    }
  }]
}

/**
 * Create a JSONPatch to change the type of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONDataType} type
 * @return {Array}
 */
export function changeType (data, path, type) {

  const dataPath = toDataPath(data, path)
  const oldEntry = dataToJson(getIn(data, dataPath))
  const newEntry = convertType(oldEntry, type)

  console.log('changeType', path, type, oldEntry, newEntry)

  return [{
    op: 'replace',
    path: compileJSONPointer(path),
    value: newEntry,
    jsoneditor: { type } // TODO: send type only in case of 'string'
    // TODO: send some information to ensure the correct order of fields?
  }]
}

/**
 * Create a JSONPatch for a duplicate action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the duplicated node in case of duplicating
 * and object property
 *
 * @param {JSONData} data
 * @param {Path} path
 * @return {Array}
 */
export function duplicate (data, path) {
  // console.log('duplicate', path)

  const parentPath = path.slice(0, path.length - 1)

  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)

  if (parent.type === 'Array') {
    const index = parseInt(path[path.length - 1]) + 1
    return [{
      op: 'copy',
      from: compileJSONPointer(path),
      path: compileJSONPointer(parentPath.concat(index))
    }]
  }
  else { // object.type === 'Object'
    const afterProp = path[path.length - 1]
    const newProp = findUniqueName(afterProp, parent.props.map(p => p.name))

    return [{
      op: 'copy',
      from: compileJSONPointer(path),
      path: compileJSONPointer(parentPath.concat(newProp)),
      jsoneditor: { afterProp }
    }]
  }
}

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONDataType} type
 * @return {Array}
 */
export function insert (data, path, type) {
  // console.log('insert', path, type)

  const parentPath = path.slice(0, path.length - 1)
  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)
  const value = createEntry(type)

  if (parent.type === 'Array') {
    const index = parseInt(path[path.length - 1]) + 1
    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat(index + '')),
      value
    }]
  }
  else { // object.type === 'Object'
    const afterProp = path[path.length - 1]
    const newProp = findUniqueName('', parent.props.map(p => p.name))

    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat(newProp)),
      value,
      jsoneditor: { afterProp }
    }]
  }
}

/**
 * Create a JSONPatch for an append action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSONData} data
 * @param {Path} parentPath
 * @param {JSONDataType} type
 * @return {Array}
 */
export function append (data, parentPath, type) {
  // console.log('append', parentPath, value)

  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)
  const value = createEntry(type)

  if (parent.type === 'Array') {
    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat('-')),
      value
    }]
  }
  else { // object.type === 'Object'
    const newProp = findUniqueName('', parent.props.map(p => p.name))

    return [{
      op: 'add',
      path: compileJSONPointer(parentPath.concat(newProp)),
      value
    }]
  }
}

/**
 * Create a JSONPatch to order the items of an array or the properties of an object in ascending
 * or descending order
 * @param {JSONData} data
 * @param {Path} path
 * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
 * @return {Array}
 */
export function sort (data, path, order = null) {
  // console.log('sort', path, order)

  const compare = order === 'desc' ? compareDesc : compareAsc
  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  if (object.type === 'Array') {
    const orderedItems = object.items.slice(0)

    // order the items by value
    orderedItems.sort((a, b) => compare(a.value, b.value))

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && strictShallowEqual(object.items, orderedItems)) {
      orderedItems.reverse()
    }

    return [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: dataToJson({
        type: 'Array',
        items: orderedItems
      })
    }]
  }
  else { // object.type === 'Object'
    const orderedProps = object.props.slice(0)

    // order the properties by key
    orderedProps.sort((a, b) => compare(a.name, b.name))

    // when no order is provided, test whether ordering ascending
    // changed anything. If not, sort descending
    if (!order && strictShallowEqual(object.props, orderedProps)) {
      orderedProps.reverse()
    }

    return [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: dataToJson({
        type: 'Object',
        props: orderedProps
      }),
      jsoneditor: {
        order: orderedProps.map(prop => prop.name)
      }
    }]
  }
}

/**
 * Create a JSON entry
 * @param {JSONDataType} type
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
 * @param {JSONDataType} type
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

/**
 * Test whether a type is a native JSON type:
 * Native types are: Array, Object, or value
 * @param {JSONDataType} type
 * @return {boolean}
 */
export function isNativeType (type) {
  return type === 'Object' || type === 'Array' || type === 'value'
}
