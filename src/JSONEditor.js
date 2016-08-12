import { h, Component } from 'preact'

import TreeMode from './TreeMode'
import bindMethods from './utils/bindMethods'

// TODO: implement and use JSONEditor.js after we've integrated Redux.

export default class JSONEditor extends Component {
  constructor (props) {
    super(props)

    bindMethods(this)

    this.state = {
      options: props.options,
      data: null
    }
  }

  render () {
    return h(TreeMode, {
      options: this.state.options,
      data: this.state.data
    }, [])
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   * @param {SetOptions} [options]
   */
  set (json, options = {}) {
    // TODO: set state via redux action
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    // TODO: get state from redux store
  }
}