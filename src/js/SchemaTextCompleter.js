'use strict'

import jsonMap from 'json-source-map'

/**
 * SchemaTextCompleter is a completer object that implements the 
 * ace ext-language_tools completer API, and suggests completions for the text editor
 * according to the cursor position and the json schema
 */
export class SchemaTextCompleter {
  constructor (schema, schemaRefs) {

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
