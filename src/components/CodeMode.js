import { h } from 'preact'
import TextMode from './TextMode'
import Ace from './Ace'

/**
 * CodeMode (powered by Ace editor)
 *
 * Usage:
 *
 *     <CodeMode
 *         options={Object}
 *         onChange={function(text: string)}
 *         onChangeMode={function(mode: string)}
 *         onError={function(error: Error)}
 *         onLoadAce={function(aceEditor: Object, container: Element) : Object}
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

    this.state = {
      text: '{}'
    }
  }

  render (props, state) {
    return h('div', {class: 'jsoneditor jsoneditor-mode-code'}, [
      this.renderMenu(),

      h('div', {class: 'jsoneditor-contents'}, h(Ace, {
        value: this.state.text,
        onChange: this.handleChange,
        onLoadAce: this.props.options.onLoadAce,
        indentation: this.props.options.indentation,
        ace: this.props.options.ace
      })),

      this.renderSchemaErrors ()
    ])
  }

  handleChange = (text) => {
    this.setState({ text })

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
    this.setState({text})
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    return this.state.text
  }
}