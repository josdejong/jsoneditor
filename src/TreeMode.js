import { h, Component } from 'preact'

import { setIn, updateIn, getIn, deleteIn, cloneDeep } from './utils/objectUtils'
import { compareAsc, compareDesc, last } from './utils/arrayUtils'
import { stringConvert } from  './utils/typeUtils'
import { isObject } from './utils/typeUtils'
import bindMethods from './utils/bindMethods'
import JSONNode from './JSONNode'

export default class TreeMode extends Component {
  // TODO: define propTypes

  constructor (props) {
    super(props)

    bindMethods(this)

    const name   = this.props.options && this.props.options.name || null
    const expand = this.props.options && this.props.options.expand || TreeMode.expand
    
    this.state = {
      options: {
        name
      },

      data: jsonToData([], this.props.data || {}, expand),
      
      events: {
        onChangeProperty: this.handleChangeProperty,
        onChangeValue: this.handleChangeValue,
        onChangeType: this.handleChangeType,
        onInsert: this.handleInsert,
        onAppend: this.handleAppend,
        onDuplicate: this.handleDuplicate,
        onRemove: this.handleRemove,
        onSort: this.handleSort,

        onExpand: this.handleExpand
      },

      search: null
    }
  }

  render() {
    return h('div', {class: 'jsoneditor', contentEditable: 'false', onClick: JSONNode.hideContextMenu}, [
      h('ul', {class: 'jsoneditor-list', contentEditable: 'false'}, [
        h(JSONNode, {
          data: this.state.data,
          events: this.state.events,
          options: this.state.options,
          parent: null,
          prop: null
        })
      ])
    ])
  }

  handleChangeValue (path, value) {
    console.log('handleChangeValue', path, value)

    const dataPath = toDataPath(this.state.data, path)

    this.setState({
      data: setIn(this.state.data, dataPath.concat(['value']), value)
    })
  }

  handleChangeProperty (path, oldProp, newProp) {
    console.log('handleChangeProperty', path, oldProp, newProp)

    const dataPath = toDataPath(this.state.data, path)
    const object = getIn(this.state.data, dataPath)
    const index = object.props.findIndex(p => p.name === oldProp)

    this.setState({
      data: setIn(this.state.data, dataPath.concat(['props', index, 'name']), newProp)
    })
  }

  handleChangeType (path, type) {
    console.log('handleChangeType', path, type)

    const dataPath = toDataPath(this.state.data, path)
    const oldEntry = getIn(this.state.data, dataPath)
    const newEntry = convertDataEntry(oldEntry, type)

    this.setState({
      data: setIn(this.state.data, dataPath, newEntry)
    })
  }

