import { createElement as h, Component } from 'react'
import { findParentNode } from '../../utils/domUtils'

export let CONTEXT_MENU_HEIGHT = 240

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
    // TODO: implement (customizable) quick keys

    const className = 'jsoneditor-actionmenu ' +
        ((orientation === 'top') ? 'jsoneditor-actionmenu-top' : 'jsoneditor-actionmenu-bottom')

    return h('div', {
      className: className,
      'data-menu': 'true',
      ref: '',
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
          if (!findParentNode(event.target, 'data-menu', 'true')) {
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
