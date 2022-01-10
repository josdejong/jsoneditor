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
    this.suggestions = {};
    this._buildSuggestions(this.schema);
    setTimeout(()=> console.log('TEMP collected paths', this.suggestions), 1000);
  }

  _buildSuggestions () {
    this._handleSchemaEntry("" , this.schema);
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
      this.suggestions[currectPath] = this.suggestions[currectPath] || [];
      this.suggestions[currectPath].push({
        val: props,
        type: 'property'
      })
      props.forEach((prop) => {
        setTimeout(() => {
          this._handleSchemaEntry(`${currectPath}/${prop}`,schemaNode.properties[prop]);
        })
      })
    }
  }

  _handlePrimitive(currectPath, schemaNode) {
    if (isArray(schemaNode.examples)) {
      this.suggestions[currectPath] = this.suggestions[currectPath] || [];
      this.suggestions[currectPath].push({
        val: schemaNode.examples,
        type: 'example'
      })
    }
    if (isArray(schemaNode.enum)) {
      this.suggestions[currectPath] = this.suggestions[currectPath] || [];
      this.suggestions[currectPath].push({
        val: schemaNode.enum,
        type: 'enum'
      })
    }
  }

  _handleBoolean(currectPath, schemaNode) {
    this.suggestions[currectPath] = this.suggestions[currectPath] || [];
    this.suggestions[currectPath].push({
      val: [true,false],
      type: 'boolean'
    })
  }

  getCompletions (editor, session, pos, prefix, callback) {
    try {
      const map = jsonMap.parse(session.getValue())
      const pointers = map.pointers || {};
      const processCompletionsCallback = (suggestions) => {
        if (suggestions?.length) {
          const completions = [];
          let score = 0;
          suggestions.forEach((suggest) => {
            if (suggest?.val?.length) {
              suggest.val.forEach((val) => {
                completions.push({
                  caption: val,
                  meta: `schema [${suggest.type}]`,
                  score: score++,
                  value: val,
                })
              })              
            }
          });
          callback(null, completions);
        }
      }
      Object.keys(pointers).forEach((ptr) => {
        setTimeout(() => {
          if (pointers[ptr].key?.line === pos.row) {
            if (pos.column >= pointers[ptr].key.column && pos.column <= pointers[ptr].keyEnd.column) {
              const parentPtr = ptr.slice(0, ptr.lastIndexOf('/'));
              if (this.suggestions[parentPtr]) {
                processCompletionsCallback(this.suggestions[parentPtr]);
                return;
              }
            }
          } 
          if (pointers[ptr].value?.line === pos.row && 
              pointers[ptr].value?.line === pointers[ptr].valueEnd?.line) { // multiline values are objects
            if (pos.column >= pointers[ptr].value.column && pos.column <= pointers[ptr].valueEnd.column) {
              if (this.suggestions[ptr]) {
                processCompletionsCallback(this.suggestions[ptr]);
                return;
              }
            }
          }
        })
      })
    } catch (e) {
      // probably not valid json, ignore.
    }
  }

}
