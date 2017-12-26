import { createElement as h } from 'react'
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

  // TODO: work out propTypes

  state = {
    text: '{}',
    compiledSchema: null
  }

  render () {
    return h('div', {
      className: 'jsoneditor jsoneditor-mode-code',
      onKeyDown: this.handleKeyDown
    }, [
      this.renderMenu(),

      h('div', {key: 'contents', className: 'jsoneditor-contents'}, h(Ace, {
        value: this.state.text,
        onChange: this.handleChangeText,
        onLoadAce: this.props.onLoadAce,
        indentation: this.props.indentation,
        ace: this.props.ace
      })),

      this.renderSchemaErrors ()
    ])
  }
}

// TODO: define propTypes
