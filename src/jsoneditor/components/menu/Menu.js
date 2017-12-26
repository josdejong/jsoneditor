import { createElement as h, Component } from 'react'
import { keyComboFromEvent } from '../../utils/keyBindings'
import { findParentWithClassName } from '../../utils/domUtils'

export let CONTEXT_MENU_HEIGHT = 240

const MENU_CLASS_NAME = 'jsoneditor-actionmenu'
const MENU_ITEM_CLASS_NAME = 'jsoneditor-menu-item'

export default class Menu extends Component {

  /**
   * @param {{open: boolean, items: Array, anchor, root, onRequestClose: function}} props
   */
  constructor(props) {
    super(props)

    this.state = {
      expanded: null,   // menu index of expanded menu item
      expanding: null,  // menu index of expanding menu item
      collapsing: null  // menu index of collapsing menu item
    }
  }

  render () {
    if (!this.props.open) {
      return null
    }

    // determine orientation
    const anchorRect = this.props.anchor.getBoundingClientRect()
    const rootRect = this.props.root.getBoundingClientRect()
    const orientation = (rootRect.bottom - anchorRect.bottom < CONTEXT_MENU_HEIGHT &&
    anchorRect.top - rootRect.top > CONTEXT_MENU_HEIGHT)
        ? 'top'
        : 'bottom'

    // TODO: create a non-visible button to set the focus to the menu

    const className = MENU_CLASS_NAME + ' ' +
        ((orientation === 'top') ? 'jsoneditor-actionmenu-top' : 'jsoneditor-actionmenu-bottom')

    return h('div', {
      className: className,
      ref: 'menu',
      onKeyDown: this.handleKeyDown
    },
      this.props.items.map(this.renderMenuItem)
    )
  }

  renderMenuItem = (item, index) => {
    if (item.type === 'separator') {
      return h('div', {key: index, className: 'jsoneditor-menu-separator'})
    }

    if (item.click && item.submenu) {
      // FIXME: don't create functions in the render function
      const onClick = (event) => {
        item.click()
        this.props.onRequestClose()
      }

      // two buttons: direct click and a small button to expand the submenu
      return h('div', {key: index, className: 'jsoneditor-menu-item'}, [
          h('button', {key: 'default', className: 'jsoneditor-menu-button jsoneditor-menu-default ' + item.className, title: item.title, onClick }, [
            h('span', {key: 'icon', className: 'jsoneditor-icon'}),
            h('span', {key: 'text', className: 'jsoneditor-text'}, item.text)
          ]),
          h('button', {key: 'expand', className: 'jsoneditor-menu-button jsoneditor-menu-expand', onClick: this.createExpandHandler(index) },
            h('span', {className: 'jsoneditor-icon jsoneditor-icon-expand'})
          ),
          this.renderSubMenu(item.submenu, index)
      ])
    }
    else if (item.submenu) {
      // button expands the submenu
      return h('div', {key: index, className: 'jsoneditor-menu-item'}, [
        h('button', {key: 'default', className: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick: this.createExpandHandler(index) }, [
          h('span', {key: 'icon', className: 'jsoneditor-icon'}),
          h('span', {key: 'text', className: 'jsoneditor-text'}, item.text),
          h('span', {key: 'expand', className: 'jsoneditor-icon jsoneditor-icon-expand'}),
        ]),
        this.renderSubMenu(item.submenu, index)
      ])
    }
    else {
      // FIXME: don't create functions in the render function
      const onClick = (event) => {
        item.click()
        this.props.onRequestClose()
      }

      // just a button (no submenu)
      return h('div', {key: index, className: 'jsoneditor-menu-item'},
        h('button', {className: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick }, [
          h('span', {key: 'icon', className: 'jsoneditor-icon'}),
          h('span', {key: 'text', className: 'jsoneditor-text'}, item.text)
        ]),
      )
    }
  }

  /**
   * @param {Array} submenu
   * @param {number} index
   */
  renderSubMenu (submenu, index) {
    const expanded = this.state.expanded === index
    const collapsing = this.state.collapsing === index

    const contents = submenu.map((item, index) => {
      // FIXME: don't create functions in the render function
      const onClick = () => {
        item.click()
        this.props.onRequestClose()
      }

      return h('div', {key: index, className: 'jsoneditor-menu-item'},
        h('button', {className: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick }, [
          h('span', {key: 'icon', className: 'jsoneditor-icon'}),
          h('span', {key: 'text', className: 'jsoneditor-text'}, item.text)
        ]),
      )
    })

    const className = 'jsoneditor-submenu ' +
        (expanded ? ' jsoneditor-expanded' : '') +
        (collapsing ? ' jsoneditor-collapsing' : '')

    return h('div', {key: 'submenu', className: className}, contents)
  }

  createExpandHandler (index) {
    return (event) => {
      event.stopPropagation()

      const prev = this.state.expanded

      this.setState({
        expanded: (prev === index) ? null : index,
        collapsing: prev
      })

      // timeout after unit is collapsed
      setTimeout(() => {
        if (prev === this.state.collapsing) {
          this.setState({
            collapsing: null
          })
        }
      }, 300)
    }
  }

  componentDidMount () {
    this.updateRequestCloseListener()

    if (this.props.open) {
      this.focusToFirstEntry ()
    }
  }

  componentDidUpdate (prevProps, prevState) {
    this.updateRequestCloseListener()

    if (this.props.open && !prevProps.open) {
      this.focusToFirstEntry ()
    }
  }

  componentWillUnmount () {
    // remove on next tick, since a listener can be created on next tick too
    setTimeout(() => this.removeRequestCloseListener())
  }

  focusToFirstEntry () {
    if (this.refs.menu) {
      const firstButton = this.refs.menu.querySelector('button')
      if (firstButton) {
        firstButton.focus()
      }
    }
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

  handleKeyDown = (event) => {
    const combo = keyComboFromEvent (event)
    if (combo === 'Up') {
      event.preventDefault()

      const items = Menu.getItems (event.target)
      const index = items.findIndex(item => item === event.target.parentNode)
      const prev = items[index - 1]
      if (prev) {
        prev.querySelector('button').focus()
      }
    }

    if (combo === 'Down') {
      event.preventDefault()

      const items = Menu.getItems (event.target)
      const index = items.findIndex(item => item === event.target.parentNode)
      const next = items[index + 1]
      if (next) {
        next.querySelector('button').focus()
      }
    }

    if (combo === 'Left') {
      const left = event.target.previousSibling
      if (left && left.nodeName === 'BUTTON') {
        left.focus()
      }
    }

    if (combo === 'Right') {
      const right = event.target.nextSibling
      if (right && right.nodeName === 'BUTTON') {
        right.focus()
      }
    }
  }

  static getItems (element) {
    const menu = findParentWithClassName(element, MENU_CLASS_NAME)
    return Array.from(menu.querySelectorAll('.' + MENU_ITEM_CLASS_NAME))
        .filter(item => window.getComputedStyle(item).visibility === 'visible')
  }

  handleRequestClose = null
}
