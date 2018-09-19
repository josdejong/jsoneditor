import { Component, createElement as h } from 'react'
import { toCapital } from '../../utils/stringUtils'

import fontawesome from '@fortawesome/fontawesome'
import faChevronDown from '@fortawesome/fontawesome-free-solid/faChevronDown'
import { keyComboFromEvent } from '../../utils/keyBindings'
import PropTypes from 'prop-types'

import './DropDown.css'

fontawesome.library.add(faChevronDown)

export default class DropDown extends Component {

  static propTypes = {
    value: PropTypes.string,
    text: PropTypes.string,
    title: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      text: PropTypes.string,
      title: PropTypes.string,
    })).isRequired,
    onChange: PropTypes.func.isRequired,
    onError: PropTypes.func
  }

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
    const selected = this.props.options
        ? this.props.options.find(option => option.value === this.props.value)
        : null

    const selectedText = selected
        ? (selected.text || selected.value)
        : this.props.text

    return h('div', {className: 'jsoneditor-dropdown'}, [
      h('button', {
        key: 'button',
        className: 'jsoneditor-dropdown-main-button',
        title: this.props.title,
        onClick: this.handleOpen
      }, [
        typeof selectedText === 'string'
            ? toCapital(selectedText)
            : selectedText,
        '\u00A0\u00A0',
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
    if (this.state.open && this.props.options) {
      const items = this.props.options.map(option => {
        return h('button', {
          key: option.value,
          ref: 'button',
          title: (option.title || option.text || option.value),
          className: 'jsoneditor-menu-item' +
              ((option.value === this.props.value) ? ' jsoneditor-menu-item-selected' : ''),
          onClick: () => {
            try {
              this.handleRequestClose()

              this.props.onChange(option.value)
            }
            catch (err) {
              this.props.onError(err)
            }
          }
        }, toCapital(option.text || option.value || ''))
      })

      return h('div', {
        key: 'dropdown',
        className: 'jsoneditor-dropdown-list',
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

    if (combo ==='Escape') {
      this.handleRequestClose()
      setTimeout(() => this.focusToDropDownButton()) // FIXME: doesn't work
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

  focusToDropDownButton() {
    if (this.refs.button) {
      this.refs.button.focus()
    }
  }

  handleWindowRequestClose = null
}
