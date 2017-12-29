import isEqual from 'lodash/isEqual'
import initial from 'lodash/initial'
import last from 'lodash/last'

import {
  setIn, updateIn, getIn, deleteIn, insertAt,
  cloneWithSymbols
} from './utils/immutabilityHelpers'
import {
  META,
  jsonToEson, esonToJson, updatePaths,
  parseJSONPointer, compileJSONPointer,
  expandAll, pathExists, resolvePathIndex, createId, applyEsonState
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
    const path = action.path ? parseJSONPointer(action.path) : null
    const from = action.from ? parseJSONPointer(action.from) : null
    const options = action.meta

    // TODO: check whether action.op and action.path exist

    switch (action.op) {
      case 'add': {
        const newValue = jsonToEson(action.value, path)
        const newValueWithState = (options && options.state)
            ? applyEsonState(newValue, options.state)
            : newValue
        const result = add(updatedEson, path, newValueWithState, options)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'remove': {
        const result = remove(updatedEson, path)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'replace': {
        const newValue = jsonToEson(action.value, path)
        const newValueWithState = (options && options.state)
            ? applyEsonState(newValue, options.state)
            : newValue
        const result = replace(updatedEson, path, newValueWithState)
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

        const result = copy(updatedEson, path, from, options)
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

        const result = move(updatedEson, path, from, options)
        updatedEson = result.data
        revert = result.revert.concat(revert)

        break
      }

      case 'test': {
        // when a test fails, cancel the whole patch and return the error
        const error = test(updatedEson, path, action.value)
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

  // keep the original id
  let newValue = setIn(value, [META, 'id'], oldValue[META].id)

  return {
    data: setIn(data, path, newValue),
    revert: [{
      op: 'replace',
      path: compileJSONPointer(path),
      value: esonToJson(oldValue),
      meta: {
        type: oldValue[META].type
      }
    }]
  }
}

/**
 * Remove an item or property
 * @param {ESON} data
 * @param {Path} path
 * @return {{data: ESON, revert: ESONPatch}}
 */
export function remove (data, path) {
  // console.log('remove', path)

  const parentPath = initial(path)
  const parent = getIn(data, parentPath)
  const dataValue = getIn(data, path)
  const value = esonToJson(dataValue)

  if (parent[META].type === 'Array') {
    return {
      data: updatePaths(deleteIn(data, path)),
      revert: [{
        op: 'add',
        path: compileJSONPointer(path),
        value,
        meta: {
          type: dataValue[META].type
        }
      }]
    }
  }
  else { // parent[META].type === 'Object'
    const prop = last(path)
    const index = parent[META].props.indexOf(prop)
    const nextProp = parent[META].props[index + 1] || null

    let updatedParent = deleteIn(parent, [prop]) // delete property itself
    updatedParent = deleteIn(updatedParent, [META, 'props', index]) // delete property from the props list

    return {
      data: setIn(data, parentPath, updatePaths(updatedParent, parentPath)),
      revert: [{
        op: 'add',
        path: compileJSONPointer(path),
        value,
        meta: {
          type: dataValue[META].type,
          before: nextProp
        }
      }]
    }
  }
}

/**
 * @param {ESON} data
 * @param {Path} path
 * @param {ESON} value
 * @param {{before?: string}} [options]
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function add (data, path, value, options) {
  const parentPath = initial(path)
  const parent = getIn(data, parentPath)
  const resolvedPath = resolvePathIndex(data, path)
  const prop = last(resolvedPath)

  let updatedEson
  if (parent[META].type === 'Array') {
    updatedEson = updatePaths(insertAt(data, resolvedPath, value))
  }
  else { // parent[META].type === 'Object'
    updatedEson = updateIn(data, parentPath, (parent) => {
      const oldValue = getIn(data, path)
      const props = parent[META].props
      const existingIndex = props.indexOf(prop)

      if (existingIndex !== -1) {
        // replace existing item, keep existing id
        const newValue = setIn(value, [META, 'id'], oldValue[META].id)
        return setIn(parent, [prop], updatePaths(newValue, path))
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
        meta: { type: oldValue[META].type }
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
 * @param {Path} path
 * @param {Path} from
 * @param {{before?: string}} [options]
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function copy (data, path, from, options) {
  const value = getIn(data, from)

  // create new id for the copied item
  let updatedValue = cloneWithSymbols(value)
  updatedValue[META] = setIn(updatedValue[META], ['id'], createId())

  return add(data, path, updatedValue, options)
}

/**
 * Move a value
 * @param {ESON} data
 * @param {Path} path
 * @param {Path} from
 * @param {{before?: string}} [options]
 * @return {{data: ESON, revert: ESONPatch}}
 * @private
 */
export function move (data, path, from, options) {
  const dataValue = getIn(data, from)

  const parentPathFrom = initial(from)
  const parent = getIn(data, parentPathFrom)

  const result1 = remove(data, from)
  const result2 = add(result1.data, path, dataValue, options)

  const before = result1.revert[0].meta.before
  const beforeNeeded = (parent[META].type === 'Object' && before)

  if (result2.revert[0].op === 'replace') {
    const value = result2.revert[0].value
    const type = result2.revert[0].meta.type
    const options = beforeNeeded ? { type, before } : { type }

    return {
      data: result2.data,
      revert: [
        { op: 'move', from: compileJSONPointer(path), path: compileJSONPointer(from) },
        { op: 'add', path: compileJSONPointer(path), value, meta: options}
      ]
    }
  }
  else { // result2.revert[0].op === 'remove'
    return {
      data: result2.data,
      revert: beforeNeeded
          ? [{ op: 'move', from: compileJSONPointer(path), path: compileJSONPointer(from), meta: { before } }]
          : [{ op: 'move', from: compileJSONPointer(path), path: compileJSONPointer(from) }]
    }
  }
}

/**
 * Test whether the data contains the provided value at the specified path.
 * Throws an error when the test fails.
 * @param {ESON} data
 * @param {Path} path
 * @param {*} value
 * @return {null | Error} Returns an error when the tests, returns null otherwise
 */
export function test (data, path, value) {
  if (value === undefined) {
    return new Error('Test failed, no value provided')
  }

  if (!pathExists(data, path)) {
    return new Error('Test failed, path not found')
  }

  const actualValue = getIn(data, path)
  if (!isEqual(esonToJson(actualValue), value)) {
    return new Error('Test failed, value differs')
  }
}
