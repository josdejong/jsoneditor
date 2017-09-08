import isEqual from 'lodash/isEqual'

import type {
  JSONData, Path,
  JSONPatch, JSONPatchAction, PatchOptions, JSONPatchResult
} from './types'
import { setIn, updateIn, getIn, deleteIn, insertAt } from './utils/immutabilityHelpers'
import { allButLast } from  './utils/arrayUtils'
import {
  jsonToData, dataToJson, toDataPath,
  parseJSONPointer, compileJSONPointer,
  expandAll, pathExists, resolvePathIndex, findPropertyIndex, findNextProp, getId
} from './jsonData'

/**
 * Apply a patch to a JSONData object
 * @param {JSONData} data
 * @param {Array} patch    A JSON patch
 * @param {function(path: Path)} [expand]  Optional function to determine
 *                                         what nodes must be expanded
 * @return {{data: JSONData, revert: Object[], error: Error | null}}
 */
export function patchData (data: JSONData, patch: JSONPatchAction[], expand = expandAll) {
  let updatedData = data
  let revert = []

  for (let i = 0; i < patch.length; i++) {
    const action = patch[i]
    const options = action.jsoneditor

    // TODO: check whether action.op and action.path exist

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
        if (!action.from) {
          return {
            data,
            revert: [],
            error: new Error('Property "from" expected in copy action ' + JSON.stringify(action))
          }
        }

        const result = copy(updatedData, action.path, action.from, options)
        updatedData = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'move': {
        if (!action.from) {
          return {
            data,
            revert: [],
            error: new Error('Property "from" expected in move action ' + JSON.stringify(action))
          }
        }

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
export function replace (data: JSONData, path: Path, value: JSONData) {
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
export function remove (data: JSONData, path: string) {
  // console.log('remove', path)
  const pathArray = parseJSONPointer(path)

  const parentPath = pathArray.slice(0, pathArray.length - 1)
  const parent = getIn(data, toDataPath(data, parentPath))
  const dataValue = getIn(data, toDataPath(data, pathArray))
  const value = dataToJson(dataValue)

  if (parent.type === 'Array') {
    const dataPath = toDataPath(data, pathArray)

    // remove the 'value' property, we want to remove the whole item from the items array
    dataPath.pop()

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

    // remove the 'value' property, we want to remove the whole object property from props
    dataPath.pop()

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
function simplifyPatch(patch: JSONPatch) {
  const simplifiedPatch = []
  const paths = {}

  // loop over the patch from last to first
  for (let i = patch.length - 1; i >= 0; i--) {
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
 * @param {number} [id]   Optional id for the new item
 * @return {{data: JSONData, revert: JSONPatch}}
 * @private
 */
export function add (data: JSONData, path: string, value: JSONData, options, id = getId()) {
  const pathArray = parseJSONPointer(path)
  const parentPath = pathArray.slice(0, pathArray.length - 1)
  const dataPath = toDataPath(data, parentPath)
  const parent = getIn(data, dataPath)
  const resolvedPath = resolvePathIndex(data, pathArray)
  const prop = resolvedPath[resolvedPath.length - 1]

  let updatedData
  if (parent.type === 'Array') {
    const newItem = {
      id, // TODO: create a unique id within current id's instead of using a global, ever incrementing id
      value
    }
    updatedData = insertAt(data, dataPath.concat('items', prop), newItem)
  }
  else { // parent.type === 'Object'
    updatedData = updateIn(data, dataPath, (object) => {
      const existingIndex = findPropertyIndex(object, prop)
      if (existingIndex !== -1) {
        // replace existing item
        return setIn(object, ['props', existingIndex, 'value'], value)
      }
      else {
        // insert new item
        const newProp = { id, name: prop, value }
        const index = (options && typeof options.before === 'string')
            ? findPropertyIndex(object, options.before)  // insert before
            : object.props.length                        // append

        return insertAt(object, ['props', index], newProp)
      }
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
export function copy (data: JSONData, path: string, from: string, options) {
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
export function move (data: JSONData, path: string, from: string, options) {
  const fromArray = parseJSONPointer(from)
  const prop = getIn(data, allButLast(toDataPath(data, fromArray)))
  const dataValue = prop.value
  const id = prop.id // we want to use the existing id in case the move is a renaming a property
  // FIXME: only reuse the existing id when move is renaming a property in the same object

  const parentPathFrom = allButLast(fromArray)
  const parent = getIn(data, toDataPath(data, parentPathFrom))

  const result1 = remove(data, from)
  const result2 = add(result1.data, path, dataValue, options, id)
  // FIXME: passing id as parameter is ugly, make that redundant (use replace instead of remove/add? (that would give less predictive output :( ))

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
export function test (data: JSONData, path: string, value: any) {
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
