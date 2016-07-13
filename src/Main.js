import { h, Component } from 'preact'

import { getIn, setIn, renameField } from './utils/objectUtils'
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

  onChangeField (path, oldField, newField) {
    console.log('onChangeField', path, newField, oldField)

    const oldObject = getIn(this.state.json, path)
    const newObject = renameField(oldObject, oldField, newField)
    
    this.setState({
      json: setIn(this.state.json, path, newObject)
    })
  }

  get () {
    return this.state.json
  }

  set (json) {
    this.setState({json})
  }
}
