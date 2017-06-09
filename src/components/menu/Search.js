// @flow weak

import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'

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
    // TODO: scroll to active search result

    return h('div', {className: 'jsoneditor-search'}, [
      this.renderResultsCount(this.props.resultsCount),
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
            onInput: this.handleChange
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

  renderResultsCount (resultsCount : ?number) {
    if (resultsCount == null) {
      return null
    }

    if (resultsCount === 0) {
      return h('div', {key: 'count', className: 'jsoneditor-results'}, '(no results)')
    }

    if (resultsCount > 0) {
      const suffix = resultsCount === 1 ? ' result' : ' results'

      return h('div', {key: 'count', className: 'jsoneditor-results'}, this.props.resultsCount + suffix)
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

    if (this.timeout != null) {
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
