import { h, Component } from 'preact'
import { parseJSON } from './utils/jsonUtils'
import { jsonToData, dataToJson, patchData } from './jsonData'
import ModeButton from './menu/ModeButton'

/**
 * TextMode
 *
 * Usage:
 *
 *     <TextMode
 *         options={Object}
 *         onChange={function(text: string)}
 *         onChangeMode={function(mode: string)}
 *     />
 *
 * Methods:
 *
 *     setText(text)
 *     getText() : text
 *     set(json : JSON)
 *     get() : JSON
 *     patch(actions: JSONPatch)
 *     format()
 *     compact()
 *     destroy()
 *
 */
export default class TextMode extends Component {

  constructor (props) {
    super(props)

    this.state = {
      text: '{}'
    }
  }

  render (props, state) {
    return h('div', {class: 'jsoneditor jsoneditor-mode-text'}, [
      this.renderMenu(),

      h('div', {class: 'jsoneditor-contents'}, [
        h('textarea', {
          class: 'jsoneditor-text',
          value: this.state.text,
          onChange: this.handleChange
        })
      ])
    ])
  }

  /** @protected */
  renderMenu () {
    return h('div', {class: 'jsoneditor-menu'}, [
      h('button', {
        class: 'jsoneditor-format',
        title: 'Format the JSON document',
        onClick: this.handleFormat
      }),
      h('button', {
        class: 'jsoneditor-compact',
        title: 'Compact the JSON document',
        onClick: this.handleCompact
      }),

      // TODO: implement a button "Repair"

      h('div', {class: 'jsoneditor-vertical-menu-separator'}),

      this.props.options.modes && h(ModeButton, {
        modes: this.props.options.modes,
        mode: this.props.mode,
        onChangeMode: this.props.onChangeMode,
        onError: this.handleError
      })
    ])
  }

  /**
   * Get the configured indentation
   * @return {number}
   * @protected
   */
  getIndentation () {
    return this.props.options && this.props.options.indentation || 2
  }

  /**
   * handle changed text input in the textarea
   * @param {Event} event
   * @protected
   */
  handleChange = (event) => {
    this.setText(event.target.value)
  }

  /** @protected */
  handleFormat = () => {
    try {
      this.format()
    }
    catch (err) {
      this.handleError(err)
    }
  }

  /** @protected */
  handleCompact = () => {
    try {
      this.compact()
    }
    catch (err) {
      this.handleError(err)
    }
  }

  /** @protected */
  handleError = (err) => {
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
    this.setText(JSON.stringify(json, null, this.getIndentation()))
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    return parseJSON(this.getText())
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

  /**
   * Destroy the editor
   */
  destroy () {

  }
}