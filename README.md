# JSON Editor

JSON Editor is a web-based tool to view, edit, format, and validate JSON.
It has various modes such as a tree editor, a code editor, and a plain text
editor.

The editor can be used as a component in your own web application. The library
can be loaded as CommonJS module, AMD module, or as a regular javascript file.

Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 9+.

<img alt="json editor" src="https://raw.github.com/josdejong/jsoneditor/master/misc/jsoneditor.png"> &nbsp; <img alt="code editor" src="https://raw.github.com/josdejong/jsoneditor/master/misc/codeeditor.png">


## Features

### Tree editor
- Edit, add, move, remove, and duplicate fields and values.
- Change type of values.
- Sort arrays and objects.
- Colorized code.
- Search & highlight text in the tree view.
- Undo and redo all actions.
- JSON schema validation (powered by [ajv](https://github.com/epoberezkin/ajv)).

### Code editor
- Colorized code (powered by [Ace](https://ace.c9.io)).
- Inspect JSON (powered by [Ace](https://ace.c9.io)).
- Format and compact JSON.
- JSON schema validation (powered by [ajv](https://github.com/epoberezkin/ajv)).

### Text editor
- Format and compact JSON.
- JSON schema validation (powered by [ajv](https://github.com/epoberezkin/ajv)).


## Documentation

- Documentation:
  - [API](https://github.com/josdejong/jsoneditor/tree/master/docs/api.md)
  - [Usage](https://github.com/josdejong/jsoneditor/tree/master/docs/usage.md)
  - [Shortcut keys](https://github.com/josdejong/jsoneditor/tree/master/docs/shortcut_keys.md)
- [Examples](https://github.com/josdejong/jsoneditor/tree/master/examples)
- [Source](https://github.com/josdejong/jsoneditor)
- [History](https://github.com/josdejong/jsoneditor/blob/master/HISTORY.md)


## Install

Install via npm:

    npm install jsoneditor

### Versions

There are two versions of jsoneditor available: a full version and
a minimalist version.

#### Full version

If you're not sure which version to use, use the full version: jsoneditor.js.

#### Minimalist version

The minimalist version, jsoneditor-minimalist.js, has excluded the following libraries:

- `ace` (via `brace`), used for the code editor.
- `ajv`, used for JSON schema validation.

This reduces the the size of the minified and gzipped JavaScript considerably.

When to use the minimalist version?

- If you don't need the mode "code" and don't need JSON schema validation.
- Or if you want to provide `ace` and/or `ajv` yourself via the configuration
  options, for example when you already use Ace in other parts of your
  web application too and don't want to bundle the library twice.


### More

There is a directive available for using `jsoneditor` in Angular.js:

[https://github.com/angular-tools/ng-jsoneditor](https://github.com/angular-tools/ng-jsoneditor)


## Use

```html
<!DOCTYPE HTML>
<html>
<head>
    <!-- when using the mode "code", it's important to specify charset utf-8 -->
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">

    <script src="jsoneditor/dist/jsoneditor.js"></script>
</head>
<body>
    <div id="jsoneditor" style="width: 400px; height: 400px;"></div>

    <script>
        // create the editor
        var container = document.getElementById('jsoneditor');
        var options = {};
        var editor = jsoneditor(container, options);

        // set json
        var json = {
            "Array": [1, 2, 3],
            "Boolean": true,
            "Null": null,
            "Number": 123,
            "Object": {"a": "b", "c": "d"},
            "String": "Hello World"
        };
        editor.set(json);

        // get json
        var json = editor.get();
    </script>
</body>
</html>
```


## Build

The code of the JSON Editor is located in the folder `./src`. To build 
jsoneditor:

- Install dependencies:

  ```
  npm install
  ```

- Build JSON Editor:

  ```
  npm run build
  ```

  This will generate the file `./dist/jsoneditor.js` and
  `./dist/jsoneditor-minimalist.js` and corresponding source maps.

- To automatically build when a source file has changed:

  ```
  npm start
  ```

  This will update `./dist/jsoneditor.js` on every change in the source code,
  but it will **NOT** update the minimalist version.
