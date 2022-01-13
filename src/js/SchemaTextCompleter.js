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
    setTimeout(() => console.log('TEMP collected paths', this.suggestions, Object.keys(this.suggestions).length), 20000);
  }

  _buildSuggestions () {
    this._handleSchemaEntry("" , this.schema);
  }

  _handleRef(currectPath, refName) {
    if (this.schemaRefs[refName]) {
      setTimeout(() => {
        this._handleSchemaEntry(currectPath, this.schemaRefs[refName]);
      })
    }
  }

  _handleSchemaEntry(currectPath, schemaNode) {
    if(!schemaNode) {
      console.log('wrong',currectPath);
      return;
    }
    if (schemaNode.$ref) {
      this._handleRef(currectPath, schemaNode.$ref);
      return;
    }
    const ofConditionEntry = this._checkOfConditon(schemaNode);
    if (ofConditionEntry) {
      this._handleOfCondition(currectPath, schemaNode[ofConditionEntry]);
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
        break
      case 'array':
        this._handleArray(currectPath, schemaNode)
    }
  }

  _handleObject(currectPath, schemaNode) {
    if (isObject(schemaNode.properties)) {
      const props = Object.keys(schemaNode.properties);
      this.suggestions[currectPath] = this.suggestions[currectPath] || {};
      this.suggestions[currectPath].props = this.suggestions[currectPath].props || [];
      this.suggestions[currectPath].props = [...new Set(this.suggestions[currectPath].props.concat(props))]
      props.forEach((prop) => {
        setTimeout(() => {
          this._handleSchemaEntry(`${currectPath}/${prop}`,schemaNode.properties[prop]);
        })
      })
    }
  }

  _handlePrimitive(currectPath, schemaNode) {
    if (isArray(schemaNode.examples)) {
      this.suggestions[currectPath] = this.suggestions[currectPath] || {};
      this.suggestions[currectPath].examples = this.suggestions[currectPath].examples || [];
      this.suggestions[currectPath].examples = [...new Set(this.suggestions[currectPath].examples.concat(schemaNode.examples))]
    }
    if (isArray(schemaNode.enum)) {
      this.suggestions[currectPath] = this.suggestions[currectPath] || {};
      this.suggestions[currectPath].enum = this.suggestions[currectPath].enum || [];
      this.suggestions[currectPath].enum = [...new Set(this.suggestions[currectPath].enum.concat(schemaNode.enum))]
    }
  }

  _handleBoolean(currectPath, schemaNode) {
    if (!this.suggestions[currectPath]) {
      this.suggestions[currectPath] = {
        bool: [true,false]
      }
    }
  }

  _handleArray(currectPath, schemaNode) {
    if (schemaNode.items) {
      setTimeout(() => {
        this._handleSchemaEntry(`${currectPath}/\\d+`, schemaNode.items);
      })
    }
  }

  _handleOfCondition(currectPath, schemaNode) {
    if (schemaNode && schemaNode.length) {
      schemaNode.forEach(schemaEntry => {
        setTimeout(() => {
          this._handleSchemaEntry(currectPath, schemaEntry);
        })
      })
    }
  }

  _checkOfConditon(entry) {
    if (!entry) {
      return;
    }
    if (entry.oneOf) {
      return 'oneOf';
    }
    if (entry.anyOf) {
      return 'anyOf';
    }
    if (entry.allOf) {
      return 'allOf';
    }
  }
  

  getCompletions (editor, session, pos, prefix, callback) {
    try {
      const map = jsonMap.parse(session.getValue())
      const pointers = map.pointers || {};
      const processCompletionsCallback = (suggestions) => {
        let completions = [];
        let score = 0;
        const appendSuggesions = (type) => {
          const typeTitle = {
            props: 'property',
            enum: 'enum',
            bool: 'boolean',
            examples: 'examples'
          }
          if (suggestions && suggestions[type]?.length) {
            completions = completions.concat(suggestions[type].map(term => {
              return {
                caption: term + '',
                meta: `schema [${typeTitle[type]}]`,
                score: score++,
                value: term + '',
              }
            }))
          }
        }
        appendSuggesions('props')
        appendSuggesions('enum')
        appendSuggesions('bool')
        appendSuggesions('examples')
        
        if (completions.length) {
          callback(null, completions);
        }
        
      }
      Object.keys(pointers).forEach((ptr) => {
        setTimeout(() => {
          if (pointers[ptr].key?.line === pos.row) {
            if (pos.column >= pointers[ptr].key.column && pos.column <= pointers[ptr].keyEnd.column) {
              const parentPtr = ptr.slice(0, ptr.lastIndexOf('/'));
              const options = Object.keys(this.suggestions).filter(key => {
                return new RegExp(`\^${key}\$`).test(parentPtr)
              });
              if (options.length) {
                processCompletionsCallback(this.suggestions[options[0]]);
                return;
              }
            }
          } 
          if (pointers[ptr].value?.line === pos.row && 
              pointers[ptr].value?.line === pointers[ptr].valueEnd?.line) { // multiline values are objects
            if (pos.column >= pointers[ptr].value.column && pos.column <= pointers[ptr].valueEnd.column) {
              const options = Object.keys(this.suggestions).filter(key => {
                return new RegExp(`\^${key}\$`).test(ptr)
              });
              if (options.length) {
                processCompletionsCallback(this.suggestions[options[0]]);
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
