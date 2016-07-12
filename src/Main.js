import { h, Component } from 'preact'
import setIn from './utils/setIn'
import JSONNode from './JSONNode'

export default class Main extends Component {
  constructor (props) {
    super(props)

    this.state = {
      json: props.json || {}
    }

    this.onChangeValue = this.onChangeValue.bind(this)
  }

  render(props, state) {
    return h('div', {class: 'jsoneditor', onInput: this.onInput}, [
      h('ul', {class: 'jsoneditor-list'}, [
        h(JSONNode, {parent: null, field: null, value: state.json, onChangeValue: this.onChangeValue})
      ])
    ])
  }

  onChangeValue (path, value) {
    console.log('onChangeValue', path, value)
    this.setState({
      json: setIn(this.state.json, path, value)
    })
  }

  get () {
    return this.state.json
  }

  set (json) {
    this.setState({json})
  }
}
