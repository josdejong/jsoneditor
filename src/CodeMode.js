import { h } from 'preact'
import TextMode from './TextMode'
import ace from './assets/ace'

/**
 * CodeMode (powered by Ace editor)
 *
 * Usage:
 *
 *     <CodeMode
 *         options={Object}
 *         onChange={function(text: string)}
 *         onChangeMode={function(mode: string)}
 *         onLoadAce={function(aceEditor: Object, container: Element, options: Object) : Object}
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
export default class CodeMode extends TextMode {
  constructor (props) {
    super(props)

    this.state = {}

    this.id = 'id' + Math.round(Math.random() * 1e6) // unique enough id within the JSONEditor
    this.aceEditor = null
  }

  render (props, state) {
    return h('div', {class: 'jsoneditor jsoneditor-mode-code'}, [
      this.renderMenu(),

      h('div', {class: 'jsoneditor-contents', id: this.id})
    ])
  }

  componentDidMount () {
    const options = this.props.options || {}

    const container = this.base.querySelector('#' + this.id)

    // use ace from bundle, and if not available try to use from global
    const _ace = ace || window['ace']

    let aceEditor = null
    if (_ace && _ace.edit) {
      // create ace editor
      aceEditor = _ace.edit(container)

      // bundle and load jsoneditor theme for ace editor
      require('./assets/ace/theme-jsoneditor')

      // configure ace editor
      aceEditor.$blockScrolling = Infinity
      aceEditor.setTheme('ace/theme/jsoneditor')
      aceEditor.setShowPrintMargin(false)
      aceEditor.setFontSize(13)
      aceEditor.getSession().setMode('ace/mode/json')
      aceEditor.getSession().setTabSize(options.indentation || 2)
      aceEditor.getSession().setUseSoftTabs(true)
      aceEditor.getSession().setUseWrapMode(true)
      aceEditor.commands.bindKey('Ctrl-L', null)    // disable Ctrl+L (is used by the browser to select the address bar)
      aceEditor.commands.bindKey('Command-L', null) // disable Ctrl+L (is used by the browser to select the address bar)
    }
    else {
      // ace is excluded from the bundle.
    }

    // allow changing the config or completely replacing aceEditor
    this.aceEditor = options.onLoadAce
        ? options.onLoadAce(aceEditor, container, options) || aceEditor
        : aceEditor

    // register onchange event
    this.aceEditor.on('change', this.handleChange)

    // set initial text
    this.setText('{}')
  }

  componentWillUnmount () {
    this.destroy()
  }

  /**
   * Destroy the editor
   */
  destroy () {
    // neatly destroy ace editor
    this.aceEditor.destroy()
  }

  componentDidUpdate () {
    // TODO: handle changes in props
  }

  handleChange = () => {
    if (this.props.options && this.props.options.onChangeText) {
      // TODO: pass a diff
      this.props.options.onChangeText()
    }
  }

  /**
   * Set a string containing a JSON document
   * @param {string} text
   */
  setText (text) {
    this.aceEditor.setValue(text, -1)
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    return this.aceEditor.getValue()
  }
}