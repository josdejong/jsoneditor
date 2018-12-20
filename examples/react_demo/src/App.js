import React, { Component } from 'react';

import JSONEditorDemo from './JSONEditorDemo';
import './App.css';

class App extends Component {
  state = {
    json: {
      'array': [1, 2, 3],
      'boolean': true,
      'null': null,
      'number': 123,
      'object': {'a': 'b', 'c': 'd'},
      'string': 'Hello World'
    }
  };

  render() {
    return (
      <div className="app">
        <h1>JSONEditor React demo</h1>
        <div className="contents">
          <div className="menu">
            <button onClick={this.updateTime}>
              Create/update a field "time"
            </button>
          </div>
          <JSONEditorDemo
              json={this.state.json}
              onChangeJSON={this.onChangeJSON}
          />
          <div className="code">
            <pre>
              <code>
                {JSON.stringify(this.state.json, null, 2)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  onChangeJSON = (json) => {
    this.setState({ json });
  };

  updateTime = () => {
    const time = new Date().toISOString();

    this.setState({
      json: Object.assign({}, this.state.json, { time })
    })
  };
}

export default App;
