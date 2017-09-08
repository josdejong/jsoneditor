// @flow weak

import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import { keyComboFromEvent } from '../../utils/keyBindings'
import { findEditorContainer, setSelection } from '../utils/domSelector'

import '!style!css!less!./Search.less'

export default class Search extends Component {
  state: {
    text: string
  }

  constructor (props) {
    super (props)

    this.state = {
      text: props.text || ''
    }
  }

  render () {
    return h('div', {className: 'jsoneditor-search'}, [
      this.renderResultsCount(this.props.searchResults),
      h('form', {
        key: 'box',
        className: 'jsoneditor-search-box',
        onSubmit: this.handleSubmit
      }, [
          h('input', {
            key: 'input',
            type: 'text',
            className: 'jsoneditor-search-text',
            value: this.state.text,
            onInput: this.handleChange,
            onKeyDown: this.handleKeyDown
          }),
          h('input', {
            key: 'next',
            type: 'button',
            className: 'jsoneditor-search-next',
            title: 'Next result',
            onClick: this.props.onNext
          }),
          h('input', {
            key: 'previous',
            type: 'button',
            className: 'jsoneditor-search-previous',
            title: 'Previous result',
            onClick: this.props.onPrevious
          })
      ])
    ])
  }

  renderResultsCount (searchResults : []) {
    if (!searchResults) {
      return null
    }

    const count = searchResults.length

    if (count === 0) {
      return h('div', {key: 'count', className: 'jsoneditor-results'}, '(no results)')
    }

    if (count > 0) {
      const suffix = count === 1 ? ' result' : ' results'

      return h('div', {key: 'count', className: 'jsoneditor-results'}, count + suffix)
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
    event.stopPropagation()
    event.preventDefault()

    if (this.timeout !== null) {
      // there is a pending change
      this.debouncedOnChange()
    }
    else {
      // no pending change, go to next result
      this.props.onNext()
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
