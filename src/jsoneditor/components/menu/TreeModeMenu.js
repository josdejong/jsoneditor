import { createElement as h, PureComponent } from 'react'
import ModeButton from './ModeButton'
import Search from './Search'
import PropTypes from 'prop-types'

const SEARCH_DEBOUNCE = 300      // milliseconds

export default class TreeModeMenu extends PureComponent {

  static propTypes = {
    mode: PropTypes.string.isRequired,
    modes: PropTypes.arrayOf(PropTypes.string),
    onChangeMode: PropTypes.func.isRequired,

    onExpandAll: PropTypes.func.isRequired,
    onCollapseAll: PropTypes.func.isRequired,

    enableHistory: PropTypes.bool,
    canUndo: PropTypes.bool,
    canRedo: PropTypes.bool,
    onUndo: PropTypes.func,
    onRedo: PropTypes.func,

    enableSearch: PropTypes.bool,
    searchResult: PropTypes.string,
    onSearch: PropTypes.func,
    onSearchNext: PropTypes.func,
    onSearchPrevious: PropTypes.func,

    findKeyBinding: PropTypes.func.isRequired,
  }

  render () {
    let items = [
      h('button', {
        key: 'expand-all',
        className: 'jsoneditor-expand-all',
        title: 'Expand all objects and arrays',
        onClick: this.props.onExpandAll
      }),
      h('button', {
        key: 'collapse-all',
        className: 'jsoneditor-collapse-all',
        title: 'Collapse all objects and arrays',
        onClick: this.props.onCollapseAll
      })
    ]

    if (this.props.mode !== 'view' && this.props.enableHistory !== false) {
      items = items.concat([
        h('div', {key: 'history-separator', className: 'jsoneditor-vertical-menu-separator'}),

        h('button', {
          key: 'undo',
          className: 'jsoneditor-undo',
          title: 'Undo last action',
          disabled: !this.props.canUndo,
          onClick: this.props.onUndo
        }),
        h('button', {
          key: 'redo',
          className: 'jsoneditor-redo',
          title: 'Redo',
          disabled: !this.props.canRedo,
          onClick: this.props.onRedo
        })
      ])
    }

    if (this.props.modes ) {
      items = items.concat([
        h('div', {key: 'mode-separator', className: 'jsoneditor-vertical-menu-separator'}),

        h(ModeButton, {
          key: 'mode',
          modes: this.props.modes,
          mode: this.props.mode,
          onChangeMode: this.props.onChangeMode,
          onError: this.props.onError
        })
      ])
    }

    if (this.props.enableSearch !== false) {
      // option search is true or undefined
      items = items.concat([
        h('div', {key: 'search', className: 'jsoneditor-menu-panel-right'},
            h(Search, {
              text: this.props.searchResult.text,
              resultCount: this.props.searchResult.matches ? this.props.searchResult.matches.length : 0,
              onChange: this.props.onSearch,
              onNext: this.props.onSearchNext,
              onPrevious: this.props.onSearchPrevious,
              findKeyBinding: this.props.findKeyBinding,
              delay: SEARCH_DEBOUNCE
            })
        )
      ])
    }

    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, items)
  }
}