/**
 * This file contains functions to act on a JSONData object.
 * All functions are pure and don't mutate the JSONData.
 */

import { setIn, updateIn, getIn, deleteIn } from './utils/immutabilityHelpers'
import { compareAsc, compareDesc } from './utils/arrayUtils'
import { isObject, stringConvert } from  './utils/typeUtils'
import { findUniqueName } from  './utils/stringUtils'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/isEqual'

// TODO: rewrite the functions into jsonpatch functions, including a function `patch`

const expandNever = function (path) {
  return false
}

/**
 * Change the value of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {*} value
 * @return {JSONData}
 */
export function changeValue (data, path, value) {
  // console.log('changeValue', data, value)

  const dataPath = toDataPath(data, path)

  return setIn(data, dataPath.concat('value'), value)
}

/**
 * Change a property name
 * @param {JSONData} data
 * @param {Path} path
 * @param {string} oldProp
 * @param {string} newProp
 * @return {JSONData}
 */
export function changeProperty (data, path, oldProp, newProp) {
  // console.log('changeProperty', path, oldProp, newProp)

  if (oldProp === newProp) {
    return data
  }

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)
  const index = object.props.findIndex(p => p.name === oldProp)

  // prevent duplicate property names
  const uniqueNewProp = findUniqueName(newProp, object.props.map(p => p.name))

  return setIn(data, dataPath.concat(['props', index, 'name']), uniqueNewProp)
}

/**
 * Change the type of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONDataType} type
 * @return {JSONData}
 */
export function changeType (data, path, type) {
  // console.log('changeType', path, type)

  const dataPath = toDataPath(data, path)
  const oldEntry = getIn(data, dataPath)
  const newEntry = convertDataType(oldEntry, type)

  return setIn(data, dataPath, newEntry)
}

/**
 * Insert a new item after specified property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {string | number} afterProp
 * @param {JSONDataType} type
 * @return {JSONData}
 */
// TODO: remove function insertAfter, create insert(data, path, value, afterProp) instead
export function insertAfter (data, path, afterProp, type) {
  // console.log('insertAfter', path, afterProp, type)

  const dataPath = toDataPath(data, path)
  const parent = getIn(data, dataPath)

  if (parent.type === 'array') {
    return updateIn(data, dataPath.concat('items'), (items) => {
      const index = parseInt(afterProp)
      const updatedItems = items.slice(0)

      updatedItems.splice(index + 1, 0, createDataEntry(type))

      return updatedItems
    })
  }
  else { // parent.type === 'object'
    return updateIn(data, dataPath.concat('props'), (props) => {
      const index = props.findIndex(p => p.name === afterProp)
      const updatedProps = props.slice(0)

      updatedProps.splice(index + 1, 0, {
        name: '',
        value: createDataEntry(type)
      })

      return updatedProps
    })
  }
}

/**
 * Append a new item at the end of an object or array
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONDataType} type
 * @return {JSONData}
 */
// TODO: remove append, use add instead
export function append (data, path, type) {
  // console.log('append', path, type)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  if (object.type === 'array') {
    return updateIn(data, dataPath.concat('items'), (items) => {
      const updatedItems = items.slice(0)

      updatedItems.push(createDataEntry(type))

      return updatedItems
    })
  }
  else { // object.type === 'object'
    return updateIn(data, dataPath.concat('props'), (props) => {
      const updatedProps = props.slice(0)

      updatedProps.push({
        name: '',
        value: createDataEntry(type)
      })

      return updatedProps
    })
  }
}

/**
 * Replace an existing item
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONData} value
 * @return {{data: JSONData, revert: Object}}
 */
export function replace (data, path, value) {
  const dataPath = toDataPath(data, path)
  const oldValue = dataToJson(getIn(data, dataPath))

  return {
    data: setIn(data, dataPath, value),
    revert: {
      op: 'replace',
      path: compileJSONPointer(path),
      value: oldValue
    }
  }
}

/**
 * Duplicate a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {string | number} prop
 * @return {JSONData}
 */
// TODO: remove this function, use copy
export function duplicate (data, path, prop) {
  // console.log('duplicate', path, prop)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  if (object.type === 'array') {
    return updateIn(data, dataPath.concat('items'), (items) => {
      const index = parseInt(prop)
      const updatedItems = items.slice(0)
      const original = items[index]
      const duplicate = cloneDeep(original)

      updatedItems.splice(index + 1, 0, duplicate)

      return updatedItems
    })
  }
  else { // object.type === 'object'
    return updateIn(data, dataPath.concat('props'), (props) => {
      const index = props.findIndex(p => p.name === prop)
      const updated = props.slice(0)
      const original = props[index]
      const clone = cloneDeep(original)

      // prevent duplicate property names
      clone.name = findUniqueName(clone.name, props.map(p => p.name))

      updated.splice(index + 1, 0, clone)

      return updated
    })
  }
}

