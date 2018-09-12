import { createElement as h, PureComponent } from 'react'
import ModeButton from './ModeButton'
import PropTypes from 'prop-types'

import fontawesome from '@fortawesome/fontawesome'
import faPlusSquare from '@fortawesome/fontawesome-free-solid/faPlusSquare'
import faMinusSquare from '@fortawesome/fontawesome-free-solid/faMinusSquare'
import faCut from '@fortawesome/fontawesome-free-solid/faCut'
import faCopy from '@fortawesome/fontawesome-free-solid/faCopy'
import faPaste from '@fortawesome/fontawesome-free-solid/faPaste'
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus'
import faClone from '@fortawesome/fontawesome-free-solid/faClone'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import faUndo from '@fortawesome/fontawesome-free-solid/faUndo'
import faRedo from '@fortawesome/fontawesome-free-solid/faRedo'
import faSortAmountDown from '@fortawesome/fontawesome-free-solid/faSortAmountDown'
import faFilter from '@fortawesome/fontawesome-free-solid/faFilter'
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch'

import './Menu.css'

fontawesome.library.add(
    faPlusSquare, faMinusSquare,
    faCut, faCopy, faPaste,
    faPlus, faClone, faTimes,
    faUndo, faRedo,
    faSortAmountDown, faFilter, faSearch
)

export default class TreeModeMenu extends PureComponent {

  static propTypes = {
    mode: PropTypes.string.isRequired,
    modes: PropTypes.arrayOf(PropTypes.string),
    onChangeMode: PropTypes.func.isRequired,

    canCut: PropTypes.bool.isRequired,
    canCopy: PropTypes.bool.isRequired,
    canPaste: PropTypes.bool.isRequired,
    onCut: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,

    enableHistory: PropTypes.bool,
    canUndo: PropTypes.bool,
    canRedo: PropTypes.bool,
    onUndo: PropTypes.func,
    onRedo: PropTypes.func,

    onToggleSearch: PropTypes.func
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

    // cut / copy / paste
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group'}, [
        h('button', {
          key: 'cut',
          className: 'jsoneditor-cut',
          title: 'Cut current selection',
          disabled: !this.props.canCut,
          onClick: this.props.onCut
        }, h('i', {className: 'fa fa-cut'})),
        h('button', {
          key: 'copy',
          className: 'jsoneditor-copy',
          title: 'Copy current selection',
          // disabled: !this.props.canPaste,
          onClick: this.props.onPaste
        }, h('i', {className: 'fa fa-copy'})),
        h('button', {
          key: 'paste',
          className: 'jsoneditor-paste',
          title: 'Paste copied selection',
          // disabled: !this.props.canPaste,
          onClick: this.props.onPaste
        }, h('i', {className: 'fa fa-paste'}))
      ])
    ])

    // TODO: [insert structure / insert value / insert array / insert object] / duplicate / remove
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group'}, [
        h('button', {
          key: 'insert',
          className: 'jsoneditor-insert',
          title: 'Insert new contents',
          onClick: this.props.onInsert
        }, h('i', {className: 'fa fa-plus'})),
        h('button', {
          key: 'duplicate',
          className: 'jsoneditor-duplicate',
          title: 'Duplicate current selection',
          disabled: !this.props.canDuplicate,
          onClick: this.props.onDuplicate
        }, h('i', {className: 'fa fa-clone'})),
        h('button', {
          key: 'remove',
          className: 'jsoneditor-remove',
          title: 'Remove selection',
          disabled: !this.props.canRemove,
          onClick: this.props.onRemove
        }, h('i', {className: 'fa fa-times'}))
      ])
    ])

    // sort / transform
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group'}, [
        h('button', {
          key: 'sort',
          className: 'jsoneditor-sort',
          title: 'Sort contents',
          onClick: this.props.onSort // TODO: implement onSort
        }, h('i', {className: 'fa fa-sort-amount-down'})),
        h('button', {
          key: 'transform',
          className: 'jsoneditor-transform',
          title: 'Transform contents',
          // disabled: !this.props.canPaste,
          onClick: this.props.onTransform
        }, h('i', {className: 'fa fa-filter'})),
        h('button', {
          key: 'search',
          className: 'jsoneditor-search',
          title: 'Search and replace',
          onClick: this.props.onToggleSearch
        }, h('i', {className: 'fa fa-search'}))
      ])
    ])

    // undo / redo
    if (this.props.mode !== 'view' && this.props.enableHistory !== false) {
      items = items.concat([
        h('div', {className: 'jsoneditor-menu-group'}, [
          h('button', {
            key: 'undo',
            className: 'jsoneditor-undo',
            title: 'Undo last action',
            disabled: !this.props.canUndo,
            onClick: this.props.onUndo
          }, h('i', {className: 'fa fa-undo'})),
          h('button', {
            key: 'redo',
            className: 'jsoneditor-redo',
            title: 'Redo',
            disabled: !this.props.canRedo,
            onClick: this.props.onRedo
          }, h('i', {className: 'fa fa-redo'}))
        ])
      ])
    }

    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, items)
  }
}