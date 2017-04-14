# JSON Editor

JSON Editor is a web-based tool to view, edit, format, and validate JSON.
It has various modes such as a tree editor, a code editor, and a plain text
editor.

The editor can be used as a component in your own web application. The library
can be loaded as CommonJS module, AMD module, or as a regular javascript file.

Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 9+.

Cross browser testing for JSONEditor is generously provided by <a href="https://www.browserstack.com" target="_blank">BrowserStack</a>

<a href="https://www.browserstack.com" target="_blank"><img alt="BrowserStack" src="https://raw.github.com/josdejong/jsoneditor/master/misc/browserstack.png"></a>

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

with npm (recommended):

    npm install jsoneditor

with bower:

    bower install jsoneditor


#### More

There is a directive available for using JSONEditor in Angular.js:

[https://github.com/isonet/angular-jsoneditor](https://github.com/isonet/angular-jsoneditor)


## Use

```html
<!DOCTYPE HTML>
<html>
<head>
    <!-- when using the mode "code", it's important to specify charset utf-8 -->
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">

    <link href="jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
    <script src="jsoneditor/dist/jsoneditor.min.js"></script>
</head>
<body>
    <div id="jsoneditor" style="width: 400px; height: 400px;"></div>

    <script>
        // create the editor
        var container = document.getElementById("jsoneditor");
        var options = {};
        var editor = new JSONEditor(container, options);

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

  This will generate the files `./jsoneditor.js`, `./jsoneditor.css`, and  
  minified versions in the dist of the project.

- To automatically build when a source file has changed:

  ```
  npm run watch
  ```

  This will update `./jsoneditor.js` and `./jsoneditor.css` in the dist folder
  on every change, but it will **NOT** update the minified versions as that's
  an expensive operation.


## Custom builds

The source code of JSONEditor consists of CommonJS modules. JSONEditor can be bundled in a customized way using a module bundler like [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/). First, install all dependencies of jsoneditor:

    npm install

To create a custom bundle of the source code using browserify:

    browserify ./index.js -o ./jsoneditor.custom.js -s JSONEditor

The Ace editor, used in mode `code`, accounts for about 75% of the total
size of the library. To exclude the Ace editor from the bundle:

    browserify ./index.js -o ./jsoneditor.custom.js -s JSONEditor -x brace -x brace/mode/json -x brace/ext/searchbox

To minify the generated bundle, use [uglifyjs](https://github.com/mishoo/UglifyJS2):

    uglifyjs ./jsoneditor.custom.js -o ./jsoneditor.custom.min.js -m -c