/**
 * Remove an item or property
 * @param {JSONData} data
 * @param {string} path
 * @return {{data: JSONData, revert: Object}}
 */
export function remove (data, path) {
  // console.log('remove', path)
  const _path = parseJSONPointer(path)

  const parentPath = _path.slice(0, _path.length - 1)
  const parent = getIn(data, toDataPath(data, parentPath))
  const value = dataToJson(getIn(data, toDataPath(data, _path)))

  if (parent.type === 'array') {
    const dataPath = toDataPath(data, _path)

    return {
      data: deleteIn(data, dataPath),
      revert: {op: 'add', path, value}
    }
  }
  else { // object.type === 'object'
    const dataPath = toDataPath(data, _path)

    dataPath.pop()  // remove the 'value' property, we want to remove the whole object property
    return {
      data: deleteIn(data, dataPath),
      revert: {op: 'add', path, value}
    }
  }
}

/**
 * Order the items of an array or the properties of an object in ascending
 * or descending order
 * @param {JSONData} data
 * @param {Path} path
 * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
 * @return {JSONData}
 */
export function sort (data, path, order = null) {
  // console.log('sort', path, order)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  let _order
  if (order === 'asc' || order === 'desc') {
    _order = order
  }
  else {
    // toggle previous order
    _order = object.order !== 'asc' ? 'asc' : 'desc'

    data = setIn(data, dataPath.concat(['order']), _order)
  }

  if (object.type === 'array') {
    return updateIn(data, dataPath.concat(['items']), (items) =>{
      const ordered = items.slice(0)
      const compare = _order === 'desc' ? compareDesc : compareAsc

      ordered.sort((a, b) => compare(a.value, b.value))

      return ordered
    })
  }
  else { // object.type === 'object'
    return updateIn(data, dataPath.concat(['props']), (props) => {
      const orderedProps = props.slice(0)
      const compare = _order === 'desc' ? compareDesc : compareAsc

      orderedProps.sort((a, b) => compare(a.name, b.name))

      return orderedProps
    })
  }
}

/**
 * Expand or collapse one or multiple items or properties
 * @param {JSONData} data
 * @param {function(path: Path) : boolean | Path} callback
 *              When a path, the object/array at this path will be expanded/collapsed
 *              When a function, all objects and arrays for which callback
 *              returns true will be expanded/collapsed
 * @param {boolean} expanded  New expanded state: true to expand, false to collapse
 * @return {JSONData}
 */
export function expand (data, callback, expanded) {
  // console.log('expand', callback, expand)

  if (typeof callback === 'function') {
    return expandRecursive(data, [], callback, expanded)
  }
  else if (Array.isArray(callback)) {
    const dataPath = toDataPath(data, callback)

    return setIn(data, dataPath.concat(['expanded']), expanded)
  }
  else {
    throw new Error('Callback function or path expected')
  }
}

/**
 * Traverse the json data, change the expanded state of all items/properties for
 * which `callback` returns true
 * @param {JSONData} data
 * @param {Path} path
 * @param {function(path: Path)} callback
 *              All objects and arrays for which callback returns true will be
 *              expanded/collapsed
 * @param {boolean} expanded  New expanded state: true to expand, false to collapse
 * @return {*}
 */
function expandRecursive (data, path, callback, expanded) {
  switch (data.type) {
    case 'array': {
      let updatedData = callback(path)
          ? setIn(data, ['expanded'], expanded)
          : data
      let updatedItems = updatedData.items

      updatedData.items.forEach((item, index) => {
        updatedItems = setIn(updatedItems, [index],
            expandRecursive(item, path.concat(index), callback, expanded))
      })

      return setIn(updatedData, ['items'], updatedItems)
    }

    case 'object': {
      let updatedData = callback(path)
          ? setIn(data, ['expanded'], expanded)
          : data
      let updatedProps = updatedData.props

      updatedData.props.forEach((prop, index) => {
        updatedProps = setIn(updatedProps, [index, 'value'],
            expandRecursive(prop.value, path.concat(prop.name), callback, expanded))
      })

      return setIn(updatedData, ['props'], updatedProps)
    }

    default: // type 'string' or 'value'
      // don't do anything: a value can't be expanded, only arrays and objects can
      return data
  }
}


/**
 * Convert a path of a JSON object into a path in the corresponding data model
 * @param {JSONData} data
 * @param {Path} path
 * @return {Path} dataPath
 * @private
 */
