import { h, Component } from 'preact'
import AppendActionMenu from './AppendActionMenu'
import { findParentNode } from '../utils/domUtils'

export default class AppendActionButton extends Component {
  constructor (props) {
    super (props)

    this.state = {
      open: false,   // whether the menu is open or not
      anchor: null,
      root: null
    }
  }

  /**
   * @param {{path, events}} props
   * @param state
   * @return {*}
   */
  render (props, state) {
    const className = 'jsoneditor-button jsoneditor-actionmenu' +
        (this.state.open ? ' jsoneditor-visible' : '')

    return h('div', {class: 'jsoneditor-button-container'}, [
      h(AppendActionMenu, {
        ...props, // path, events
        ...state, // open, anchor, root
        onRequestClose: this.handleRequestClose
      }),
      h('button', {class: className, onClick: this.handleOpen})
    ])
  }

  handleOpen = (event) => {
    this.setState({
      open: true,
      anchor: event.target,
      root: findParentNode(event.target, 'data-jsoneditor', 'true')
    })
  }

  handleRequestClose = () => {
    this.setState({open: false})
  }
}
