import { h, Component } from 'preact'
import { parseJSON } from './utils/jsonUtils'
import { jsonToData, dataToJson, patchData } from './jsonData'

export default class TextMode extends Component {
  // TODO: define propTypes

  constructor (props) {
    super(props)

    this.state = {
      text: '{}'
    }
  }

  render (props, state) {
    return h('div', {class: 'jsoneditor jsoneditor-mode-text'}, [
      h('div', {class: 'jsoneditor-menu'}, [
        h('button', {
          class: 'jsoneditor-format',
          title: 'Format the JSON document',
          onClick: this.handleFormat
        }),
        h('button', {
          class: 'jsoneditor-compact',
          title: 'Compact the JSON document',
          onClick: this.handleCompact
        })
          // TODO: implement a button "Fix JSON"
      ]),

      h('div', {class: 'jsoneditor-contents'}, [
        h('textarea', {
          class: 'jsoneditor-text',
          value: this.state.text,
          onChange: this.handleChange
        })
      ])
    ])
  }

  /**
   * Get the configured indentation
   * @return {number}
   * @private
   */
  getIndentation () {
    return this.props.options && this.props.options.indentation || 2
  }

  /**
   * handle changed text input in the textarea
   * @param {Event} event
   * @private
   */
  handleChange = (event) => {
    this.setState({
      text: event.target.value
    })
  }

  /** @private */
  handleFormat = () => {
    try {
      this.format()
    }
    catch (err) {
      this.handleError(err)
    }
  }

  /** @private */
  handleCompact = () => {
    try {
      this.compact()
    }
    catch (err) {
      this.handleError(err)
    }
  }

  /** @private */
  handleError (err) {
    if (this.props.options && this.props.options.onError) {
      this.props.options.onError(err)
    }
    else {
      console.error(err)
    }
  }

  /**
   * Format the json
   */
  format () {
    var json = this.get()
    var text = JSON.stringify(json, null, this.getIndentation())
    this.setText(text)
  }

  /**
   * Compact the json
   */
  compact () {
    var json = this.get()
    var text = JSON.stringify(json)
    this.setText(text)
  }

  /**
   * Apply a JSONPatch to the current JSON document
   * @param {JSONPatch} actions   JSONPatch actions
   * @return {JSONPatchResult} Returns a JSONPatch result containing the
   *                           patch, a patch to revert the action, and
   *                           an error object which is null when successful
   */
  patch (actions) {
    const json = this.get()

    const data = jsonToData(json)
    const result = patchData(data, actions)

    this.set(dataToJson(result.data))

    return {
      patch: actions,
      revert: result.revert,
      error: result.error
    }
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   */
  set (json) {
    this.setState({
      text: JSON.stringify(json, null, this.getIndentation())
    })
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    return parseJSON(this.state.text)
  }

  /**
   * Set a string containing a JSON document
   * @param {string} text
   */
  setText (text) {
    this.setState({ text })
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    return this.state.text
  }
}