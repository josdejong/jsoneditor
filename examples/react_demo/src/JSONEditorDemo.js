import React, {Component} from 'react';

import * as JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

import './JSONEditorDemo.css';

export default class JSONEditorDemo extends Component {
  componentDidMount () {
    const options = {
      mode: 'tree',
      modes: ['tree', 'code'],
      onChange: this.onChange
    };

    this.jsoneditor = new JSONEditor(this.container, options);
    this.jsoneditor.set(this.props.json);
  }

  componentWillUnmount () {
    if (this.jsoneditor) {
      this.jsoneditor.destroy();
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.jsoneditor.update(nextProps.json)
  }

  render() {
    return (
        <div className="jsoneditor-react-container" ref={elem => this.container = elem} />
    );
  }

  onChange = () => {
    if (this.props.onChange) {
      // note that this.jsoneditor.get() can fail in mode text/code
      // when the contents is no valid JSON object.
      // So if you need mode text/node, you must use getText() and setText().
      this.props.onChange(this.jsoneditor.get());
    }
  }
}
