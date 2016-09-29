import { h, Component } from 'preact'
import { toCapital } from '../utils/stringUtils'

export default class ModeMenu extends Component {
  /**
   * @param {{open, modes, mode, onMode, onError}} props
   * @param {Obect} state
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
              this.setState({ open: false })
            }
            catch (err) {
              props.onError(err)
            }
          }
        }, toCapital(mode))
      })

      return h('div', {
        class: 'jsoneditor-contextmenu jsoneditor-modemenu',
        'isnodemenu': 'true',
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
          if (!ModeMenu.inNodeMenu(event.target)) {
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

  /**
   * Test whether any of the parent nodes of this element is the root of the
   * NodeMenu (has an attribute isNodeMenu:true)
   * @param elem
   * @return {boolean}
   */
  static inNodeMenu (elem) {
    let parent = elem

    while (parent && parent.getAttribute) {
      if (parent.getAttribute('isnodemenu')) {
        return true
      }
      parent = parent.parentNode
    }

    return false
  }

  handleRequestClose = null
}