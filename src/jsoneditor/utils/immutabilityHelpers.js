import { isObjectOrArray } from  './typeUtils'

/**
 * Immutability helpers
 *
 * inspiration:
 *
 * https://www.npmjs.com/package/seamless-immutable
 * https://www.npmjs.com/package/ih
 * https://www.npmjs.com/package/mutatis
 * https://github.com/mariocasciaro/object-path-immutable
 */

/**
 * Shallow clone of an Object, Array, or value
 * Also copies any symbols on the Objects and Arrays
 * @param {*} value
 * @return {*}
 */
export function shallowCloneWithSymbols (value) {
  if (Array.isArray(value)) {
    // copy array items
    let arr = value.slice()

    // copy all symbols
    Object.getOwnPropertySymbols(value).forEach(symbol => arr[symbol] = value[symbol])

    return arr
  }
  else if (typeof value === 'object') {
    // copy properties
    let obj = {}
    for (let prop in value) {
      if (value.hasOwnProperty(prop)) {
        obj[prop] = value[prop]
      }
    }

    // copy all symbols
    Object.getOwnPropertySymbols(value).forEach(symbol => obj[symbol] = value[symbol])

    return obj
  }
  else {
    return value
  }
}

/**
 * helper function to get a nested property in an object or array
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @return {* | undefined} Returns the field when found, or undefined when the
 *                         path doesn't exist
 */
export function getIn (object, path) {
  let value = object
  let i = 0

  while(i < path.length) {
    if (isObjectOrArray(value)) {
      value = value[path[i]]
    }
    else {
      value = undefined
    }

    i++
  }

  return value
}

/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {*} value
 * @return {Object | Array} Returns a new, updated object or array
 */
export function setIn (object, path, value) {
  if (path.length === 0) {
    return value
  }

  if (!isObjectOrArray(object)) {
    throw new Error('Path does not exist')
  }

  const key = path[0]
  const updatedValue = setIn(object[key], path.slice(1), value)
  if (object[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    const updatedObject = shallowCloneWithSymbols(object)
    updatedObject[key] = updatedValue
    return updatedObject
  }
}

/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {function} callback
 * @return {Object | Array} Returns a new, updated object or array
 */
export function updateIn (object, path, callback) {
  if (path.length === 0) {
    return callback(object)
  }

  if (!isObjectOrArray(object)) {
    throw new Error('Path doesn\'t exist')
  }

  const key = path[0]
  const updatedValue = updateIn(object[key], path.slice(1), callback)
  // TODO: create a function applyProp(...) which does the following if/else construct
  if (object[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    const updatedObject = shallowCloneWithSymbols(object)
    updatedObject[key] = updatedValue
    return updatedObject
  }
}

/**
 * helper function to delete a nested property in an object
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @return {Object | Array} Returns a new, updated object or array
 */
export function deleteIn (object, path) {
  if (path.length === 0) {
    return object
  }

  if (!isObjectOrArray(object)) {
    return object
  }

  if (path.length === 1) {
    const key = path[0]
    if (!(key in object)) {
      // key doesn't exist. return object unchanged
      return object
    }
    else {
      const updatedObject = shallowCloneWithSymbols(object)

      if (Array.isArray(updatedObject)) {
        updatedObject.splice(key, 1)
      }
      else {
        delete updatedObject[key]
      }

      return updatedObject
    }
  }

  const key = path[0]
  const updatedValue = deleteIn(object[key], path.slice(1))
  if (object[key] === updatedValue) {
    // object is unchanged
    return object
  }
  else {
    const updatedObject = shallowCloneWithSymbols(object)
    updatedObject[key] = updatedValue
    return updatedObject
  }
}

/**
 * Insert a new item in an array at a specific index.
 * Example usage:
 *
 *     insertAt({arr: [1,2,3]}, ['arr', '2'], 'inserted')  // [1,2,'inserted',3]
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {*} value
 * @return {Array}
 */
export function insertAt (object, path, value) {
  const parentPath = path.slice(0, path.length - 1)
  const index = path[path.length - 1]

  return updateIn(object, parentPath, (items) => {
    if (!Array.isArray(items)) {
      throw new TypeError('Array expected at path ' + JSON.stringify(parentPath))
    }

    const updatedItems = shallowCloneWithSymbols(items)
    updatedItems.splice(index, 0, value)

    return updatedItems
  })
}

/**
 * Transform a JSON object, traverse over the whole object,
 * and allow replacing Objects/Arrays/values.
 * Does not iterate over symbols.
 * @param {JSON} json
 * @param {function (json: JSON, path: Path) : JSON} callback
 * @param {Path} [path]
 * @return {JSON}
 */
export function transform (json, callback, path = []) {
  const updated1 = callback(json, path)

  if (Array.isArray(json)) { // array
    let updated2 = undefined

    for (let i = 0; i < updated1.length; i++) {
      const before = updated1[i]
      // we stringify the index here, so the Path only contains strings and can be safely
      // stringified/parsed to JSONPointer without loosing information.
      // We do not want to rely on path keys being numeric/string.
      const after = transform(before, callback, path.concat(i + ''))
      if (after !== before) {
        if (!updated2) {
          updated2 = shallowCloneWithSymbols(updated1)
        }
        updated2[i] = after
      }
    }

    return updated2 ? updated2 : updated1
  }
  else if (json && typeof json === 'object') { // object
    let updated2 = undefined

    for (let key in updated1) {
      if (updated1.hasOwnProperty(key)) {
        const before = updated1[key]
        const after = transform(before, callback, path.concat(key))
        if (after !== before) {
          if (!updated2) {
            updated2 = shallowCloneWithSymbols(updated1)
          }
          updated2[key] = after
        }
      }
    }

    return updated2 ? updated2 : updated1
  }
  else { // number, string, boolean, null
    return updated1
  }
}

/**
 * Test whether a path exists in a JSON object
 * @param {ESON} json
 * @param {Path} path
 * @return {boolean} Returns true if the path exists, else returns false
 * @private
 */
export function existsIn (json, path) {
  if (json === undefined) {
    return false
  }

  if (path.length === 0) {
    return true
  }

  if (Array.isArray(json)) {
    // index of an array
    return existsIn(json[parseInt(path[0], 10)], path.slice(1))
  }
  else { // Object
    // object property. find the index of this property
    return existsIn(json[path[0]], path.slice(1))
  }
}
