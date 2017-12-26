import React, { Component } from 'react'
import './App.css'

// Load the react version of JSONEditor
//
// When installed via npm, import as:
//
//     import JSONEditor from 'jsoneditor/react'
//
import JSONEditor from 'jsoneditor/lib/components/JSONEditor'


const json =  {
  'array': [1, 2, 3],
  'boolean': true,
  'null': null,
  'number': 123,
  'object': {'a': 'b', 'c': 'd'},
  'string': 'Hello World'
}

class App extends Component {
  state = {
    json
  }

  render() {
    return (
      <div className="app">
        <h1>JSONEditor React demo</h1>
        <JSONEditor
            mode="tree"
            modes={['text', 'code', 'tree', 'form', 'view']}
            json={this.state.json}
            onChange={this.onChange}
            onChangeText={this.onChangeText}
        />
      </div>
    )
  }

  onChange = (json) => {
    console.log('onChange', json)
  }

  onChangeText = (text) => {
    console.log('onChangeText', text)

    this.setState({ text })
  }
}

export default App
