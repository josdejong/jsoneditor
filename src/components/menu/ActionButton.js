import { createElement as h, Component } from 'react'
import ActionMenu from './ActionMenu'
import { findParentNode } from '../../utils/domUtils'

export default class ActionButton extends Component {
  constructor (props) {
    super (props)

    this.state = {
      open: false,   // whether the menu is open or not
      anchor: null,
      root: null
    }
  }

  /**
   * @param {{path, type, events}} props
   * @param state
   * @return {*}
   */
  render () {
    const { props, state} = this

    const className = 'jsoneditor-button jsoneditor-actionmenu' +
        (this.state.open ? ' jsoneditor-visible' : '')

    return h('div', {className: 'jsoneditor-button-container'}, [
      h(ActionMenu, {
        ...props, // path, type, events
        ...state, // open, anchor, root
        onRequestClose: this.handleRequestClose
      }),
      h('button', {className: className, onClick: this.handleOpen})
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
