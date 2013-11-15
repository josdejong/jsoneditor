# API Reference

## JSONEditor

### Constructor

#### `JSONEditor(container [, options] [, json])`

Constructs a new JSONEditor.

*Parameters:*

- `{Element} container`
  An HTML DIV element. The JSONEditor will be created inside this container
  element.
- `{Object} options`
  Optional object with options. Available options:

  - `{function} change`.
    Set a callback method triggered when the contents of the JSONEditor change.
    Called without parameters.
  - `{function} error`.
    Set a callback method triggered when an error occurs.
    Invoked with the error as first argument. The callback is only invoked
    for errors triggered by a users action.
  - `{boolean} history`.
    Enables history, adds a button Undo and Redo to the menu of the JSONEditor.
    True by default. Only applicable when `mode` is 'tree' or 'form'.
  - `{String} mode`.
    Set the editor mode. Available values: 'tree' (default), 'view', 'form',
    'code', 'text'. In 'view' mode, the data and datastructure is read-only.
    In 'form' mode, only the value can be changed, the datastructure is read-only.
    Mode 'code' requires the Ace editor to be loaded on the page.
    Mode 'text' shows the data as plain text.
  - `{String[]} modes`.
    Create a box in the editor menu where the user can switch between the specified
    modes. Available values: see option `mode`.
  - `{String} name`.
    Initial field name for the root node, is undefined by default.
    Can also be set using `JSONEditor.setName(name)`.
    Only applicable when `mode` is 'tree', 'view', or 'form'.
  - `{boolean} search`.
    Enables a search box in the upper right corner of the JSONEditor.
    True by default.
    Only applicable when `mode` is 'tree', 'view', or 'form'.
  - `{Number} indentation`.
    Number of indentation spaces. 2 by default.
    Only applicable when `mode` is 'code' or 'text'.

- `{JSON} json`
  Initial JSON data to be loaded into the JSONEditor. Alternatively, the method `JSONEditor.set(json)` can be used to load JSON data into the editor.

*Returns:*

- `{jsoneditor.JSONEditor} editor`
  New instance of a JSONEditor.


### Methods

#### `JSONEditor.collapseAll()`

Collapse all fields. Only applicable for mode 'tree', 'view', and 'form'.

#### `JSONEditor.expandAll()`

Expand all fields. Only applicable for mode 'tree', 'view', and 'form'.

#### `JSONEditor.set(json)`

Set JSON data.

*Parameters:*

- `{JSON} json`
  JSON data to be displayed in the JSONEditor.

#### `JSONEditor.setMode(mode)`

Switch mode. Mode `code` requires the [Ace editor](http://ace.ajax.org/).

*Parameters:*

- `{String} mode`
  Available values: `tree`, 'view', `form`, `code`, `text`.

#### `JSONEditor.setName(name)`

Set a field name for the root node.

*Parameters:*

- `{String | undefined} name`
  Field name of the root node. If undefined, the current name will be removed.

#### `JSONEditor.setText(jsonString)`

Set text data in the formatter.

*Parameters:*
- `{String} jsonString` Contents of the JSONformatter as string.

#### `JSONEditor.get()`

Get JSON data.

*Returns:*
- `{JSON} json` JSON data from the JSONEditor.

#### `JSONEditor.getName()`

Retrieve the current field name of the root node.

*Returns:*

- `{String | undefined} name`
  Current field name of the root node, or undefined if not set.

#### `JSONEditor.getText()`

Get JSON data as string.

*Returns:*
- `{String} jsonString` Contents of the JSONformatter as string.


### Examples

A tree editor:

```js
var options = {
    "mode": "tree",
    "search": true
};
var editor = new jsoneditor.JSONEditor (container, options);
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
var editor = new jsoneditor.JSONEditor (container, options);
var json = {
    "Array": [1, 2, 3],
    "Boolean": true,
    "Null": null,
    "Number": 123,
    "Object": {"a": "b", "c": "d"},
    "String": "Hello World"
};
editor.set(json);

var json = editor.get(json);
```

## JSON parsing and stringification

In general to parse or stringify JSON data, the browsers built in JSON parser can be used.
To create a formatted string from a JSON object, use:

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
