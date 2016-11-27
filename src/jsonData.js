/**
 * This file contains functions to act on a JSONData object.
 * All functions are pure and don't mutate the JSONData.
 */

import { setIn, updateIn, getIn, deleteIn, insertAt } from './utils/immutabilityHelpers'
import { isObject } from  './utils/typeUtils'
import isEqual from 'lodash/isEqual'

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
export function jsonToData (json, expand = expandAll, path = [], type = 'value') {
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

  if (data.type === 'Array') {
    // index of an array
    const index = path[0]
    const item = data.items[index]
    if (!item) {
      throw new Error('Array item "' + index + '" not found')
    }

    return ['items', index].concat(toDataPath(item, path.slice(1)))
  }
  else {
    // object property. find the index of this property
    const index = findPropertyIndex(data, path[0])
    const prop = data.props[index]
    if (!prop) {
      throw new Error('Object property "' + path[0] + '" not found')
    }

    return ['props', index, 'value']
        .concat(toDataPath(prop && prop.value, path.slice(1)))
  }
}

/**
 * Apply a patch to a JSONData object
 * @param {JSONData} data
 * @param {Array} patch    A JSON patch
 * @param {function(path: Path)} [expand]  Optional function to determine
 *                                         what nodes must be expanded
 * @return {{data: JSONData, revert: Object[], error: Error | null}}
 */
