/**
 * This file contains functions to act on a JSONData object.
 * All functions are pure and don't mutate the JSONData.
 */

import { cloneDeep } from './utils/objectUtils'
import { setIn, updateIn, getIn, deleteIn } from './utils/immutabilityHelpers'
import { compareAsc, compareDesc } from './utils/arrayUtils'
import { stringConvert } from  './utils/typeUtils'
import { isObject } from './utils/objectUtils'

/**
 * Change the value of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {*} value
 * @return {JSONData}
 */
export function changeValue (data, path, value) {
  console.log('changeValue', data, value)

  const dataPath = toDataPath(data, path)

  return setIn(data, dataPath.concat(['value']), value)
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
  console.log('changeProperty', path, oldProp, newProp)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)
  const index = object.props.findIndex(p => p.name === oldProp)

  return setIn(data, dataPath.concat(['props', index, 'name']), newProp)
}

/**
 * Change the type of a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {JSONDataType} type
 * @return {JSONData}
 */
export function changeType (data, path, type) {
  console.log('changeType', path, type)

  const dataPath = toDataPath(data, path)
  const oldEntry = getIn(data, dataPath)
  const newEntry = convertDataEntry(oldEntry, type)

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
export function insert (data, path, afterProp, type) {
  console.log('insert', path, afterProp, type)

  const dataPath = toDataPath(data, path)
  const parent = getIn(data, dataPath)

  if (parent.type === 'array') {
    return updateIn(data, dataPath.concat(['items']), (items) => {
      const index = parseInt(afterProp)
      const updatedItems = items.slice(0)

      updatedItems.splice(index + 1, 0, createDataEntry(type))

      return updatedItems
    })
  }
  else { // parent.type === 'object'
    return updateIn(data, dataPath.concat(['props']), (props) => {
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
export function append (data, path, type) {
  console.log('append', path, type)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  if (object.type === 'array') {
    return updateIn(data, dataPath.concat(['items']), (items) => {
      const updatedItems = items.slice(0)

      updatedItems.push(createDataEntry(type))

      return updatedItems
    })
  }
  else { // object.type === 'object'
    return updateIn(data, dataPath.concat(['props']), (props) => {
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
 * Duplicate a property or item
 * @param {JSONData} data
 * @param {Path} path
 * @param {string | number} prop
 * @return {JSONData}
 */
export function duplicate (data, path, prop) {
  console.log('duplicate', path)

  const dataPath = toDataPath(data, path)
  const object = getIn(data, dataPath)

  if (object.type === 'array') {
    return updateIn(data, dataPath.concat(['items']), (items) => {
      const index = parseInt(prop)
      const updatedItems = items.slice(0)
      const original = items[index]
      const duplicate = cloneDeep(original)

      updatedItems.splice(index + 1, 0, duplicate)

      return updatedItems
    })
  }
  else { // object.type === 'object'
    return updateIn(data, dataPath.concat(['props']), (props) => {
      const index = props.findIndex(p => p.name === prop)
      const updated = props.slice(0)
      const original = props[index]
      const duplicate = cloneDeep(original)

      updated.splice(index + 1, 0, duplicate)

      return updated
    })
  }
}

/**
 * Remove an item or property
 * @param {JSONData} data
 * @param {Path} path
 * @param {string | number} prop
 * @return {JSONData}
 */
export function remove (data, path, prop) {
  console.log('remove', path)

  const object = getIn(data, toDataPath(data, path))

  if (object.type === 'array') {
    const dataPath = toDataPath(data, path.concat(prop))

    return deleteIn(data, dataPath)
  }
  else { // object.type === 'object'
    const dataPath = toDataPath(data, path.concat(prop))

    dataPath.pop()  // remove the 'value' property, we want to remove the whole object property
    return deleteIn(data, dataPath)
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
  console.log('sort', path, order)

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
export function expandRecursive (data, path, callback, expanded) {
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
 * Convert a JSON object into the internally used data model
 * @param {Path} path
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Path)} expand
 * @return {JSONData}
 */
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
 * Convert an entry into a different type. When possible, data is retained
 * @param {JSONData} entry
 * @param {JSONDataType} type
 * @return {JSONData}
 */
export function convertDataEntry (entry, type) {
  const convertedEntry = createDataEntry(type)

  // convert contents from old value to new value where possible
  if (type === 'value' && entry.type === 'string') {
    convertedEntry.value = stringConvert(entry.value)
  }

  if (type === 'string' && entry.type === 'value') {
    convertedEntry.value = entry.value + ''
  }

  if (type === 'object' && entry.type === 'array') {
    convertedEntry.props = entry.items.map((item, index) => {
      return {
        name: index + '',
        value: item
      }
    })
  }

  if (type === 'array' && entry.type === 'object') {
    convertedEntry.items = entry.props.map(prop => prop.value)
  }

  return convertedEntry
}