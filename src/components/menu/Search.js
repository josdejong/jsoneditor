import { createElement as h, Component } from 'react'

import '!style!css!less!./Search.less'

export default class Search extends Component {
  constructor (props) {
    super (props)

    this.state = {
      text: props.text || ''
    }
  }

  render () {
    // TODO: show number of search results left from the input box
    // TODO: prev/next
    // TODO: focus on search results
    // TODO: expand the focused search result if not expanded

    return h('div', {className: 'jsoneditor-search'},
      h('input', {type: 'text', value: this.state.text, onInput: this.handleChange})
    )
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.text !== this.props.text) {
      // clear a pending onChange callback (if any
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