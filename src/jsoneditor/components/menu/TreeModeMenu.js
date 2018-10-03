import isEmpty from 'lodash/isEmpty'
import { createElement as h, PureComponent } from 'react'
import DropDown from './DropDown'
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
    selection: PropTypes.object,
    clipboard: PropTypes.array,
    history: PropTypes.array,

    mode: PropTypes.string.isRequired,
    modes: PropTypes.arrayOf(PropTypes.string),
    onChangeMode: PropTypes.func.isRequired,

    onCut: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,

    onInsert: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,

    onSort: PropTypes.func.isRequired,
    onTransform: PropTypes.func.isRequired,
    onToggleSearch: PropTypes.func,

    enableHistory: PropTypes.bool,
    onUndo: PropTypes.func,
    onRedo: PropTypes.func
  }

  render () {
    let items = []

    const { selection, clipboard } = this.props
    const hasCursor = selection && selection.type !== 'none'
    const hasSelectedContent = selection ? !isEmpty(selection.multi) : false
    const hasClipboard = clipboard ? (clipboard.length > 0) : false

    // mode
    if (this.props.modes ) {
      items = items.concat([
        h('div', {className: 'jsoneditor-menu-group', key: 'mode'}, [
          h(DropDown, {
            key: 'mode',
            title: 'Switch mode',
            options: this.props.modes.map(mode => ({
              value: mode,
              text: mode,
              title: `Switch to ${mode} mode`
            })),
            value: this.props.mode,
            onChange: this.props.onChangeMode,
            onError: this.props.onError
          })
        ])
      ])
    }

    // cut / copy / paste
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group', key: 'cut-copy-paste'}, [
        h('button', {
          key: 'cut',
          className: 'jsoneditor-cut',
          title: 'Cut current selection',
          disabled: !hasSelectedContent,
          onClick: this.props.onCut
        }, h('i', {className: 'fa fa-cut'})),
        h('button', {
          key: 'copy',
          className: 'jsoneditor-copy',
          title: 'Copy current selection',
          disabled: !hasSelectedContent,
          onClick: this.props.onCopy
        }, h('i', {className: 'fa fa-copy'})),
        h('button', {
          key: 'paste',
          className: 'jsoneditor-paste',
          title: 'Paste copied selection',
          disabled: !(hasClipboard && hasCursor),
          onClick: this.props.onPaste
        }, h('i', {className: 'fa fa-paste'}))
      ])
    ])

    // [insert structure / insert value / insert array / insert object] / duplicate / remove
    // TODO: disable options of insert
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group', key: 'insert-duplicate-remove'}, [
        h(DropDown, {
          key: 'insert',
          text: h('i', {className: 'fa fa-plus'}),
          options: INSERT_OPTIONS,
          onChange: this.props.onInsert,
          onError: this.props.onError
        }),
        h('button', {
          key: 'duplicate',
          className: 'jsoneditor-duplicate',
          title: 'Duplicate current selection',
          disabled: !hasSelectedContent,
          onClick: this.props.onDuplicate
        }, h('i', {className: 'fa fa-clone'})),
        h('button', {
          key: 'remove',
          className: 'jsoneditor-remove',
          title: 'Remove selection',
          disabled: !hasSelectedContent,
          onClick: this.props.onRemove
        }, h('i', {className: 'fa fa-times'}))
      ])
    ])

    // sort / transform
    items = items.concat([
      h('div', {className: 'jsoneditor-menu-group', key: 'sort-transform'}, [
        h('button', {
          key: 'sort',
          className: 'jsoneditor-sort',
          title: 'Sort contents',
          // disabled: !this.props.canSort, // TODO: can sort
          onClick: this.props.onSort
        }, h('i', {className: 'fa fa-sort-amount-down'})),
        h('button', {
          key: 'transform',
          className: 'jsoneditor-transform',
          title: 'Transform contents',
          // disabled: !this.props.canTransform, // TODO canTransform
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
      const canUndo = this.props.historyIndex < this.props.history.length
      const canRedo = this.props.historyIndex > 0

      items = items.concat([
        h('div', {className: 'jsoneditor-menu-group', key: 'undo-redo'}, [
          h('button', {
            key: 'undo',
            className: 'jsoneditor-undo',
            title: 'Undo last action',
            disabled: !canUndo,
            onClick: this.props.onUndo
          }, h('i', {className: 'fa fa-undo'})),
          h('button', {
            key: 'redo',
            className: 'jsoneditor-redo',
            title: 'Redo',
            disabled: !canRedo,
            onClick: this.props.onRedo
          }, h('i', {className: 'fa fa-redo'}))
        ])
      ])
    }

    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, items)
  }
}

const INSERT_OPTIONS = [
  { value: 'structure', text: 'Insert structure' },
  { value: 'value', text: 'Insert value' },
  { value: 'object', text: 'Insert object' },
  { value: 'array', text: 'Insert array' }
]
