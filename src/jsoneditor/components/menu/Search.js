import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import { keyComboFromEvent } from '../../utils/keyBindings'
import { findEditorContainer, setSelection } from '../utils/domSelector'

import fontawesome from '@fortawesome/fontawesome'
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch'
import faCaretUp from '@fortawesome/fontawesome-free-solid/faCaretUp'
import faCaretDown from '@fortawesome/fontawesome-free-solid/faCaretDown'

import './Menu.css'

import './Search.css'

fontawesome.library.add(faSearch, faCaretUp, faCaretDown)

export default class Search extends Component {
  constructor (props) {
    super (props)

    this.state = {
      text: props.text || ''
    }
  }

  render () {
    return h('div', {className: 'jsoneditor-search'}, [
      h('form', {
        key: 'box',
        className: 'jsoneditor-search-box',
        onSubmit: this.handleSubmit
      }, [
          h('div', { className: 'jsoneditor-search-icon' }, [
            h('i', {className: 'fa fa-search'})
          ]),
          h('input', {
            key: 'input',
            type: 'text',
            className: 'jsoneditor-search-text',
            value: this.state.text,
            onInput: this.handleChange,
            onKeyDown: this.handleKeyDown
          }),
          h('button', {
            key: 'next',
            type: 'button',
            className: 'jsoneditor-search-next',
            title: 'Next result',
            onClick: this.props.onNext
          }, h('i', {className: 'fa fa-caret-down'})),
          h('button', {
            key: 'previous',
            type: 'button',
            className: 'jsoneditor-search-previous',
            title: 'Previous result',
            onClick: this.props.onPrevious
          }, h('i', {className: 'fa fa-caret-up'}))
      ]),
      this.renderResultsCount(this.props.resultCount)
    ])
  }

  renderResultsCount (resultCount) {
    if (resultCount === 0) {
      return null
    }

    if (resultCount === 0) {
      return h('div', {key: 'count', className: 'jsoneditor-search-results'}, '(no results)')
    }

    if (resultCount > 0) {
      const suffix = resultCount === 1 ? ' result' : ' results'

      return h('div', {key: 'count', className: 'jsoneditor-search-results'}, resultCount + suffix)
    }

    return null
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.text !== this.props.text) {
      // clear a pending onChange callback (if any)
      clearTimeout(this.timeout)
    }
  }

  handleSubmit = (event) => {
    if (this.timeout !== null) {
      // there is a pending change
      this.debouncedOnChange()
    }
    else {
      // no pending change, go to next result
      this.props.onNext(event)
    }
  }

  handleChange = (event) => {
    const text = event.target.value

    this.setState ({ text })

    const delay = this.props.delay || 0
    this.timeout = setTimeout(this.debouncedOnChange, delay)
  }

  handleKeyDown = (event) => {
    // TODO: make submit (Enter) and focus to search result (Ctrl+Enter) customizable
    const combo = keyComboFromEvent(event)
    if (combo === 'Ctrl+Enter' || combo === 'Command+Enter') {
      event.preventDefault()
      const active = this.props.searchResults[0]
      if (active) {
        const container = findEditorContainer(event.target)
        setSelection(container, active.path, active.type)
      }
    }
  }

  debouncedOnChange = () => {
    clearTimeout(this.timeout)
    this.timeout = null

    this.props.onChange(this.state.text)
  }

  timeout = null
}

Search.propTypes = {
  text: PropTypes.string,
  resultsCount: PropTypes.number,
  onChange: PropTypes.func,
  onPrevious: PropTypes.func,
  onNext: PropTypes.func,
}
