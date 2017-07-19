import { createElement as h, Component } from 'react'
import { toCapital } from '../../utils/stringUtils'
import { findParentWithAttribute } from '../../utils/domUtils'

export default class ModeMenu extends Component {
  /**
   * {{open, modes, mode, onChangeMode, onRequestClose, onError}} props
   */
  render () {
    if (this.props.open) {
      const items = this.props.modes.map(mode => {
        return h('button', {
          key: mode,
          title: `Switch to ${mode} mode`,
          className: 'jsoneditor-menu-button jsoneditor-type-modes' +
              ((mode === this.props.mode) ? ' jsoneditor-selected' : ''),
          onClick: () => {
            try {
              this.props.onRequestClose()
              this.props.onChangeMode(mode)
            }
            catch (err) {
              this.props.onError(err)
            }
          }
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

  componentDidMount () {
    this.updateRequestCloseListener()
  }

  componentDidUpdate () {
    this.updateRequestCloseListener()
  }

  componentWillUnmount () {
    // remove on next tick, since a listener can be created on next tick too
    setTimeout(() => this.removeRequestCloseListener())
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
    // Attach event listener on next tick, else the current click to open
    // the menu will immediately result in requestClose event as well
    setTimeout(() => {
      if (!this.handleRequestClose) {
        this.handleRequestClose = (event) => {
          if (!findParentWithAttribute(event.target, 'data-menu', 'true')) {
            this.props.onRequestClose()
          }
        }
        window.addEventListener('click', this.handleRequestClose)
      }
    })
  }

  removeRequestCloseListener () {
    if (this.handleRequestClose) {
      window.removeEventListener('click', this.handleRequestClose)
      this.handleRequestClose = null
    }
  }

  handleRequestClose = null
}