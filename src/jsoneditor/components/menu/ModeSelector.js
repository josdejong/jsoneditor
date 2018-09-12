import { createElement as h, Component } from 'react'
import { toCapital } from '../../utils/stringUtils'
import { keyComboFromEvent } from '../../utils/keyBindings'

const MENU_CLASS_NAME = 'jsoneditor-actionmenu'
const MODE_MENU_CLASS_NAME = MENU_CLASS_NAME + ' jsoneditor-modemenu'

export default class ModeSelector extends Component {
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
        className: MODE_MENU_CLASS_NAME,
        ref: 'menu',
        onKeyDown: this.handleKeyDown
      }, items)
    }
    else {
      return null
    }
  }

  componentDidMount () {
    this.updateRequestCloseListener()

    if (this.props.open) {
      this.focusToFirstEntry ()
    }
  }

  componentDidUpdate (prevProps) {
    this.updateRequestCloseListener()

    if (this.props.open && !prevProps.open) {
      this.focusToFirstEntry ()
    }
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
            this.props.onRequestClose()
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

  focusToFirstEntry () {
    if (this.refs.menu) {
      const firstButton = this.refs.menu.querySelector('button')
      if (firstButton) {
        firstButton.focus()
      }
    }
  }

  handleKeyDown = (event) => {
    const combo = keyComboFromEvent (event)

    if (combo === 'Up') {
      event.preventDefault()

      if (event.target.previousSibling) {
        event.target.previousSibling.focus()
      }
    }

    if (combo === 'Down') {
      event.preventDefault()

      if (event.target.nextSibling) {
        event.target.nextSibling.focus()
      }
    }
  }

  handleRequestClose = null
}