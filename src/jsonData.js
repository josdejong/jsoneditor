/**
 * This file contains functions to act on a JSONData object.
 * All functions are pure and don't mutate the JSONData.
 */

import { setIn, updateIn, getIn, deleteIn } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import isEqual from 'lodash/isEqual'

const expandAll = function (path) {
  return true
}

// TODO: double check whether all patch functions handle each of the
// extra properties in .jsoneditor: `before`, `type`, `order`

/**
 * Convert a JSON object into the internally used data model
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Path)} [expand]
 * @param {Path} [path=[]]
 * @return {JSONData}
 */
export function jsonToData (json, expand = expandAll, path = []) {
  if (Array.isArray(json)) {
    return {
      type: 'Array',
      expanded: expand(path),
      items: json.map((child, index) => jsonToData(child, expand, path.concat(index)))
    }
  }
  else if (isObject(json)) {
    return {
      type: 'Object',
      expanded: expand(path),
      props: Object.keys(json).map(name => {
        return {
          name,
          value: jsonToData(json[name], expand, path.concat(name))
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
    case 'Array':
      return data.items.map(dataToJson)

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
export function toDataPath (data, path) {
  if (path.length === 0) {
    return []
  }

  let index
  if (data.type === 'Array') {
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
 * Apply a patch to a JSONData object
 * @param {JSONData} data
 * @param {Array} patch    A JSON patch
 * @return {{data: JSONData, revert: Array.<Object>, error: Error | null}}
 */
export function patchData (data, patch) {
  const expand = expandAll   // TODO: customizable expand function

  try {
    let updatedData = data
    let revert = []

    patch.forEach(function (action) {
      const options = action.jsoneditor

      switch (action.op) {
        case 'add': {
          const path = parseJSONPointer(action.path)
          const newValue = jsonToData(action.value, expand, path)

          // TODO: move setting type to jsonToData
          if (options && options.type) {
            // insert with type 'string' or 'value'
            newValue.type = options.type
          }
          // TODO: handle options.order

          const result = add(updatedData, action.path, newValue, options)
          updatedData = result.data
          revert = result.revert.concat(revert)

          break
        }

        case 'remove': {
          const result = remove(updatedData, action.path)
          updatedData = result.data
          revert = result.revert.concat(revert)

          break
        }

        case 'replace': {
          const path = parseJSONPointer(action.path)
          let newValue = jsonToData(action.value, expand, path)

          // TODO: move setting type to jsonToData
          if (options && options.type) {
            // insert with type 'string' or 'value'
            newValue.type = options.type
          }
          // TODO: handle options.order

          const result = replace(updatedData, path, newValue)
          updatedData = result.data
          revert = result.revert.concat(revert)

          break
        }

        case 'copy': {
          const result = copy(updatedData, action.path, action.from, options)
          updatedData = result.data
          revert = result.revert.concat(revert)

          break
        }

        case 'move': {
          const result = move(updatedData, action.path, action.from, options)
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

    // TODO: Simplify revert when possible:
    //       when a previous action takes place on the same path, remove the first

    return {
      data: updatedData,
      revert: simplifyPatch(revert),
      error: null
    }
  }
  catch (error) {
    return {data, revert: [], error}
  }
}

/**
 * Replace an existing item
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONData} value
 * @return {{data: JSONData, revert: JSONPatch}}
 */
export function replace (data, path, value) {
  const dataPath = toDataPath(data, path)
  const oldValue = getIn(data, dataPath)

  return {
    // FIXME: keep the expanded state where possible
    data: setIn(data, dataPath, value),
    revert: [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: dataToJson(oldValue),
      jsoneditor: {
        type: oldValue.type
      }
    }]
  }
}

/**
 * Remove an item or property
 * @param {JSONData} data
 * @param {string} path
 * @return {{data: JSONData, revert: JSONPatch}}
 */
export function remove (data, path) {
  // console.log('remove', path)
  const pathArray = parseJSONPointer(path)

  const parentPath = pathArray.slice(0, pathArray.length - 1)
  const parent = getIn(data, toDataPath(data, parentPath))
  const dataValue = getIn(data, toDataPath(data, pathArray))
  const value = dataToJson(dataValue)

  if (parent.type === 'Array') {
    const dataPath = toDataPath(data, pathArray)

    return {
      data: deleteIn(data, dataPath),
      revert: [{
        op: 'add',
        path,
        value,
        jsoneditor: {
          type: dataValue.type
        }
      }]
    }
  }
  else { // object.type === 'Object'
    const dataPath = toDataPath(data, pathArray)
    const prop = pathArray[pathArray.length - 1]

    dataPath.pop()  // remove the 'value' property, we want to remove the whole object property
    return {
      data: deleteIn(data, dataPath),
      revert: [{
        op: 'add',
        path,
        value,
        jsoneditor: {
          type: dataValue.type,
          before: findNextProp(parent, prop)
        }
      }]
    }
  }
}

/**
 * Remove redundant actions from a JSONPatch array.
 * Actions are redundant when they are followed by an action
 * acting on the same path.
 * @param {JSONPatch} patch
 * @return {Array}
 */
export function simplifyPatch(patch) {
  const simplifiedPatch = []
  const paths = {}

  // loop over the patch from last to first
  for (var i = patch.length - 1; i >= 0; i--) {
    const action = patch[i]
    if (action.op === 'test') {
      // ignore test actions
      simplifiedPatch.unshift(action)
    }
    else {
      // test whether this path was already used
      // if not, add this action to the simplified patch
      if (paths[action.path] === undefined) {
        paths[action.path] = true
        simplifiedPatch.unshift(action)
      }
    }
  }

  return simplifiedPatch
}


/**
 * @param {JSONData} data
 * @param {string} path
 * @param {JSONData} value
 * @param {{before?: string}} [options]
 * @return {{data: JSONData, revert: JSONPatch}}
 * @private
 */
export function add (data, path, value, options) {
  const pathArray = parseJSONPointer(path)

  const parentPath = pathArray.slice(0, pathArray.length - 1)
  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)
  const resolvedPath = resolvePathIndex(data, pathArray)
  const prop = resolvedPath[resolvedPath.length - 1]

  // FIXME: should not be needed to do try/catch. Create a function exists(data, path), or rewrite toDataPath such that you don't need to pass data
  let oldValue = undefined
  try {
    oldValue = getIn(data, toDataPath(data, resolvedPath))
  }
  catch (err) {}

  let updatedData
  if (parent.type === 'Array') {
    // TODO: create an immutable helper function to insert an item in an Array
    updatedData = updateIn(data, dataPath.concat('items'), (items) => {
      const index = parseInt(prop)
      const updatedItems = items.slice(0)

      updatedItems.splice(index, 0, value)

      return updatedItems
    })
  }
  else { // parent.type === 'Object'
    // TODO: create an immutable helper function to append an item to an Array
    updatedData = updateIn(data, dataPath.concat('props'), (props) => {
      const newProp = { name: prop, value }

      if (!options || typeof options.before !== 'string') {
        // append
        return props.concat(newProp)
      }
      else {
        // insert after prop
        const updatedProps = props.slice(0)
        const index = props.findIndex(p => p.name === options.before)
        updatedProps.splice(index, 0, newProp)
        return updatedProps
      }
    })
  }

  if (parent.type === 'Object' && oldValue !== undefined) {
    return {
      data: updatedData,
      revert: [{
        op: 'replace',
        path: compileJSONPointer(resolvedPath),
        value: dataToJson(oldValue),
        jsoneditor: {
          type: oldValue.type
        }
      }]
    }
  }
  else {
    return {
      data: updatedData,
      revert: [{
        op: 'remove',
        path: compileJSONPointer(resolvedPath)
      }]
    }
  }
}

/**
 * Copy a value
 * @param {JSONData} data
 * @param {string} path
 * @param {string} from
 * @param {{before?: string}} [options]
 * @return {{data: JSONData, revert: JSONPatch}}
 * @private
 */
export function copy (data, path, from, options) {
  const value = getIn(data, toDataPath(data, parseJSONPointer(from)))

  return add(data, path, value, options)
}

/**
 * Move a value
 * @param {JSONData} data
 * @param {string} path
 * @param {string} from
 * @param {{before?: string}} [options]
 * @return {{data: JSONData, revert: JSONPatch}}
 * @private
 */
export function move (data, path, from, options) {
  const dataValue = getIn(data, toDataPath(data, parseJSONPointer(from)))

  const result1 = remove(data, from)
  const result2 = add(result1.data, path, dataValue, options)

  if (result2.revert[0].op === 'replace') {
    return {
      data: result2.data,
      revert: [
        { op: 'move', from: path, path: from },
        {
          op: 'add',
          path,
          value: result2.revert[0].value,
          jsoneditor: result2.revert[0].jsoneditor
        }
      ]
    }
  }
  else { // result2.revert[0].op === 'remove'
    return {
      data: result2.data,
      revert: [
        {op: 'move', from: path, path: from}
      ]
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
  const pathArray = parseJSONPointer(path)
  const actualValue = getIn(data, toDataPath(data, pathArray))

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
 * @private
 */
function expandRecursive (data, path, callback, expanded) {
  switch (data.type) {
    case 'Array': {
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

    case 'Object': {
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
export function findNextProp (parent, prop) {
  const index = parent.props.findIndex(p => p.name === prop)
  const next = parent.props[index + 1]

  return next && next.name || null
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
