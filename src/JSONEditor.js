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
      ref: 'tree-mode',
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
    if (this.refs['tree-mode']) {
      this.refs['tree-mode'].set(json, options)
    }
    else {
      // not yet rendered
      this.setState({
        data: json,
        options
      })
    }
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    if (this.refs['tree-mode']) {
      return this.refs['tree-mode'].get()
    }
    else {
      // not yet rendered
      return this.state.data
    }
  }
}