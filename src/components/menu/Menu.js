import { h, Component } from 'preact'
import { findParentNode } from '../../utils/domUtils'

export let CONTEXT_MENU_HEIGHT = 240

export default class Menu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      expanded: null,   // menu index of expanded menu item
      expanding: null,  // menu index of expanding menu item
      collapsing: null  // menu index of collapsing menu item
    }
  }

  /**
   * @param {{open: boolean, items: Array, anchor, root, onRequestClose: function}} props
   * @param state
   * @return {*}
   */
  render (props, state) {
    if (!props.open) {
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
      class: className,
      'data-menu': 'true'
    },
      props.items.map(this.renderMenuItem)
    )
  }

  renderMenuItem = (item, index) => {
    if (item.type === 'separator') {
      return h('div', {class: 'jsoneditor-menu-separator'})
    }

    if (item.click && item.submenu) {
      // FIXME: don't create functions in the render function
      const onClick = (event) => {
        item.click()
        this.props.onRequestClose()
      }

      // two buttons: direct click and a small button to expand the submenu
      return h('div', {class: 'jsoneditor-menu-item'}, [
          h('button', {class: 'jsoneditor-menu-button jsoneditor-menu-default ' + item.className, title: item.title, onClick }, [
            h('span', {class: 'jsoneditor-icon'}),
            h('span', {class: 'jsoneditor-text'}, item.text)
          ]),
          h('button', {class: 'jsoneditor-menu-button jsoneditor-menu-expand', onClick: this.createExpandHandler(index) }, [
            h('span', {class: 'jsoneditor-icon jsoneditor-icon-expand'})
          ]),
          this.renderSubMenu(item.submenu, index)
      ])
    }
    else if (item.submenu) {
      // button expands the submenu
      return h('div', {class: 'jsoneditor-menu-item'}, [
        h('button', {class: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick: this.createExpandHandler(index) }, [
          h('span', {class: 'jsoneditor-icon'}),
          h('span', {class: 'jsoneditor-text'}, item.text),
          h('span', {class: 'jsoneditor-icon jsoneditor-icon-expand'}),
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
      return h('div', {class: 'jsoneditor-menu-item'}, [
        h('button', {class: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick }, [
          h('span', {class: 'jsoneditor-icon'}),
          h('span', {class: 'jsoneditor-text'}, item.text)
        ]),
      ])
    }
  }

  /**
   * @param {Array} submenu
   * @param {number} index
   */
  renderSubMenu (submenu, index) {
    const expanded = this.state.expanded === index
    const collapsing = this.state.collapsing === index

    const contents = submenu.map(item => {
      // FIXME: don't create functions in the render function
      const onClick = () => {
        item.click()
        this.props.onRequestClose()
      }

      return h('div', {class: 'jsoneditor-menu-item'}, [
        h('button', {class: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick }, [
          h('span', {class: 'jsoneditor-icon'}),
          h('span', {class: 'jsoneditor-text'}, item.text)
        ]),
      ])
    })

    const className = 'jsoneditor-submenu ' +
        (expanded ? ' jsoneditor-expanded' : '') +
        (collapsing ? ' jsoneditor-collapsing' : '')

    return h('div', {class: className}, contents)
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
