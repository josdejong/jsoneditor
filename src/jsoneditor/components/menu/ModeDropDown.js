import { createElement as h, Component } from 'react'
import { toCapital } from '../../utils/stringUtils'

import fontawesome from '@fortawesome/fontawesome'
import faChevronDown from '@fortawesome/fontawesome-free-solid/faChevronDown'
import { keyComboFromEvent } from '../../utils/keyBindings'

import './Menu.css'

fontawesome.library.add(faChevronDown)

const MENU_CLASS_NAME = 'jsoneditor-actionmenu'
const MODE_MENU_CLASS_NAME = MENU_CLASS_NAME + ' jsoneditor-modemenu'

export default class ModeDropDown extends Component {
  constructor (props) {
    super (props)

    this.state = {
      open: false   // whether the menu is open or not
    }
  }

  componentWillUnmount () {
    this.removeRequestCloseListener()
  }

  /**
   * props {{modes: string[], mode: string, onChangeMode: function, onError: function}}
   */
  render () {
    return h('div', {className: 'jsoneditor-modes'}, [
      h('button', {
        key: 'button',
        className: 'current-mode',
        title: 'Switch mode',
        onClick: this.handleOpen
      }, [
          toCapital(this.props.mode) + '  ',
          h('i', { key: 'icon', className: 'fa fa-chevron-down' })
      ]),

      this.renderDropDown()
    ])
  }

  handleOpen = () => {
    this.setState({open: true})

    this.addRequestCloseListener()

    setTimeout(() => this.focusToFirstEntry())
  }

  handleRequestClose = () => {
    this.setState({open: false})

    this.removeRequestCloseListener()
  }

  /**
   * {{open, modes, mode, onChangeMode, onRequestClose, onError}} props
   */
  renderDropDown () {
    if (this.state.open) {
      const items = this.props.modes.map(mode => {
        return h('button', {
          key: mode,
          title: `Switch to ${mode} mode`,
          className: 'jsoneditor-menu-button jsoneditor-type-modes' +
              ((mode === this.props.mode) ? ' jsoneditor-selected' : ''),
          onClick: () => {
            try {
              this.handleRequestClose()

              this.props.onChangeMode(mode)
            }
            catch (err) {
              this.props.onError(err)
            }
          }
        }, toCapital(mode))
      })

      return h('div', {
        key: 'dropdown',
        className: MODE_MENU_CLASS_NAME,
        ref: 'menu',
        onKeyDown: this.handleKeyDown
      }, items)
    }
    else {
      return null
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

  addRequestCloseListener () {
    // Attach event listener on next tick, else the current click to open
    // the menu will immediately result in requestClose event as well
    setTimeout(() => {
      if (!this.handleWindowRequestClose) {
        this.handleWindowRequestClose = this.handleRequestClose
        window.addEventListener('click', this.handleWindowRequestClose)
      }
    })
  }

  removeRequestCloseListener () {
    if (this.handleWindowRequestClose) {
      window.removeEventListener('click', this.handleWindowRequestClose)
      this.handleWindowRequestClose = null
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

  handleWindowRequestClose = null
}
