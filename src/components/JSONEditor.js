// @flow

import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import CodeMode from './CodeMode'
import TextMode from './TextMode'
import TreeMode from './TreeMode'

export default class JSONEditor extends Component {
  static modeConstructors = {
    code: CodeMode,
    form: TreeMode,
    text: TextMode,
    tree: TreeMode,
    view: TreeMode
  }

  state = {
    mode: 'tree'
  }

  render () {
    const mode = this.state.mode // We use mode from state, not from props!
    const ModeConstructor = JSONEditor.modeConstructors[mode]

    if (!ModeConstructor) {
      // TODO: show an on screen error instead of throwing an error?
      throw new Error('Unknown mode "' + mode + '". ' +
          'Choose from: ' + Object.keys(this.props.modes).join(', '))
    }

    return h(ModeConstructor, {
      ...this.props,
      mode,
      onError: this.handleError,
      onChangeMode: this.handleChangeMode
    })
  }

  componentWillMount () {
    if (this.props.mode) {
      this.setState({ mode: this.props.mode })
    }
  }

  componentWillReceiveProps (nextProps: {mode?: string}) {
    if (nextProps.mode !== this.props.mode) {
      this.setState({ mode: nextProps.mode })
    }
  }

  handleError = (err: Error) => {
    if (this.props.onError) {
      this.props.onError(err)
    }
    else {
      console.error(err)
    }
  }

  handleChangeMode = (mode: string) => {
    const prevMode = this.state.mode

    this.setState({ mode })

    if (this.props.onChangeMode) {
      this.props.onChangeMode(mode, prevMode)
    }
  }
}

JSONEditor.propTypes = {
  mode: PropTypes.string
}
