import { h, Component } from 'preact'

export default class ContextMenu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      expanded: null,   // menu index of expanded menu item
      expanding: null,  // menu index of expanding menu item
      collapsing: null  // menu index of collapsing menu item
    }

    this.onUpdate = [] // handlers to be executed after component update

    this.renderMenuItem = this.renderMenuItem.bind(this)
  }
  
  render () {

    // TODO: create a non-visible button to set the focus to the menu
    // TODO: implement (customizable) quick keys

    // TODO: render the context menu on top when there is no space below the node

    return h('div', {class: 'jsoneditor-contextmenu'},
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
    const expanding = this.state.expanding === index
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
        (expanding ? ' jsoneditor-expanding' : '') +
        (collapsing ? ' jsoneditor-collapsing' : '')

    return h('div', {class: className}, contents)
  }

  createExpandHandler (index) {
    return (event) => {
      event.stopPropagation()

      const prev = this.state.expanded

      this.setState({
        expanded: (prev === index) ? null : index,
        expanding: null,
        collapsing: prev
      })

      this.onUpdate.push(() => {
        this.setState({
          expanding: this.state.expanded
        })
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

  componentDidUpdate () {
    this.onUpdate.forEach(handler => handler())
    this.onUpdate = []

  }
}
