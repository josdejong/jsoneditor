import isEqual from 'lodash/isEqual'
import initial from 'lodash/initial'
import last from 'lodash/last'

import type { ESON, Path, ESONPatch } from './types'
import { setIn, updateIn, getIn, insertAt } from './utils/immutabilityHelpers'
import {
  jsonToEson, esonToJson, toEsonPath,
  getInEson, setInEson, deleteInEson,
  parseJSONPointer, compileJSONPointer,
  expandAll, pathExists, resolvePathIndex, findPropertyIndex, findNextProp, createId
} from './eson'

/**
 * Apply a patch to a ESON object
 * @param {ESON} eson
 * @param {Array} patch    A JSON patch
 * @param {function(path: Path)} [expand]  Optional function to determine
 *                                         what nodes must be expanded
 * @return {{data: ESON, revert: Object[], error: Error | null}}
 */
export function patchEson (eson: ESON, patch: ESONPatch, expand = expandAll) {
  let updatedEson = eson
  let revert = []

  for (let i = 0; i < patch.length; i++) {
    const action = patch[i]
    const options = action.jsoneditor

    // TODO: check whether action.op and action.path exist

    switch (action.op) {
      case 'add': {
        const path = parseJSONPointer(action.path)
        const newValue = jsonToEson(action.value, expand, path, options && options.type)
        const result = add(updatedEson, action.path, newValue, options)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'remove': {
        const result = remove(updatedEson, action.path)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'replace': {
        const path = parseJSONPointer(action.path)
        const newValue = jsonToEson(action.value, expand, path, options && options.type)
        const result = replace(updatedEson, path, newValue)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'copy': {
        if (!action.from) {
          return {
            data: eson,
            revert: [],
            error: new Error('Property "from" expected in copy action ' + JSON.stringify(action))
          }
        }

        const result = copy(updatedEson, action.path, action.from, options)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'move': {
        if (!action.from) {
          return {
            data: eson,
            revert: [],
            error: new Error('Property "from" expected in move action ' + JSON.stringify(action))
          }
        }

        const result = move(updatedEson, action.path, action.from, options)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'test': {
        // when a test fails, cancel the whole patch and return the error
        const error = test(updatedEson, action.path, action.value)
        if (error) {
          return { data: eson, revert: [], error}
        }

        break
      }

      default: {
        // unknown ESONPatch operation. Cancel the whole patch and return an error
        return {
          data: eson,
          revert: [],
          error: new Error('Unknown ESONPatch op ' + JSON.stringify(action.op))
        }
      }
    }
  }

  return {
    data: updatedEson,
    revert,
    error: null
  }
}

/**
 * Replace an existing item
 * @param {ESON} data
 * @param {Path} path
 * @param {ESON} value
 * @return {{data: ESON, revert: ESONPatch}}
 */
export function replace (data: ESON, path: Path, value: ESON) {
  const oldValue = getInEson(data, path)

  return {
    data: setInEson(data, path, value),
    revert: [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: esonToJson(oldValue),
      jsoneditor: {
        type: oldValue.type
      }
    }]
  }
}

/**
 * Remove an item or property
 * @param {ESON} data
 * @param {string} path
 * @return {{data: ESON, revert: ESONPatch}}
 */
// FIXME: path should be a path instead of a string? (all functions in patchEson)
export function remove (data: ESON, path: string) {
  // console.log('remove', path)
  const pathArray = parseJSONPointer(path)

  const parentPath = initial(pathArray)
  const parent = getInEson(data, parentPath)
  const dataValue = getInEson(data, pathArray)
  const value = esonToJson(dataValue)

  if (parent.type === 'Array') {
    return {
      data: deleteInEson(data, pathArray),
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
    const prop = last(pathArray)

    return {
      data: deleteInEson(data, pathArray),
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
 * @param {ESON} data
 * @param {string} path
 * @param {ESON} value
 * @param {{before?: string}} [options]
 * @param {number} [id]   Optional id for the new item
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function add (data: ESON, path: string, value: ESON, options, id = createId()) {
  const pathArray = parseJSONPointer(path)
  const parentPath = pathArray.slice(0, pathArray.length - 1)
  const esonPath = toEsonPath(data, parentPath)
  const parent = getIn(data, esonPath)
  const resolvedPath = resolvePathIndex(data, pathArray)
  const prop = resolvedPath[resolvedPath.length - 1]

  let updatedEson
  if (parent.type === 'Array') {
    const newItem = {
      id, // TODO: create a unique id within current id's instead of using a global, ever incrementing id
      value
    }
    updatedEson = insertAt(data, esonPath.concat('items', prop), newItem)
  }
  else { // parent.type === 'Object'
    updatedEson = updateIn(data, esonPath, (object) => {
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
    const oldValue = getInEson(data, resolvedPath)

    return {
      data: updatedEson,
      revert: [{
        op: 'replace',
        path: compileJSONPointer(resolvedPath),
        value: esonToJson(oldValue),
        jsoneditor: { type: oldValue.type }
      }]
    }
  }
  else {
    return {
      data: updatedEson,
      revert: [{
        op: 'remove',
        path: compileJSONPointer(resolvedPath)
      }]
    }
  }
}

/**
 * Copy a value
 * @param {ESON} data
 * @param {string} path
 * @param {string} from
 * @param {{before?: string}} [options]
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function copy (data: ESON, path: string, from: string, options) {
  const value = getInEson(data, parseJSONPointer(from))

  return add(data, path, value, options)
}

/**
 * Move a value
 * @param {ESON} data
 * @param {string} path
 * @param {string} from
 * @param {{before?: string}} [options]
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function move (data: ESON, path: string, from: string, options) {
  const fromArray = parseJSONPointer(from)
  const prop = getIn(data, initial(toEsonPath(data, fromArray)))
  const dataValue = prop.value
  const id = prop.id // we want to use the existing id in case the move is a renaming a property
  // FIXME: only reuse the existing id when move is renaming a property in the same object

  const parentPathFrom = initial(fromArray)
  const parent = getInEson(data, parentPathFrom)

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
 * @param {ESON} data
 * @param {string} path
 * @param {*} value
 * @return {null | Error} Returns an error when the tests, returns null otherwise
 */
export function test (data: ESON, path: string, value: any) {
  if (value === undefined) {
    return new Error('Test failed, no value provided')
  }

  const pathArray = parseJSONPointer(path)
  if (!pathExists(data, pathArray)) {
    return new Error('Test failed, path not found')
  }

  const actualValue = getInEson(data, pathArray)
  if (!isEqual(esonToJson(actualValue), value)) {
    return new Error('Test failed, value differs')
  }
}
