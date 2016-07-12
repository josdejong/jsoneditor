import { h, Component } from 'preact'
import setIn from './utils/setIn'
import getIn from './utils/getIn'
import clone from './utils/clone'
import JSONNode from './JSONNode'

export default class Main extends Component {
  constructor (props) {
    super(props)

    this.state = {
      json: props.json || {}
    }

    this.onChangeValue = this.onChangeValue.bind(this)
    this.onChangeField = this.onChangeField.bind(this)
  }

  render(props, state) {
    return h('div', {class: 'jsoneditor', onInput: this.onInput}, [
      h('ul', {class: 'jsoneditor-list'}, [
        h(JSONNode, {
          parent: null,
          field: null,
          value: state.json,
          onChangeField: this.onChangeField,
          onChangeValue: this.onChangeValue
        })
      ])
    ])
  }

  onChangeValue (path, value) {
    console.log('onChangeValue', path, value)
    this.setState({
      json: setIn(this.state.json, path, value)
    })
  }

  onChangeField (path, newField, oldField) {
    console.log('onChangeField', path, newField, oldField)
    
    const value = clone(getIn(this.state.json, path))

    console.log('value', value)

    value[newField] = value[oldField]
    delete value[oldField]

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
