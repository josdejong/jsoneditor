import { h, Component } from 'preact'
import ModeMenu from './ModeMenu'
import { toCapital } from '../utils/stringUtils'

export default class ModeButton extends Component {
  constructor (props) {
    super (props)

    this.state = {
      open: false   // whether the menu is open or not
    }
  }

  /**
   * @param {{modes: string[], mode: string, onMode: function}} props
   * @param state
   * @return {*}
   */
  render (props, state) {
    return h('div', {class: 'jsoneditor-modes'}, [
      h('button', {
        title: 'Switch mode',
        onClick: this.handleOpen
      }, `${toCapital(props.mode)} \u25BC`),

      h(ModeMenu, {
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