export function toDataPath (data, path) {
  if (path.length === 0) {
    return []
  }

  let index
  if (data.type === 'array') {
    // index of an array
    index = path[0]

    return ['items', index].concat(toDataPath(data.items[index], path.slice(1)))
  }
  else {
    // object property. find the index of this property
    index = data.props.findIndex(prop => prop.name === path[0])

    return ['props', index, 'value'].concat(toDataPath(data.props[index].value, path.slice(1)))
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
  if (data.type === 'array') {
    // index of an array
    index = path[0]
    return pathExists(data.items[index], path.slice(1))
  }
  else {
    // object property. find the index of this property
    index = data.props.findIndex(prop => prop.name === path[0])
    const prop = data.props[index]

    return pathExists(prop && prop.value, path.slice(1))
  }
}

/**
 * Convert a JSON object into the internally used data model
 * @param {Path} path
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Path)} expand
 * @return {JSONData}
 */
// TODO: change signature to jsonToData(json, expand=(path) => false, path=[])
export function jsonToData (path, json, expand) {
  if (Array.isArray(json)) {
    return {
      type: 'array',
      expanded: expand(path),
      items: json.map((child, index) => jsonToData(path.concat(index), child, expand))
    }
  }
  else if (isObject(json)) {
    return {
      type: 'object',
      expanded: expand(path),
      props: Object.keys(json).map(name => {
        return {
          name,
          value: jsonToData(path.concat(name), json[name], expand)
        }
      })
    }
  }
  else {
    return {
      type: 'value',
      value: json
    }
  }
}

/**
 * Convert the internal data model to a regular JSON object
 * @param {JSONData} data
 * @return {Object | Array | string | number | boolean | null} json
 */
export function dataToJson (data) {
  switch (data.type) {
    case 'array':
      return data.items.map(dataToJson)

    case 'object':
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
 * @param {JSONData} data
 * @param {string} path
 * @param {JSONData} value
 * @return {{data: JSONData, revert: Object}}
 * @private
 */
function add (data, path, value) {
  const _path = parseJSONPointer(path)

  const parentPath = _path.slice(0, _path.length - 1)
  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)
  const resolvedPath = resolvePathIndex(data, _path)
  const prop = resolvedPath[resolvedPath.length - 1]

  // FIXME: should not be needed to do try/catch. Create a function exists(data, path), or rewrite toDataPath such that you don't need to pass data
  let oldValue = undefined
  try {
    oldValue = getIn(data, toDataPath(data, resolvedPath))
  }
  catch (err) {}

  let updatedData
  if (parent.type === 'array') {
    // TODO: create an immutable helper function to insert an item in an Array
    updatedData = updateIn(data, dataPath.concat('items'), (items) => {
      const index = parseInt(prop)
      const updatedItems = items.slice(0)

      updatedItems.splice(index, 0, value)

      return updatedItems
    })
  }
  else { // parent.type === 'object'
    // TODO: create an immutable helper function to append an item to an Array
    updatedData = updateIn(data, dataPath.concat('props'), (props) => {
      const newProp = {
        name: prop,
        value
      }
      return props.concat(newProp)
    })
  }

  return {
    data: updatedData,
    revert: (parent.type === 'object' && oldValue !== undefined)
        ? {op: 'replace', path: compileJSONPointer(resolvedPath), value: dataToJson(oldValue)}
        : {op: 'remove', path: compileJSONPointer(resolvedPath)}
  }
}

/**
 * Copy a value
 * @param {JSONData} data
 * @param {string} path
 * @param {string} from
 * @return {{data: JSONData, revert: Object}}
 * @private
 */
// TODO: add an optional parameter `beforeProp` or `afterProp`
export function copy (data, path, from) {
  const value = getIn(data, toDataPath(data, parseJSONPointer(from)))

  return add(data, path, value)
}

/**
 * Move a value
 * @param {JSONData} data
 * @param {string} path
 * @param {string} from
 * @return {{data: JSONData, revert: Object}}
 * @private
 */
export function move (data, path, from) {
  if (path !== from) {
    const value = getIn(data, toDataPath(data, parseJSONPointer(from)))

    const result1 = remove(data, from)
    let updatedData = result1.data

    const result2 = add(updatedData, path, value)
    updatedData = result2.data

    if (result2.revert.op === 'replace') {
      return {
        data: updatedData,
        revert: [
          {op: 'move', from: path, path: from},
          {op: 'add', path, value: result2.revert.value}
        ]
      }
    }
    else { // result2.revert.op === 'remove'
      return {
        data: updatedData,
        revert: [
          {op: 'move', from: path, path: from}
        ]
      }
    }
  }
  else {
    // nothing to do
    return {
      data,
      revert: []
    }
  }
}

/**
 * Test whether the data contains the provided value at the specified path.
 * Throws an error when the test fails.
 * @param {JSONData} data
 * @param {string} path
 * @param {*} value
 */
export function test (data, path, value) {
  const _path = parseJSONPointer(path)
  const actualValue = getIn(data, toDataPath(data, _path))

  if (value === undefined) {
    throw new Error('Test failed, no value provided')
  }

  if (actualValue === undefined) {
    throw new Error('Test failed, path not found')
  }

  if (!isEqual(dataToJson(actualValue), value)) {
    throw new Error('Test failed, value differs')
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

    if (parent.type === 'array') {
      const index = parent.items.length
      const resolvedPath = path.slice(0)
      resolvedPath[resolvedPath.length - 1] = index

      return resolvedPath
    }
  }

  return path
}

/**
 * Apply a patch to a JSONData object
 * @param {JSONData} data
 * @param {Array} patch    A JSON patch
 * @return {{data: JSONData, revert: Array.<Object>, error: Error | null}}
 */
export function patchData (data, patch) {
  const expand = expandNever   // TODO: customizable expand function

  try {
    let updatedData = data
    let revert = []

    patch.forEach(function (action) {
      switch (action.op) {
        case 'add': {
          const path = parseJSONPointer(action.path)
          const value = jsonToData(path, action.value, expand)

          const result = add(updatedData, action.path, value)
          updatedData = result.data
          revert.unshift(result.revert)

          break
        }

        case 'remove': {
          const result = remove(updatedData, action.path)
          updatedData = result.data
          revert.unshift(result.revert)

          break
        }

        case 'replace': {
          const path = parseJSONPointer(action.path)
          const newValue = jsonToData(path, action.value, expand)

          const result = replace(updatedData, path, newValue)
          updatedData = result.data
          revert.unshift(result.revert)

          break
        }

        case 'copy': {
          const result = copy(updatedData, action.path, action.from)
          updatedData = result.data
          revert.unshift(result.revert)

          break
        }

        case 'move': {
          const result = move(updatedData, action.path, action.from)
          updatedData = result.data
          revert = result.revert.concat(revert)

          break
        }

        case 'test': {
          test(updatedData, action.path, action.value)

          break
        }

        default: {
          throw new Error('Unknown jsonpatch op ' + JSON.stringify(action.op))
        }
      }
    })

    return {
      data: updatedData,
      revert,
      error: null
    }
  }
  catch (error) {
    return {data, revert: [], error}
  }
}

/**
 * Create a new data entry
 * @param {JSONDataType} [type='value']
 * @return {JSONData}
 */
export function createDataEntry (type) {
  if (type === 'array') {
    return {
      type,
      expanded: true,
      items: []
    }
  }
  else if (type === 'object') {
    return {
      type,
      expanded: true,
      props: []
    }
  }
  else {
    return {
      type,
      value: ''
    }
  }
}

/**
 * Convert a JSONData object into a different type. When possible, data is retained
 * @param {JSONData} data
 * @param {JSONDataType} type
 * @return {JSONData}
 */
export function convertDataType (data, type) {
  const convertedEntry = createDataEntry(type)

  // convert contents from old value to new value where possible
  if (type === 'value' && data.type === 'string') {
    convertedEntry.value = stringConvert(data.value)
  }

  if (type === 'string' && data.type === 'value') {
    convertedEntry.value = data.value + ''
  }

  if (type === 'object' && data.type === 'array') {
    convertedEntry.props = data.items.map((item, index) => {
      return {
        name: index + '',
        value: item
      }
    })
  }

  if (type === 'array' && data.type === 'object') {
    convertedEntry.items = data.props.map(prop => prop.value)
  }

  return convertedEntry
}

/**
 * Parse a JSON Pointer
 * WARNING: this is not a complete string implementation
 * @param {string} pointer
 * @return {Array}
 */
export function parseJSONPointer (pointer) {
  const path = pointer.split('/')
  path.shift() // remove the first empty entry

  return path.map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'))
}

/**
 * Compile a JSON Pointer
 * WARNING: this is not a complete string implementation
 * @param {Path} path
 * @return {string}
 */
export function compileJSONPointer (path) {
  return '/' + path
      .map(p => {
        return typeof p === 'string'  // TODO: remove this check when the path is all strings
            ? p.replace(/~/g, '~0').replace(/\//g, '~1')
            : p
      })
      .join('/')
}
