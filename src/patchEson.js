import isEqual from 'lodash/isEqual'
import initial from 'lodash/initial'
import last from 'lodash/last'

import type { ESON, Path, ESONPatch } from './types'
import {
  setIn, updateIn, getIn, deleteIn, insertAt,
  cloneWithSymbols
} from './utils/immutabilityHelpers'
import {
  META,
  jsonToEson, esonToJson, updatePaths,
  parseJSONPointer, compileJSONPointer,
  expandAll, pathExists, resolvePathIndex, createId
} from './eson'

/**
 * Apply a patch to a ESON object
 * @param {ESON} eson
 * @param {Array} patch    A JSON patch
 * @param {function(path: Path)} [expand]  Optional function to determine
 *                                         what nodes must be expanded
 * @return {{data: ESON, revert: Object[], error: Error | null}}
 */
export function patchEson (eson, patch, expand = expandAll) {
  let updatedEson = eson
  let revert = []

  for (let i = 0; i < patch.length; i++) {
    const action = patch[i]
    const options = action.jsoneditor

    // TODO: check whether action.op and action.path exist

    switch (action.op) {
      case 'add': {
        const path = parseJSONPointer(action.path)
        const newValue = jsonToEson(action.value, path)
        // FIXME: apply expanded state
        // FIXME: apply options.type
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
        const newValue = jsonToEson(action.value, path)
        // FIXME: apply expanded state
        // FIXME: apply options.type
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
export function replace (data, path, value) {
  const oldValue = getIn(data, path)

  return {
    data: setIn(data, path, value),
    revert: [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: esonToJson(oldValue),
      jsoneditor: {
        type: oldValue[META].type
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
export function remove (data, path) {
  // console.log('remove', path)
  const pathArray = parseJSONPointer(path)

  const parentPath = initial(pathArray)
  const parent = getIn(data, parentPath)
  const dataValue = getIn(data, pathArray)
  const value = esonToJson(dataValue)

  if (parent[META].type === 'Array') {
    return {
      data: updatePaths(deleteIn(data, pathArray)),
      revert: [{
        op: 'add',
        path,
        value,
        jsoneditor: {
          type: dataValue[META].type
        }
      }]
    }
  }
  else { // parent[META].type === 'Object'
    const prop = last(pathArray)
    const index = parent[META].props.indexOf(prop)
    const nextProp = parent[META].props[index + 1] || null

    let updatedParent = deleteIn(parent, [prop])
    updatedParent[META] = deleteIn(parent[META], ['props', index], parent[META].props)

    return {
      data: setIn(data, parentPath, updatePaths(updatedParent, parentPath)),
      revert: [{
        op: 'add',
        path,
        value,
        jsoneditor: {
          type: dataValue[META].type,
          before: nextProp
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
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
// TODO: refactor path to an array with strings
export function add (data, path, value, options) {
  // FIXME: apply id to new created values
  const pathArray = parseJSONPointer(path)
  const parentPath = initial(pathArray)
  const parent = getIn(data, parentPath)
  const resolvedPath = resolvePathIndex(data, pathArray)
  const prop = last(resolvedPath)

  let updatedEson
  if (parent[META].type === 'Array') {
    updatedEson = updatePaths(insertAt(data, resolvedPath, value))
  }
  else { // parent[META].type === 'Object'
    updatedEson = updateIn(data, parentPath, (parent) => {
      const oldValue = getIn(data, pathArray)
      const props = parent[META].props
      const existingIndex = props.indexOf(prop)

      if (existingIndex !== -1) {
        // replace existing item
        // update path
        // FIXME: also update value's id
        let newValue = updatePaths(cloneWithSymbols(value), pathArray)
        newValue[META] = setIn(newValue[META], ['id'], oldValue[META].id)
        // console.log('copied id from existing value' + oldValue[META].id)

        return setIn(parent, [prop], newValue)
      }
      else {
        // insert new item
        const index = (options && typeof options.before === 'string')
            ? props.indexOf(options.before)  // insert before
            : props.length                   // append

        let updatedKeys = props.slice()
        updatedKeys.splice(index, 0, prop)
        const updatedParent = setIn(parent, [prop], updatePaths(value, parentPath.concat(prop)))
        return setIn(updatedParent, [META, 'props'], updatedKeys)
      }
    })
  }

  if (parent[META].type === 'Object' && pathExists(data, resolvedPath)) {
    const oldValue = getIn(data, resolvedPath)

    return {
      data: updatedEson,
      revert: [{
        op: 'replace',
        path: compileJSONPointer(resolvedPath),
        value: esonToJson(oldValue),
        jsoneditor: { type: oldValue[META].type }
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
export function copy (data, path, from, options) {
  const value = getIn(data, parseJSONPointer(from))

  // create new id for the copied item
  let updatedValue = cloneWithSymbols(value)
  updatedValue[META] = setIn(updatedValue[META], ['id'], createId())

  return add(data, path, updatedValue, options)
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
export function move (data, path, from, options) {
  const fromArray = parseJSONPointer(from)
  const dataValue = getIn(data, fromArray)

  const parentPathFrom = initial(fromArray)
  const parent = getIn(data, parentPathFrom)

  const result1 = remove(data, from)
  const result2 = add(result1.data, path, dataValue, options)
  // FIXME: passing id as parameter is ugly, make that redundant (use replace instead of remove/add? (that would give less predictive output :( ))

  const before = result1.revert[0].jsoneditor.before
  const beforeNeeded = (parent[META].type === 'Object' && before)

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
          ? [{ op: 'move', from: path, path: from, jsoneditor: { before } }]
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
export function test (data, path, value) {
  if (value === undefined) {
    return new Error('Test failed, no value provided')
  }

  const pathArray = parseJSONPointer(path)
  if (!pathExists(data, pathArray)) {
    return new Error('Test failed, path not found')
  }

  const actualValue = getIn(data, pathArray)
  if (!isEqual(esonToJson(actualValue), value)) {
    return new Error('Test failed, value differs')
  }
}
