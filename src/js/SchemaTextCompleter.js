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
    this.schema = schema;
    this.schemaRefs = schemaRefs || {};
    this.paths = {};
    this._buildSuggestions(this.schema);
    setTimeout(()=> console.log('TEMP collected paths', this.paths), 1000);
  }

  _buildSuggestions () {
    this._handleSchemaEntry("/" , this.schema);
  }

  _handleRef(currectPath, refName) {
    if (this.schemaRefs[refName]) {
      this._handleSchemaEntry(currectPath, this.schemaRefs[refName]);
    }
  }

  _handleSchemaEntry(currectPath, schemaNode) {
    if (schemaNode.$ref) {
      this._handleRef(currectPath, schemaNode.$ref);
      return;
    }
    switch(schemaNode.type) {
      case 'object':
        this._handleObject(currectPath, schemaNode)
        break;
      case 'string':
      case 'number':
      case 'integer':
        this._handlePrimitive(currectPath, schemaNode)
        break;
      case 'boolean':
        this._handleBoolean(currectPath, schemaNode)
    }
  }

  _handleObject(currectPath, schemaNode) {
    if (isObject(schemaNode.properties)) {
      const props = Object.keys(schemaNode.properties);
      this.paths[currectPath] = this.paths[currectPath] || [];
      this.paths[currectPath].push({
        val: props,
        type: 'props'
      })
      props.forEach((prop) => {
        setTimeout(() => {
          this._handleSchemaEntry(`${currectPath}${prop}/`,schemaNode.properties[prop]);
        })
      })
    }
  }

  _handlePrimitive(currectPath, schemaNode) {
    if (isArray(schemaNode.examples)) {
      this.paths[currectPath] = this.paths[currectPath] || [];
      this.paths[currectPath].push({
        val: schemaNode.examples,
        type: 'examples'
      })
    }
    if (isArray(schemaNode.enum)) {
      this.paths[currectPath] = this.paths[currectPath] || [];
      this.paths[currectPath].push({
        val: schemaNode.enum,
        type: 'enum'
      })
    }
  }

  _handleBoolean(currectPath, schemaNode) {
    this.paths[currectPath] = this.paths[currectPath] || [];
    this.paths[currectPath].push({
      val: [true,false],
      type: 'bool'
    })
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
