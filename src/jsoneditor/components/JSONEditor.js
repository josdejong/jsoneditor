import { createElement as h, PureComponent } from 'react'
import CodeMode from './CodeMode'
import TextMode from './TextMode'
import TreeMode from './TreeMode'

import './jsoneditor.css'

const DEFAULT_MODE = 'tree'

export default class JSONEditor extends PureComponent {

  // TODO: work out prop types
  // static propTypes = {
  //   ...
  // }

  static modeConstructors = {
    code: CodeMode,
    form: TreeMode,
    text: TextMode,
    tree: TreeMode,
    view: TreeMode
  }

  render () {
    const mode = this.props.mode || DEFAULT_MODE // We use mode from state, not from props!
    const ModeConstructor = JSONEditor.modeConstructors[mode]

    if (!ModeConstructor) {
      // TODO: show an on screen error instead of throwing an error?
      throw new Error('Unknown mode "' + mode + '". ' +
          'Choose from: ' + Object.keys(this.props.modes).join(', ')) // FIXME: this.props.modes may be undefined
    }

    return h(ModeConstructor, {
      ...this.props,
      mode,
      onError: this.handleError,
      onChangeMode: this.handleChangeMode
    })
  }

  handleError = (err) => {
    if (this.props.onError) {
      this.props.onError(err)
    }
    else {
      console.error(err)
    }
  }

  handleChangeMode = (mode) => {
    console.log('changeMode', mode, this.props.onChangeMode)

    if (this.props.onChangeMode) {
      this.props.onChangeMode(mode, this.props.mode)
    }
  }
}