export function patchData (data, patch, expand = expandAll) {
  let updatedData = data
  let revert = []

  for (let i = 0; i < patch.length; i++) {
    const action = patch[i]
    const options = action.jsoneditor

    switch (action.op) {
      case 'add': {
        const path = parseJSONPointer(action.path)
        const newValue = jsonToData(action.value, expand, path, options && options.type)
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
        const newValue = jsonToData(action.value, expand, path, options && options.type)
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
        // when a test fails, cancel the whole patch and return the error
        const error = test(updatedData, action.path, action.value)
        if (error) {
          return { data, revert: [], error}
        }

        break
      }

      default: {
        // unknown jsonpatch operation. Cancel the whole patch and return an error
        return {
          data,
          revert: [],
          error: new Error('Unknown jsonpatch op ' + JSON.stringify(action.op))
        }
      }
    }
  }

  // TODO: Simplify revert when possible:
  //       when a previous action takes place on the same path, remove the first
  return {
    data: updatedData,
    revert: simplifyPatch(revert),
    error: null
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

  let updatedData
  if (parent.type === 'Array') {
    updatedData = insertAt(data, dataPath.concat('items', prop), value)
  }
  else { // parent.type === 'Object'
    updatedData = updateIn(data, dataPath, (object) => {
      const newProp = { name: prop, value }
      const index = (options && typeof options.before === 'string')
          ? findPropertyIndex(object, options.before)  // insert before
          : object.props.length                        // append

      return insertAt(object, ['props', index], newProp)
    })
  }

  if (parent.type === 'Object' && pathExists(data, resolvedPath)) {
    const oldValue = getIn(data, toDataPath(data, resolvedPath))

    return {
      data: updatedData,
      revert: [{
        op: 'replace',
        path: compileJSONPointer(resolvedPath),
        value: dataToJson(oldValue),
        jsoneditor: { type: oldValue.type }
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
  const fromArray = parseJSONPointer(from)
  const dataValue = getIn(data, toDataPath(data, fromArray))

  const parentPath = fromArray.slice(0, fromArray.length - 1)
  const parent = getIn(data, toDataPath(data, parentPath))

  const result1 = remove(data, from)
  const result2 = add(result1.data, path, dataValue, options)

  const before = result1.revert[0].jsoneditor.before
  const beforeNeeded = (parent.type === 'Object' && before)

  if (result2.revert[0].op === 'replace') {
    const value = result2.revert[0].value
    const type = result2.revert[0].jsoneditor.type
    const options = beforeNeeded ? { type, before } : { type }

    return {
      data: result2.data,
      revert: [
        { op: 'move', from: path, path: from },
        { op: 'add', path, value, jsoneditor: options}
      ]
    }
  }
  else { // result2.revert[0].op === 'remove'
    return {
      data: result2.data,
      revert: beforeNeeded
          ? [{ op: 'move', from: path, path: from, jsoneditor: {before} }]
          : [{ op: 'move', from: path, path: from }]
    }
  }
}

/**
 * Test whether the data contains the provided value at the specified path.
 * Throws an error when the test fails.
 * @param {JSONData} data
 * @param {string} path
 * @param {*} value
 * @return {null | Error} Returns an error when the tests, returns null otherwise
 */
export function test (data, path, value) {
  if (value === undefined) {
    return new Error('Test failed, no value provided')
  }

  const pathArray = parseJSONPointer(path)
  if (!pathExists(data, pathArray)) {
    return new Error('Test failed, path not found')
  }

  const actualValue = getIn(data, toDataPath(data, pathArray))
  if (!isEqual(dataToJson(actualValue), value)) {
    return new Error('Test failed, value differs')
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
    return transform (data, function (value, path) {
      if (value.type === 'Array' || value.type === 'Object') {
        if (callback(path)) {
          return setIn(value, ['expanded'], expanded)
        }
      }

      return value
    })
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
 * Merge one or multiple errors (for example JSON schema errors)
 * into the data
 *
 * @param {JSONData} data
 * @param {JSONSchemaError[]} errors
 */
export function addErrors (data, errors) {
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
 *
 * @param {JSONData} data
 * @param {string} text
 * @return {SearchResult[]} Returns a list with search results
 */
export function search (data, text) {
  let results = []

  traverse(data, function (value, path) {
      // search in values
      if (value.type === 'value') {
        if (containsCaseInsensitive(value.value, text)) {
          results.push({
            dataPath: path,
            value: true
          })
        }
      }

      // search object property names
      if (value.type === 'Object') {
        value.props.forEach((prop) => {
          if (containsCaseInsensitive(prop.name, text)) {
            results.push({
              dataPath: path.concat(prop.name),
              property: true
            })
          }
        })
      }
  })

  return results
}

/**
 * Merge searchResults into the data
 *
 * @param {JSONData} data
 * @param {SearchResult[]} searchResults
 */
export function addSearchResults (data, searchResults) {
  let updatedData = data

  if (searchResults) {
    searchResults.forEach(function (searchResult) {
      if (searchResult.value) {
        const dataPath = toDataPath(data, searchResult.dataPath).concat('searchValue')
        updatedData = setIn(updatedData, dataPath, true)
      }
      if (searchResult.property) {
        const dataPath = toDataPath(data, searchResult.dataPath).concat('searchProperty')
        updatedData = setIn(updatedData, dataPath, true)
      }
    })
  }

  return updatedData
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
 * Recursively transform JSONData: a recursive "map" function
 * @param {JSONData} data
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 * @return {JSONData} Returns the transformed data
 */
export function transform (data, callback) {
  return recurseTransform (data, [], data, callback)
}

/**
 * Recursively transform JSONData
 * @param {JSONData} value
 * @param {Path} path
 * @param {JSONData | null} root    The root object, object at path=[]
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 * @return {JSONData} Returns the transformed data
 */
function recurseTransform (value, path, root, callback) {
  let updatedValue = callback(value, path, root)

  switch (value.type) {
    case 'Array': {
      let updatedItems = updatedValue.items

      updatedValue.items.forEach((item, index) => {
        const updatedItem = recurseTransform(item, path.concat(String(index)), root, callback)
        updatedItems = setIn(updatedItems, [index], updatedItem)
      })

      updatedValue = setIn(updatedValue, ['items'], updatedItems)

      break
    }

    case 'Object': {
      let updatedProps = updatedValue.props

      updatedValue.props.forEach((prop, index) => {
        const updatedItem = recurseTransform(prop.value, path.concat(prop.name), root, callback)
        updatedProps = setIn(updatedProps, [index, 'value'], updatedItem)
      })

      updatedValue = setIn(updatedValue, ['props'], updatedProps)

      break
    }

    default: // type 'string' or 'value'
      // no childs to traverse
  }

  return updatedValue
}

/**
 * Recursively loop over a JSONData object: a recursive "forEach" function.
 * @param {JSONData} data
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 */
export function traverse (data, callback) {
  return recurseTraverse (data, [], data, callback)
}

/**
 * Recursively traverse a JSONData object
 * @param {JSONData} value
 * @param {Path} path
 * @param {JSONData | null} root    The root object, object at path=[]
 * @param {function(value: JSONData, path: Path, root: JSONData)} callback
 */
function recurseTraverse (value, path, root, callback) {
  callback(value, path, root)

  switch (value.type) {
    case 'Array': {
      value.items.forEach((item, index) => {
        recurseTraverse(item, path.concat(String(index)), root, callback)
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
    return pathExists(data.items[index], path.slice(1))
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
export function findNextProp (parent, prop) {
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
export function findPropertyIndex (object, prop) {
  return object.props.findIndex(p => p.name === prop)
}

/**
 * Parse a JSON Pointer
 * WARNING: this is not a complete implementation
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
 * WARNING: this is not a complete implementation
 * @param {Path} path
 * @return {string}
 */
export function compileJSONPointer (path) {
  return path
      .map(p => '/' + String(p).replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('')
}
