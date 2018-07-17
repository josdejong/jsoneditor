# API Reference

## JSONEditor

### Constructor

#### `JSONEditor(container [, options [, json]])`

Constructs a new JSONEditor.

*Parameters:*

- `{Element} container`

  An HTML DIV element. The JSONEditor will be created inside this container element.

- `{Object} options`

  Optional object with options. The available options are described under
  [Configuration options](#configuration-options).

- `{JSON} json`

  Initial JSON data to be loaded into the JSONEditor. Alternatively, the method `JSONEditor.set(json)` can be used to load JSON data into the editor.

*Returns:*

- `{JSONEditor} editor`

  New instance of a JSONEditor.

### Configuration options

- `{Object} ace`

  Provide a custom version of the [Ace editor](http://ace.c9.io/) and use this instead of the version that comes embedded with JSONEditor. Only applicable when `mode` is `code`.

  Note that when using the minimalist version of JSONEditor (which has Ace excluded), JSONEditor will try to load the Ace plugins `ace/mode/json` and `ace/ext/searchbox`. These plugins must be loaded beforehand or be available in the folder of the Ace editor.

- `{Object} ajv`

  Provide a custom instance of [ajv](https://github.com/epoberezkin/ajv), the
  library used for JSON schema validation. Example:

  ```js
  var options = {
    ajv: Ajv({ allErrors: true, verbose: true })
  }
  ```

- `{function} onChange`

  Set a callback function triggered when the contents of the JSONEditor change. Called without parameters. Will only be triggered on changes made by the user, not in case of programmatic changes via the functions `set` or `setText`.

- `{function} onEditable`

  Set a callback function  to determine whether individual nodes are editable or read-only. Only applicable when option `mode` is `tree`, `text`, or `code`.

  In case of mode `tree`, the callback is invoked as `editable(node)`, where `node` is an object `{field: string, value: string, path: string[]}`. The function must either return a boolean value to set both the nodes field and value editable or read-only, or return an object `{field: boolean, value: boolean}` to set set the read-only attribute for field and value individually.

  In modes `text` and `code`, the callback is invoked as `editable(node)` where `node` is an empty object (no field, value, or path). In that case the function can return false to make the text or code editor completely read-only.

- `{function} onError`

  Set a callback function triggered when an error occurs. Invoked with the error as first argument. The callback is only invoked
  for errors triggered by a users action, like switching from code mode to tree mode or clicking the Format button whilst the editor doesn't contain valid JSON.

- `{function} onModeChange(newMode, oldMode)`

  Set a callback function triggered right after the mode is changed by the user. Only applicable when
  the mode can be changed by the user (i.e. when option `modes` is set).

- `{boolean} escapeUnicode`

  If true, unicode characters are escaped and displayed as their hexadecimal code (like `\u260E`) instead of of the character itself (like `☎`). False by default.

- `{boolean} sortObjectKeys`

  If true, object keys in 'tree', 'view' or 'form' mode list be listed alphabetically instead by their insertion order. Sorting is performed using a natural sort algorithm, which makes it easier to see objects that have string numbers as keys. False by default.

- `{boolean} history`

  Enables history, adds a button Undo and Redo to the menu of the JSONEditor. True by default. Only applicable when `mode` is 'tree' or 'form'.

- `{String} mode`

  Set the editor mode. Available values: 'tree' (default), 'view', 'form', 'code', 'text'. In 'view' mode, the data and datastructure is read-only. In 'form' mode, only the value can be changed, the datastructure is read-only. Mode 'code' requires the Ace editor to be loaded on the page. Mode 'text' shows the data as plain text.

- `{String[]} modes`

  Create a box in the editor menu where the user can switch between the specified modes. Available values: see option `mode`.

- `{String} name`

  Initial field name for the root node, is undefined by default. Can also be set using `JSONEditor.setName(name)`. Only applicable when `mode` is 'tree', 'view', or 'form'.

- `{Object} schema`

  Validate the JSON object against a JSON schema. A JSON schema describes the
  structure that a JSON object must have, like required properties or the type
  that a value must have.

  See [http://json-schema.org/](http://json-schema.org/) for more information.

- `{Object} schemaRefs`

  Schemas that are referenced using the `$ref` property from the JSON schema that are set in the `schema` option,
  the object structure in the form of `{reference_key: schemaObject}`

- `{boolean} search`

  Enables a search box in the upper right corner of the JSONEditor. True by default. Only applicable when `mode` is 'tree', 'view', or 'form'.

- `{Number} indentation`

  Number of indentation spaces. 2 by default. Only applicable when `mode` is 'code' or 'text'.

- `{String} theme`

  Set the Ace editor theme, uses included 'ace/theme/jsoneditor' by default. Please note that only the default theme is included with jsoneditor, so if you specify another one you need to make sure it is loaded.

- `{Object} templates`

  Array of templates that will appear in the context menu, Each template is a json object precreated that can be added as a object value to any node in your document. 

  The following example allow you can create a "Person" node and a "Address" node, each one will appear in your context menu, once you selected the whole json object will be created.

  ```js
  var options = {
    templates: [
          {
              text: 'Person',
              title: 'Insert a Person Node',
              className: 'jsoneditor-type-object',
              field: 'PersonTemplate',
              value: {
                  'firstName': 'John',
                  'lastName': 'Do',
                  'age': 28
              }
          },
          {
              text: 'Address',
              title: 'Insert a Address Node',
              field: 'AddressTemplate',
              value: {
                  'street': "",
                  'city': "",
                  'state': "",
                  'ZIP code': ""
              }
          }
      ]
  }
  ```

- `{Object} autocomplete`

  *autocomplete* will enable this feature in your editor in tree mode, the object have the following **subelements**:

  - `{number[]} confirmKeys`

     Indicate the KeyCodes for trigger confirm completion, by default those keys are:  [39, 35, 9] which are the code for [right, end, tab]

  - `{boolean} caseSensitive`

     Indicate if the autocomplete is going to be strict case-sensitive to match the options.

  - `{Function} getOptions (text: string, path: string[], input: string, editor: JSONEditor)`

     This function will return your possible options for create the autocomplete selection, you can control dynamically which options you want to display according to the current active editing node.
     
     *Parameters:*

     - `text`   : The text in the current node part. (basically the text that the user is editing)
     - `path`   : The path of the node that is being edited as an array with strings.
     - `input`  : Can be "field" or "value" depending if the user is editing a field name or a value of a node.
     - `editor` : The editor instance object that is being edited.

     *Returns:*

     - Can return an array with autocomplete options (strings), for example `['apple','cranberry','raspberry','pie']`
     - Can return `null` when there are no autocomplete options.
     - Can return an object `{startFrom: number, options: string[]}`. Here `startFrom` determines the start character from where the existing text will be replaced. `startFrom` is `0` by default, replacing the whole text.
     - Can return a `Promise` resolving one of the return types above to support asynchronously retrieving a list with options.

- `{boolean} navigationBar`

  Adds navigation bar to the menu - the navigation bar visualize the current position on the tree structure as well as allows breadcrumbs navigation. True by default. Only applicable when `mode` is 'tree', 'form' or 'view'.

- `{boolean} statusBar`

  Adds status bar to the bottom of the editor - the status bar shows the cursor position and a count of the selected characters. True by default. Only applicable when `mode` is 'code' or 'text'.

- `{function} onTextSelectionChange`

  Set a callback function triggered when a text is selected in the JSONEditor.

  callback signature should be:
  ```js
  /**
  * @param {{row:Number, column:Number}} startPos selection start position
  * @param {{row:Number, column:Number}} endPos selected end position
  * @param {String} text selected text
  */
  function onTextSelectionChange(startPos, endPos, text) {
    ...
  }
  ```
  Only applicable when `mode` is 'code' or 'text'.

- `{function} onSelectionChange`

  Set a callback function triggered when Nodes are selected in the JSONEditor.

  callback signature should be:
  ```js
  /**
  * @typedef {{value: String|Object|Number|Boolean, path: Array.<String|Number>}} SerializableNode
  * 
  * @param {SerializableNode=} start
  * @param {SerializableNode=} end
  */
  function onSelectionChange(start, end) {
    ...
  }
  ```
  Only applicable when `mode` is 'tree'.

- `{string} language`

  The default language comes from the browser navigator, but you can force a specific language. So use here string as 'en' or 'pt-BR'. Built-in languages: `en`, `pt-BR`. Other translations can be specified via the option `languages`.


- `{Object} languages`

  You can override existing translations or provide a new translation for a specific language. To do it provide an object at languages with language and the keys/values to be inserted. For example:

  ```
  'languages': {
    'pt-BR': {
      'auto': 'Automático testing'
    },
    'en': {
      'auto': 'Auto testing'
    }
  }
  ```

  All available fields for translation can be found in the source file `src/js/i18n.js`.

- `{HTMLElement} modalAnchor`

  The container element where modals (like for sorting and filtering) are attached: an overlay will be created on top
  of this container, and the modal will be created in the center of this container.


### Methods

#### `JSONEditor.collapseAll()`

Collapse all fields. Only applicable for mode 'tree', 'view', and 'form'.

#### `JSONEditor.destroy()`

Destroy the editor. Clean up DOM, event listeners, and web workers.

#### `JSONEditor.expandAll()`

Expand all fields. Only applicable for mode 'tree', 'view', and 'form'.

#### `JSONEditor.focus()`

Set focus to the JSONEditor.

#### `JSONEditor.set(json)`

Set JSON data.

*Parameters:*

- `{JSON} json`

  JSON data to be displayed in the JSONEditor.

#### `JSONEditor.setMode(mode)`

Switch mode. Mode `code` requires the [Ace editor](http://ace.ajax.org/).

*Parameters:*

- `{String} mode`

  Available values: `tree`, `view`, `form`, `code`, `text`.

#### `JSONEditor.setName(name)`

Set a field name for the root node.

*Parameters:*

- `{String | undefined} name`

  Field name of the root node. If undefined, the current name will be removed.

#### `JSONEditor.setSchema(schema [,schemaRefs])`

Set a JSON schema for validation of the JSON object. See also option `schema`.
See [http://json-schema.org/](http://json-schema.org/) for more information on the JSON schema definition.

*Parameters:*

- `{Object} schema`

  A JSON schema.

- `{Object} schemaRefs`

  Optional, Schemas that are referenced using the `$ref` property from the JSON schema, the object structure in the form of `{reference_key: schemaObject}`

#### `JSONEditor.setText(jsonString)`

Set text data in the editor.

This method throws an exception when the provided jsonString does not contain
valid JSON and the editor is in mode `tree`, `view`, or `form`.

*Parameters:*

- `{String} jsonString`

  Contents of the editor as string.

#### `JSONEditor.get()`

Get JSON data. 

This method throws an exception when the editor does not contain valid JSON, 
which can be the case when the editor is in mode `code` or `text`.

*Returns:*

- `{JSON} json`

  JSON data from the JSONEditor.

#### `JSONEditor.getMode()`

Retrieve the current mode of the editor.

*Returns:*

- `{String} mode`

  Current mode of the editor for example `tree` or `code`.

#### `JSONEditor.getName()`

Retrieve the current field name of the root node.

*Returns:*

- `{String | undefined} name`

  Current field name of the root node, or undefined if not set.

#### `JSONEditor.getText()`

Get JSON data as string.

*Returns:*

- `{String} jsonString`

  Contents of the editor as string. When the editor is in code `text` or `code`,
  the returned text is returned as-is. For the other modes, the returned text
  is a compacted string. In order to get the JSON formatted with a certain
  number of spaces, use `JSON.stringify(JSONEditor.get(), null, 2)`.

#### `JSONEditor.getTextSelection()`

Get the current selected text with the selection range, Only applicable for mode 'text' and 'code'.

*Returns:*

- `{start:{row:Number, column:Number},end:{row:Number, column:Number},text:String} selection`

#### `JSONEditor.setTextSelection(startPos, endPos)`

Set text selection for a range, Only applicable for mode 'text' and 'code'.

*Parameters:*

- `{row:Number, column:Number} startPos`

  Position for selection start

- `{row:Number, column:Number} endPos`

  Position for selection end

#### `JSONEditor.getSelection()`

Get the current selected nodes, Only applicable for mode 'tree'.

*Returns:*

- `{start:SerializableNode, end: SerializableNode}`

#### `JSONEditor.setSelection(start, end)`

Set selection for a range of nodes, Only applicable for mode 'tree'.

- If no parameters sent - the current selection will be removed, if exists.
- For single node selecion send only the `start` parameter.
- If the nodes are not from the same level the first common parent will be selected

*Parameters:*

- `{path: Array.<String>} start`

  Path for the start node

- `{path: Array.<String>} end`

  Path for the end node


#### `JSONEditor.getNodesByRange(start, end)`

A utility function for getting a list of `SerializableNode` under certain range.

This function can be used as complementary to `getSelection` and `onSelectionChange` if a list of __all__ the selected nodes is required.

*Parameters:*

- `{path: Array.<String>} start`

  Path for the first node in range

- `{path: Array.<String>} end`

  Path for the last node in range

### Examples

A tree editor:

```js
var options = {
    "mode": "tree",
    "search": true
};
var editor = new JSONEditor(container, options);
var json = {
    "Array": [1, 2, 3],
    "Boolean": true,
    "Null": null,
    "Number": 123,
    "Object": {"a": "b", "c": "d"},
    "String": "Hello World"
};
editor.set(json);
editor.expandAll();

var json = editor.get(json);
```

A text editor:

```js
var options = {
    "mode": "text",
    "indentation": 2
};
var editor = new JSONEditor(container, options);
var json = {
    "Array": [1, 2, 3],
    "Boolean": true,
    "Null": null,
    "Number": 123,
    "Object": {"a": "b", "c": "d"},
    "String": "Hello World"
};
editor.set(json);

var json = editor.get();
```

## JSON parsing and stringification

In general to parse or stringify JSON data, the browsers built in JSON parser can be used. To create a formatted string from a JSON object, use:

```js
var formattedString = JSON.stringify(json, null, 2);
```

to create a compacted string from a JSON object, use:

```js
var compactString = JSON.stringify(json);
```

To parse a String to a JSON object, use:

```js
var json = JSON.parse(string);
```
