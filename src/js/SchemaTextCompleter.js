'use strict'

import jsonMap from 'json-source-map'
import {
  isArray,
  isObject,
} from './util'

/**
 * SchemaTextCompleter is a completer object that implements the 
 * ace ext-language_tools completer API, and suggests completions for the text editor
 * according to the cursor position and the json schema
 */
export class SchemaTextCompleter {
  constructor (schema, schemaRefs) {
    const paths = {};
    this._buildSuggestions(paths, schema, schemaRefs);
    setTimeout(()=> console.log('TEMP collected paths', paths), 1000);
  }

  _buildSuggestions (paths, schema, schemaRefs) {
    this._handleSchemaEntry(paths, "/" , schema);
  }

  _handleSchemaEntry(paths, currectPath, schemaNode) {
    switch(schemaNode.type) {
      case 'object':
        this._handleObject(paths, currectPath, schemaNode)
        break;
      case 'string':
      case 'number':
      case 'integer':
        this._handlePrimitive(paths, currectPath, schemaNode)
        break;
    }
  }

  _handleObject(paths, currectPath, schemaNode) {
    if (isObject(schemaNode.properties)) {
      const props = Object.keys(schemaNode.properties);
      paths[currectPath] = paths[currectPath] || [];
      paths[currectPath].push({
        val: props,
        type: 'props'
      })
      props.forEach((prop) => {
        setTimeout(() => {
          this._handleSchemaEntry(paths, `${currectPath}${prop}/`,schemaNode.properties[prop]);
        })
      })
    }
  }

  _handlePrimitive(paths, currectPath, schemaNode) {
    if (isArray(schemaNode.examples)) {
      paths[currectPath] = paths[currectPath] || [];
      paths[currectPath].push({
        val: schemaNode.examples,
        type: 'examples'
      })
    }
    if (isArray(schemaNode.enum)) {
      paths[currectPath] = paths[currectPath] || [];
      paths[currectPath].push({
        val: schemaNode.enum,
        type: 'enum'
      })
    }
  }

  getCompletions (editor, session, pos, prefix, callback) {
    jsonMap.parse(session.getValue());  // use jsonmasp to determine the editor text in the json 
    callback(null, [{
      caption: "salary",
      meta: "schema",
      score: 9,
      value: "salary",
    },
    {
      caption: "salaries",
      meta: "schema",
      score: 10,
      value: "salaries",
    }]);
  }

}
