# JSON Editor
https://github.com/josdejong/jsoneditor
http://jsoneditoronline.org/

Website: http://jsoneditoronline.org/
Github: https://github.com/josdejong/jsoneditor


### Description

JSON Editor is a web-based tool to view, edit, and format JSON.
It has various modes such as a tree editor, a code editor, and a plain text
editor.

The editor can be used as a component in your own web application. The library
can be loaded as CommonJS module, AMD module, or as a regular javascript file.

Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 9+.

<img alt="json editor" src="https://raw.github.com/josdejong/jsoneditor/master/misc/jsoneditor.png">

<img alt="code editor" src="https://raw.github.com/josdejong/jsoneditor/master/misc/codeeditor.png">


### Features

#### Tree editor
- Edit, add, move, remove, and duplicate fields and values.
- Change type of values.
- Sort arrays and objects.
- Colorized code.
- Search & highlight text in the treeview.
- Undo and redo all actions.

#### Code editor
- Format and compact JSON.
- Colorized code (powered by Ace).
- Inspect JSON (powered by Ace).

#### Text editor
- Format and compact JSON.


### Documentation

- Documentation:
  - [API](https://github.com/josdejong/jsoneditor/tree/master/docs/api.md)
  - [Usage](https://github.com/josdejong/jsoneditor/tree/master/docs/usage.md)
  - [Shortcut keys](https://github.com/josdejong/jsoneditor/tree/master/docs/shortcut_keys.md)
- [Examples](https://github.com/josdejong/jsoneditor/tree/master/examples)
- [Source](https://github.com/josdejong/jsoneditor)
- [History](https://github.com/josdejong/jsoneditor/blob/master/HISTORY.md)


### Install

with npm:

    npm install jsoneditor

with bower:

    bower install jsoneditor

download:

[http://jsoneditoronline.org/downloads/](http://jsoneditoronline.org/downloads/)


### Use

```html
<!DOCTYPE HTML>
<html>
<head>
    <link rel="stylesheet" type="text/css" href="jsoneditor/jsoneditor.min.css">
    <script type="text/javascript" src="jsoneditor/jsoneditor.min.js"></script>
</head>
<body>
    <div id="jsoneditor" style="width: 400px; height: 400px;"></div>

    <script type="text/javascript" >
        // create the editor
        var container = document.getElementById("jsoneditor");
        var editor = new JSONEditor(container);

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

### Build

The code of the JSON Editor is located in the folder `./src`. To build 
jsoneditor:

- Install dependencies:

      npm install

- Build JSON Editor:

      npm run build

  This will generate the files `./jsoneditor.js`, `./jsoneditor.css`, and  
  minified versions in the root of the project.

- To rebuild the assets (not necessary):

      npm run build-assets

  This will build Ace editor, and then generates necessary ace editor files in 
  the folder `./asset/ace`, and jsonlint in the folder `./asset/jsonlint`.
