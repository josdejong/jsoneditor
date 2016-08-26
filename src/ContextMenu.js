import { h, Component } from 'preact'

export let CONTEXT_MENU_HEIGHT = 240

export default class ContextMenu extends Component {
  constructor(props) {
    super(props)

    // determine orientation
    const anchorRect = this.props.anchor.getBoundingClientRect()
    const rootRect = this.props.root.getBoundingClientRect()
    const orientation = (rootRect.bottom - anchorRect.bottom < CONTEXT_MENU_HEIGHT &&
            anchorRect.top - rootRect.top > CONTEXT_MENU_HEIGHT)
        ? 'top'
        : 'bottom'

    this.state = {
      orientation,
      expanded: null,   // menu index of expanded menu item
      expanding: null,  // menu index of expanding menu item
      collapsing: null  // menu index of collapsing menu item
    }

    this.renderMenuItem = this.renderMenuItem.bind(this)
  }
  
  render () {
    if (!this.props.items) {
      return null
    }

    // TODO: create a non-visible button to set the focus to the menu
    // TODO: implement (customizable) quick keys

    const className = 'jsoneditor-contextmenu ' +
        ((this.state.orientation === 'top') ? 'jsoneditor-contextmenu-top' : 'jsoneditor-contextmenu-bottom')

    return h('div', {class: className},
      this.props.items.map(this.renderMenuItem)
    )
  }

  renderMenuItem (item, index) {
    if (item.type === 'separator') {
      return h('div', {class: 'jsoneditor-menu-separator'})
    }

    if (item.click && item.submenu) {
      // two buttons: direct click and a small button to expand the submenu
      return h('div', {class: 'jsoneditor-menu-item'}, [
          h('button', {class: 'jsoneditor-menu-button jsoneditor-menu-default ' + item.className, title: item.title, onClick: item.click }, [
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
      // just a button (no submenu)
      return h('div', {class: 'jsoneditor-menu-item'}, [
        h('button', {class: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick: item.click }, [
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
      return h('div', {class: 'jsoneditor-menu-item'}, [
        h('button', {class: 'jsoneditor-menu-button ' + item.className, title: item.title, onClick: item.click }, [
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
}
