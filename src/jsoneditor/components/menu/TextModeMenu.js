import { createElement as h, PureComponent } from 'react'
import ModeButton from './ModeButton'
import PropTypes from 'prop-types'

import fontawesome from '@fortawesome/fontawesome'
import faAlignLeft from '@fortawesome/fontawesome-free-solid/faAlignLeft'
import faAlignJustify from '@fortawesome/fontawesome-free-solid/faAlignJustify'
import faScrewdriver from '@fortawesome/fontawesome-free-solid/faScrewdriver'

import './Menu.css'

fontawesome.library.add(faAlignLeft, faAlignJustify, faScrewdriver)

export default class TreeModeMenu extends PureComponent {

  static propTypes = {
    mode: PropTypes.string.isRequired,
    modes: PropTypes.arrayOf(PropTypes.string),
    onChangeMode: PropTypes.func.isRequired,

    onFormat: PropTypes.func.isRequired,
    onCompact: PropTypes.func.isRequired,
    onRepair: PropTypes.func.isRequired
  }

  render () {
    let items = []

    // mode
    if (this.props.modes ) {
      items = items.concat([
        h('div', {className: 'jsoneditor-menu-group'}, [
          h(ModeButton, {
            key: 'mode',
            modes: this.props.modes,
            mode: this.props.mode,
            onChangeMode: this.props.onChangeMode,
            onError: this.props.onError
          })
        ])
      ])
    }

    // format / compact / repair
    items = items.concat([
      h('button', {
        key: 'format',
        className: 'jsoneditor-format',
        title: 'Format the JSON document',
        onClick: this.props.onFormat
      }, h('i', {className: 'fa fa-align-left'})),
      h('button', {
        key: 'compact',
        className: 'jsoneditor-compact',
        title: 'Compact the JSON document',
        onClick: this.props.onCompact
      }, h('i', {className: 'fa fa-align-justify'})),
      h('button', {
        key: 'repair',
        className: 'jsoneditor-repair',
        title: 'Repair the JSON document',
        onClick: this.props.onRepair
      }, h('i', {className: 'fa fa-screwdriver'})),
    ])

    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, items)
  }
}