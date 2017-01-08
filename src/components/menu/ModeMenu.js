import { createElement as h, Component } from 'react'
import { toCapital } from '../../utils/stringUtils'
import { findParentNode } from '../../utils/domUtils'

export default class ModeMenu extends Component {
  /**
   * @param {{open, modes, mode, onChangeMode, onRequestClose, onError}} props
   * @param {Object} state
   * @return {JSX.Element}
   */
  render () {
    if (this.props.open) {
      const items = this.props.modes.map(mode => {
        return h('button', {
          key: mode,
          title: `Switch to ${mode} mode`,
          className: 'jsoneditor-menu-button jsoneditor-type-modes' +
              ((mode === this.props.mode) ? ' jsoneditor-selected' : ''),
          onClick: this.handleClick
        }, toCapital(mode))
      })

      return h('div', {
        className: 'jsoneditor-actionmenu jsoneditor-modemenu'
      }, items)
    }
    else {
      return null
    }
  }

  handleClick = () => {
    // we trigger the onChangeMode on the next tick, after the click event
    // has been finished. This is a workaround for preact not neatly replacing
    // a rendered app whilst the event is still being handled.
    setTimeout(() => {
      try {
        this.props.onRequestClose()
        this.props.onChangeMode(mode)
      }
      catch (err) {
        this.props.onError(err)
      }
    })
  }

  componentDidMount () {
    this.updateRequestCloseListener()
  }

  componentDidUpdate () {
    this.updateRequestCloseListener()
  }

  componentWillUnmount () {
    this.removeRequestCloseListener()
  }

  updateRequestCloseListener () {
    if (this.props.open) {
      this.addRequestCloseListener()
    }
    else {
      this.removeRequestCloseListener()
    }
  }

  addRequestCloseListener () {
    if (!this.handleRequestClose) {
      // Attach event listener on next tick, else the current click to open
      // the menu will immediately result in requestClose event as well
      setTimeout(() => {
        this.handleRequestClose = (event) => {
          if (!findParentNode(event.target, 'data-menu', 'true')) {
            this.props.onRequestClose()
          }
        }
        window.addEventListener('click', this.handleRequestClose)
      }, 0)
    }
  }

  removeRequestCloseListener () {
    if (this.handleRequestClose) {
      window.removeEventListener('click', this.handleRequestClose)
      this.handleRequestClose = null
    }
  }

  handleRequestClose = null
}