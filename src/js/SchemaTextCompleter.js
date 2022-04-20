'use strict'

import jsonMap from 'json-source-map'
import {
  isArray,
  isObject,
  unigueMergeArrays,
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
    this.suggestionsRefs = {};
    this._buildSuggestions();
  }

  _buildSuggestions () {
    this._handleSchemaEntry("" , this.schema, this.suggestions);
    for (let refName in this.schemaRefs) {
      this.suggestionsRefs[refName] = {};
      this._handleSchemaEntry("" , this.schemaRefs[refName], this.suggestionsRefs[refName]);
    }
  }

  _handleRef(currectPath, refName, suggestionsObj) {
    suggestionsObj[currectPath] = suggestionsObj[currectPath] || {}
    suggestionsObj[currectPath].refs = suggestionsObj[currectPath].refs || []
    suggestionsObj[currectPath].refs = unigueMergeArrays(suggestionsObj[currectPath].refs, [refName]);
  }

  _handleSchemaEntry(currectPath, schemaNode, suggestionsObj) {
    if(!schemaNode) {
      console.log('wrong',currectPath);
      return;
    }
    if (schemaNode.$ref) {
      this._handleRef(currectPath, schemaNode.$ref, suggestionsObj);
      return;
    }
    const ofConditionEntry = this._checkOfConditon(schemaNode);
    if (ofConditionEntry) {
      this._handleOfCondition(currectPath, schemaNode[ofConditionEntry], suggestionsObj);
      return;
    }
    switch(schemaNode.type) {
      case 'object':
        this._handleObject(currectPath, schemaNode, suggestionsObj)
        break;
      case 'string':
      case 'number':
      case 'integer':
        this._handlePrimitive(currectPath, schemaNode, suggestionsObj)
        break;
      case 'boolean':
        this._handleBoolean(currectPath, schemaNode, suggestionsObj)
        break
      case 'array':
        this._handleArray(currectPath, schemaNode, suggestionsObj)
    }
  }

  _handleObject(currectPath, schemaNode, suggestionsObj) {
    if (isObject(schemaNode.properties)) {
      const props = Object.keys(schemaNode.properties);
      suggestionsObj[currectPath] = suggestionsObj[currectPath] || {};
      suggestionsObj[currectPath].props = suggestionsObj[currectPath].props || [];
      suggestionsObj[currectPath].props = unigueMergeArrays(suggestionsObj[currectPath].props, props);
      // [...new Set(suggestionsObj[currectPath].props.concat(props))]
      props.forEach((prop) => {
        setTimeout(() => {
          this._handleSchemaEntry(`${currectPath}/${prop}`,schemaNode.properties[prop], suggestionsObj);
        })
      })
    }
  }

  _handlePrimitive(currectPath, schemaNode, suggestionsObj) {
    suggestionsObj[currectPath] = suggestionsObj[currectPath] || {};
    if (isArray(schemaNode.examples)) {
      suggestionsObj[currectPath].examples = suggestionsObj[currectPath].examples || [];
      suggestionsObj[currectPath].examples = unigueMergeArrays(suggestionsObj[currectPath].examples, schemaNode.examples);
      // [...new Set(suggestionsObj[currectPath].examples.concat(schemaNode.examples))]
    }
    if (isArray(schemaNode.enum)) {
      suggestionsObj[currectPath].enum = suggestionsObj[currectPath].enum || [];
      suggestionsObj[currectPath].enum = unigueMergeArrays(suggestionsObj[currectPath].enum, schemaNode.enum);
      // [...new Set(suggestionsObj[currectPath].enum.concat(schemaNode.enum))]
    }
  }

  _handleBoolean(currectPath, schemaNode, suggestionsObj) {
    if (!suggestionsObj[currectPath]) {
      suggestionsObj[currectPath] = {
        bool: [true,false]
      }
    }
  }

  _handleArray(currectPath, schemaNode, suggestionsObj) {
    if (schemaNode.items) {
      setTimeout(() => {
        this._handleSchemaEntry(`${currectPath}/\\d+`, schemaNode.items, suggestionsObj);
      })
    }
  }

  _handleOfCondition(currectPath, schemaNode, suggestionsObj) {
    if (schemaNode && schemaNode.length) {
      schemaNode.forEach(schemaEntry => {
        setTimeout(() => {
          this._handleSchemaEntry(currectPath, schemaEntry, suggestionsObj);
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
          const matchPointersToPath = (pointer, currentSuggestions, path) => {
            const option = Object.keys(currentSuggestions).reduce((last, key) => {
              if(new RegExp(`\^${path}${key}`).test(pointer)) {
                if (!last || last.length < key.length) {
                  return key;
                }
              }
              return last;
            });
            if (typeof option === 'string') {
              if (currentSuggestions[option]?.refs?.length) {
                const mergedSuggestions = {};
                for (let idx in currentSuggestions[option].refs) {                  
                  const refName = currentSuggestions[option].refs[idx]                 
                  if (this.suggestionsRefs[refName]) {
                    const refSuggestion = matchPointersToPath(pointer, this.suggestionsRefs[refName], `${path}${option}`);
                    if(refSuggestion?.enum) {
                      mergedSuggestions.enum = unigueMergeArrays(mergedSuggestions.enum, refSuggestion.enum);
                    }
                    if(refSuggestion?.examples) {
                      mergedSuggestions.examples = unigueMergeArrays(mergedSuggestions.examples, refSuggestion.examples);
                    }
                    if(refSuggestion?.bool) {
                      mergedSuggestions.bool = unigueMergeArrays(mergedSuggestions.bool, refSuggestion.bool);
                    }
                    if(refSuggestion?.props) {
                      mergedSuggestions.props = unigueMergeArrays(mergedSuggestions.props, refSuggestion.props);
                    }
                  }
                }
                return mergedSuggestions;
              } else if (new RegExp(`\^${path}${option}$`).test(pointer)) {
                console.log('Text suggession match', {path: pointer, schemaPath: `${path}${option}`, suggestions: currentSuggestions[option]});
                return currentSuggestions[option];
              } else {
                console.log('Text suggession not match', {path: pointer, schemaPath: `${path}${option}`, suggestions: currentSuggestions[option]});
              }
            }
          }
          let selectedPtr;
          if (pointers[ptr].key?.line === pos.row) {
            if (pos.column >= pointers[ptr].key.column && pos.column <= pointers[ptr].keyEnd.column) {
              selectedPtr = ptr.slice(0, ptr.lastIndexOf('/'));
            }
          } 
          if (pointers[ptr].value?.line === pos.row && 
              pointers[ptr].value?.line === pointers[ptr].valueEnd?.line) { // multiline values are objects
            if (pos.column >= pointers[ptr].value.column && pos.column <= pointers[ptr].valueEnd.column) {
              selectedPtr = ptr;
            }
          }
          if (selectedPtr) {
            const chosenCompletions = matchPointersToPath(selectedPtr, this.suggestions, '');
            processCompletionsCallback(chosenCompletions);
          }

        })
      })
    } catch (e) {
      // probably not valid json, ignore.
    }
  }

}
