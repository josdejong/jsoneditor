// @flow weak

import { createElement as h, Component } from 'react'
import Ajv from 'ajv'
import { parseJSON } from '../utils/jsonUtils'
import { escapeUnicodeChars } from '../utils/stringUtils'
import { enrichSchemaError, limitErrors } from '../utils/schemaUtils'
import { jsonToData, dataToJson } from '../jsonData'
import { patchData } from '../jsonPatchData'
import { createFindKeyBinding } from '../utils/keyBindings'
import { KEY_BINDINGS } from '../constants'

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
 *         text={string}
 *         json={JSON}
 *         ...options
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
  state: Object

  keyDownActions = {
    'format': (event) => this.handleCompact(),
    'compact': (event) => this.handleFormat()
  }

  constructor (props) {
    super(props)

    this.state = {
      text: '{}',
      compiledSchema: null
    }
  }

  componentWillMount () {
    this.applyProps(this.props, {})
  }

  componentWillReceiveProps (nextProps) {
    this.applyProps(nextProps, this.props)
  }

  // TODO: create some sort of watcher structure for these props? Is there a Reactpattern for that?
  applyProps (nextProps, currentProps) {
    // Apply text
    if (nextProps.text !== currentProps.text) {
      this.setText(nextProps.text)
    }

    // Apply json
    if (nextProps.json !== currentProps.json) {
      this.set(nextProps.json)
    }

    // Apply JSON Schema
    if (nextProps.schema !== currentProps.schema) {
      this.setSchema(nextProps.schema)
    }

    // Apply key bindings
    if (!this.findKeyBinding ||
        JSON.stringify(nextProps.keyBindings) !== JSON.stringify(currentProps.keyBindings)) {
      // merge default and custom key bindings
      const keyBindings = Object.assign({}, KEY_BINDINGS, nextProps.keyBindings)
      this.findKeyBinding = createFindKeyBinding(keyBindings)
    }

    // TODO: apply patchText
  }

  render () {
    return h('div', {
      className: 'jsoneditor jsoneditor-mode-text',
      onKeyDown: this.handleKeyDown
    }, [
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

      this.props.modes && h(ModeButton, {
        key: 'mode',
        // TODO: simply pass all options?
        modes: this.props.modes,
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

        return h('div', { key: 'errors', className: 'jsoneditor-errors'},
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
   * @param {number} index
   * @return {JSX.Element}
   */
  static renderSchemaError (error, index) {
    const icon = h('input', {type: 'button', className: 'jsoneditor-schema-error'})

    if (error && error.schema && error.schemaPath) {
      // this is an ajv error message
      return h('tr', { key: index }, [
        h('td', {key: 'icon'}, icon),
        h('td', {key: 'path'}, error.dataPath),
        h('td', {key: 'message'}, error.message)
      ])
    }
    else {
      // any other error message
      console.log('error???', error)
      return h('tr', { key: index },
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
      const ajv = this.props.ajv || Ajv && Ajv(AJV_OPTIONS)

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
   * Get the configured indentation. When not configured, returns the default value 2
   */
  static getIndentation (props?: {indentation?: number}) : number {
    return props && props.indentation || 2
  }

  static format (text, indentation) {
    const json = parseJSON(text)
    return JSON.stringify(json, null, indentation)
  }

  static compact (text) {
    const json = parseJSON(text)
    return JSON.stringify(json)
  }

  // TODO: move the static functions above into a separate util file

  handleChange = (event) => {
    // do nothing...
  }

  findKeyBinding = createFindKeyBinding(KEY_BINDINGS)

  handleKeyDown = (event) => {
    const keyBinding = this.findKeyBinding(event)
    const action = this.keyDownActions[keyBinding]

    if (action) {
      event.preventDefault()
      action(event)
    }
  }

  /**
   * handle changed text input in the textarea
   * @param {Event} event
   * @protected
   */
  handleInput = (event) => {
    this.handleChangeText(event.target.value)
  }

  /** @protected */
  handleFormat = () => {
    try {
      const formatted = TextMode.format(this.getText(), TextMode.getIndentation(this.props))
      this.handleChangeText(formatted)
    }
    catch (err) {
      this.props.onError(err)
    }
  }

  /** @protected */
  handleCompact = () => {
    try {
      const compacted = TextMode.compact(this.getText())
      this.handleChangeText(compacted)
    }
    catch (err) {
      this.props.onError(err)
    }
  }

  /**
   * Apply new text to the state, and emit an onChangeText event if there is a change
   */
  handleChangeText = (text: string) => {
    if (this.props.onChangeText && text !== this.state.text) {
      const appliedText = this.setText(text)
      this.props.onChangeText(appliedText)
    }
    else {
      this.setText(text)
    }

    // TODO: also invoke a patch action
  }

  // TODO: implement method patchText
  // TODO: implement callback onPatchText

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
    this.setText(JSON.stringify(json, null, TextMode.getIndentation(this.props)))
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
   */
  setText (text: string) : string {
    const normalizedText = this.props.escapeUnicode
        ? escapeUnicodeChars(text)
        : text

    this.setState({ text: normalizedText })

    return normalizedText
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    return this.state.text
  }
}

// TODO: define propTypes
