import { createElement as h, Component } from 'react'
import ModeSelector from './ModeSelector'
import { toCapital } from '../../utils/stringUtils'

export default class ModeButton extends Component {
  constructor (props) {
    super (props)

    this.state = {
      open: false   // whether the menu is open or not
    }
  }

  /**
   * props {{modes: string[], mode: string, onChangeMode: function, onError: function}}
   */
  render () {
    const { props, state} = this

    return h('div', {className: 'jsoneditor-modes'}, [
      h('button', {
        key: 'button',
        title: 'Switch mode',
        onClick: this.handleOpen
      }, `${toCapital(props.mode)} \u25BC`),

      h(ModeSelector, {
        key: 'menu',
        ...props,
        open: state.open,
        onRequestClose: this.handleRequestClose
      })
    ])
  }

  handleOpen = () => {
    this.setState({open: true})
  }

  handleRequestClose = () => {
    this.setState({open: false})
  }
}
