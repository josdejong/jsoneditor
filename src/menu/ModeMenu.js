import { h, Component } from 'preact'
import { toCapital } from '../utils/stringUtils'
import { findParentNode } from '../utils/domUtils'

export default class ModeMenu extends Component {
  /**
   * @param {{open, modes, mode, onMode, onRequestClose, onError}} props
   * @param {Object} state
   * @return {JSX.Element}
   */
  render (props, state) {
    if (props.open) {
      const items = props.modes.map(mode => {
        return h('button', {
          title: `Switch to ${mode} mode`,
          class: 'jsoneditor-menu-button jsoneditor-type-modes' +
              ((mode === props.mode) ? ' jsoneditor-selected' : ''),
          onClick: () => {
            try {
              props.onMode(mode)
              props.onRequestClose()
            }
            catch (err) {
              props.onError(err)
            }
          }
        }, toCapital(mode))
      })

      return h('div', {
        class: 'jsoneditor-actionmenu jsoneditor-modemenu',
        nodemenu: 'true',
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