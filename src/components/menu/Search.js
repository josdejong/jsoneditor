// @flow weak

import { createElement as h, Component, PropTypes } from 'react'

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
    // TODO: focus on search results
    // TODO: expand the focused search result if not expanded

    return h('div', {className: 'jsoneditor-search'}, [
      this.renderResultsCount(this.props.resultsCount),
      h('div', {key: 'box', className: 'jsoneditor-search-box'}, [
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

  renderResultsCount (resultsCount : number | null) {
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

  handleChange = (event) => {
    const text = event.target.value

    this.setState ({ text })

    const delay = this.props.delay || 0
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.callbackOnChange, delay)
  }

  callbackOnChange = () => {
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