  handleInsert (path, afterProp, type) {
    console.log('handleInsert', path, afterProp, type)

    const dataPath = toDataPath(this.state.data, path)
    const parent = getIn(this.state.data, dataPath)

    if (parent.type === 'array') {
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['items']), (items) => {
          const index = parseInt(afterProp)
          const updatedItems = items.slice(0)

          updatedItems.splice(index + 1, 0, createDataEntry(type))

          return updatedItems
        })
      })
    }
    else { // parent.type === 'object'
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['props']), (props) => {
          const index = props.findIndex(p => p.name === afterProp)
          const updatedProps = props.slice(0)

          updatedProps.splice(index + 1, 0, {
            name: '',
            value: createDataEntry(type)
          })

          return updatedProps
        })
      })
    }
  }

  handleAppend (path, type) {
    console.log('handleAppend', path, type)

    const dataPath = toDataPath(this.state.data, path)
    const object = getIn(this.state.data, dataPath)

    if (object.type === 'array') {
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['items']), (items) => {
          const updatedItems = items.slice(0)

          updatedItems.push(createDataEntry(type))

          return updatedItems
        })
      })
    }
    else { // object.type === 'object'
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['props']), (props) => {
          const updatedProps = props.slice(0)

          updatedProps.push({
            name: '',
            value: createDataEntry(type)
          })

          return updatedProps
        })
      })
    }
  }

  handleDuplicate (path, prop) {
    console.log('handleDuplicate', path)

    const dataPath = toDataPath(this.state.data, path)
    const object = getIn(this.state.data, dataPath)

    if (object.type === 'array') {
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['items']), (items) => {
          const index = parseInt(prop)
          const updatedItems = items.slice(0)
          const original = items[index]
          const duplicate = cloneDeep(original)

          updatedItems.splice(index + 1, 0, duplicate)

          return updatedItems
        })
      })
    }
    else { // object.type === 'object'
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['props']), (props) => {
          const index = props.findIndex(p => p.name === prop)
          const updated = props.slice(0)
          const original = props[index]
          const duplicate = cloneDeep(original)

          updated.splice(index + 1, 0, duplicate)

          return updated
        })
      })
    }
  }

  handleRemove (path, prop) {
    console.log('handleRemove', path)

    const object = getIn(this.state.data, toDataPath(this.state.data, path))

    if (object.type === 'array') {
      const dataPath = toDataPath(this.state.data, path.concat(prop))

      this.setState({
        data: deleteIn(this.state.data, dataPath)
      })
    }
    else { // object.type === 'object'
      const dataPath = toDataPath(this.state.data, path.concat(prop))

      dataPath.pop()  // remove the 'value' property, we want to remove the whole object property
      this.setState({
        data: deleteIn(this.state.data, dataPath)
      })
    }
  }

  /**
   * Order the items of an array or the properties of an object in ascending
   * or descending order
   * @param {Array.<string | number>} path
   * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
   */
  handleSort (path, order = null) {
    console.log('handleSort', path, order)

    const dataPath = toDataPath(this.state.data, path)
    const object = getIn(this.state.data, dataPath)

    let _order
    if (order === 'asc' || order === 'desc') {
      _order = order
    }
    else {
      // toggle previous order
      _order = object.order !== 'asc' ? 'asc' : 'desc'

      this.setState({
        data: setIn(this.state.data, dataPath.concat(['order']), _order)
      })
    }

    if (object.type === 'array') {
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['items']), (items) =>{
          const ordered = items.slice(0)
          const compare = _order === 'desc' ? compareDesc : compareAsc

          ordered.sort((a, b) => compare(a.value, b.value))

          return ordered
        })
      })
    }
    else { // object.type === 'object'
      this.setState({
        data: updateIn(this.state.data, dataPath.concat(['props']), (props) => {
          const orderedProps = props.slice(0)
          const compare = _order === 'desc' ? compareDesc : compareAsc

          orderedProps.sort((a, b) => compare(a.name, b.name))

          return orderedProps
        })
      })
    }
  }

  handleExpand(path, expand) {
    console.log('handleExpand', path, expand)

    const dataPath = toDataPath(this.state.data, path)

    this.setState({
      data: setIn(this.state.data, dataPath.concat(['expanded']), expand)
    })
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   * @param {SetOptions} [options]
   */
  set (json, options = {}) {
    this.setState({
      options: setIn(this.state.options, ['name'], options && options.name || null),

      data: jsonToData([], json, options.expand || TreeMode.expand)
    })
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    return dataToJson(this.state.data)
  }

  // TODO: create getText and setText

  /**
   * Default function to determine whether or not to expand a node initially
   *
   * Rule: expand the root node only
   *
   * @param {Array.<string | number>} path
   * @return {boolean}
   */
  static expand (path) {
    return path.length === 0
  }

}

/**
 * Convert a path of a JSON object into a path in the corresponding data model
 * @param {Data} data
 * @param {Array.<string | number>} path
 * @return {Array.<string | number>} dataPath
 * @private
 */
function toDataPath (data, path) {
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
 * @param {Array.<string | number>} path
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Array.<string | number>)} expand
 * @return {Data}
 */
function jsonToData (path, json, expand) {
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
 * @param {Data} data
 * @return {Object | Array | string | number | boolean | null} json
 */
function dataToJson (data) {
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
 * @param {'object' | 'array' | 'value' | 'string'} [type='value']
 * @return {*}
 */
function createDataEntry (type) {
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
 * @param {Data} entry
 * @param {'object' | 'array' | 'value' | 'string'} type
 */
function convertDataEntry (entry, type) {
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