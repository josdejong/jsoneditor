import { createElement as h, Component } from 'react'
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

  render () {
    const { props, state } = this
    return h('div', {className: 'jsoneditor jsoneditor-mode-code'}, [
      this.renderMenu(),

      h('div', {className: 'jsoneditor-contents'}, h(Ace, {
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
}