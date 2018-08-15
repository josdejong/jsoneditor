import React, { Component } from 'react';
import './App.css';
import JSONEditor from '../../../dist/jsoneditor-react'

// When installed via npm, import as:
// import JSONEditor from 'jsoneditor/dist/jsoneditor-react'

const json =  {
  'array': [1, 2, 3],
  'boolean': true,
  'null': null,
  'number': 123,
  'object': {'a': 'b', 'c': 'd'},
  'string': 'Hello World'
}

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      text: JSON.stringify(json, null, 2)
    }

    this.onChange = this.onChange.bind(this)
    this.onChangeText = this.onChangeText.bind(this)
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          This example shows how to use JSONEditor in React.
        </p>
        <p>
          <JSONEditor
              mode="code"
              modes={['text', 'code', 'tree', 'form', 'view']}
              text={this.state.text}
              onChange={this.onChange}
              onChangeText={this.onChangeText}
          />
        </p>
      </div>
    )
  }
}

export default App
