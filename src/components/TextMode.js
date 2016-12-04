import { createElement as h, Component } from 'react'
import Ajv from 'ajv'
import { parseJSON } from '../utils/jsonUtils'
import { escapeUnicodeChars } from '../utils/stringUtils'
import { enrichSchemaError, limitErrors } from '../utils/schemaUtils'
import { jsonToData, dataToJson, patchData } from '../jsonData'
import ModeButton from './menu/ModeButton'

const AJV_OPTIONS = {
  allErrors: true,
  verbose: true,
  jsonPointers: true
}

/**
 * TextMode
 *
 * Usage:
 *
 *     <TextMode
 *         options={Object}
 *         onChange={function(text: string)}
 *         onChangeMode={function(mode: string)}
 *         onError={function(error: Error)}
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
      text: '{}',
      compiledSchema: null
    }
  }

  render () {
    return h('div', {className: 'jsoneditor jsoneditor-mode-text'}, [
      this.renderMenu(),

      h('div', {key: 'contents', className: 'jsoneditor-contents'},
        h('textarea', {
          className: 'jsoneditor-text',
          value: this.state.text,
          onChange: this.handleChange,
          onInput: this.handleInput
        })
      ),

      this.renderSchemaErrors ()
    ])
  }

  /** @protected */
  renderMenu () {
    // TODO: move Menu into a separate Component
    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, [
      h('button', {
        key: 'format',
        className: 'jsoneditor-format',
        title: 'Format the JSON document',
        onClick: this.handleFormat
      }),
      h('button', {
        key: 'compact',
        className: 'jsoneditor-compact',
        title: 'Compact the JSON document',
        onClick: this.handleCompact
      }),

      // TODO: implement a button "Repair"

      h('div', {
        key: 'separator',
        className: 'jsoneditor-vertical-menu-separator'
      }),

      this.props.options.modes && h(ModeButton, {
        key: 'mode',
        modes: this.props.options.modes,
        mode: this.props.mode,
        onChangeMode: this.props.onChangeMode,
        onError: this.props.onError
      })
    ])
  }

  /** @protected */
  renderSchemaErrors () {
    // TODO: move the JSON Schema stuff into a separate Component

    try {
      // TODO: only validate again when json is changed since last validation
      const json = this.get(); // this can fail when there is no valid json
      const valid = this.state.compiledSchema
          ? this.state.compiledSchema(json)
          : true

      if (!valid) {
        const allErrors = this.state.compiledSchema.errors.map(enrichSchemaError)
        const limitedErrors = limitErrors(allErrors)

        console.log('errors', allErrors)

        return h('div', { className: 'jsoneditor-errors'},
          h('table', {},
            h('tbody', {}, limitedErrors.map(TextMode.renderSchemaError))
          )
        )
      }
      else {
        return null
      }
    }
    catch (err) {
      // no valid JSON
      // TODO: display errors in text mode somehow? shouldn't be too much in your face
      // maybe a warning icon top right?
      // return h('table', {className: 'jsoneditor-text-errors'},
      //     h('tbody', {}, TextMode.renderSchemaError(err))
      // )
      return null
    }
  }

  /**
   * Render a table row of a single JSON schema error
   * @param {Error | Object | string} error
   * @return {JSX.Element}
   */
  static renderSchemaError (error) {
    const icon = h('input', {type: 'button', className: 'jsoneditor-schema-error'})

    if (error && error.schema && error.schemaPath) {
      // this is an ajv error message
      return h('tr', {}, [
        h('td', {key: 'icon'}, icon),
        h('td', {key: 'path'}, error.dataPath),
        h('td', {key: 'message'}, error.message)
      ])
    }
    else {
      // any other error message
      console.log('error???', error)
      return h('tr', {},
        h('td', {key: 'icon'}, icon),
        h('td', {key: 'message', colSpan: 2}, h('code', {}, String(error)))
      )
    }
  }

  /**
   * Set a JSON schema for validation of the JSON object.
   * To remove the schema, call JSONEditor.setSchema(null)
   * @param {Object | null} schema
   */
  setSchema (schema) {
    if (schema) {
      const ajv = this.props.options.ajv || Ajv && Ajv(AJV_OPTIONS)

      if (!ajv) {
        throw new Error('Cannot validate JSON: ajv not available. ' +
            'Provide ajv via options or use a JSONEditor bundle including ajv.')
      }

      this.setState({
        compiledSchema: ajv.compile(schema)
      })
    }
    else {
      this.setState({
        compiledSchema: null
      })
    }
  }

  /**
   * Get the configured indentation
   * @return {number}
   * @protected
   */
  getIndentation () {
    return this.props.options && this.props.options.indentation || 2
  }

  handleChange = (event) => {
    // do nothing...
  }

  /**
   * handle changed text input in the textarea
   * @param {Event} event
   * @protected
   */
  handleInput = (event) => {
    this.setText(event.target.value)

    if (this.props.options && this.props.options.onChangeText) {
      // TODO: pass a diff
      this.props.options.onChangeText()
    }
  }

  /** @protected */
  handleFormat = () => {
    try {
      this.format()
    }
    catch (err) {
      this.props.onError(err)
    }
  }

  /** @protected */
  handleCompact = () => {
    try {
      this.compact()
    }
    catch (err) {
      this.props.onError(err)
    }
  }

  /**
   * Format the json
   */
  format () {
    const json = this.get()
    const text = JSON.stringify(json, null, this.getIndentation())
    this.setText(text)
  }

  /**
   * Compact the json
   */
  compact () {
    const json = this.get()
    const text = JSON.stringify(json)
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
    this.setState({
      text: this.props.options.escapeUnicode
          ? escapeUnicodeChars(text)
          : text
    })
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    return this.state.text
  }
}