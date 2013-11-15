# JSON Editor Online
http://jsoneditoronline.org/


### Description

JSON Editor Online is a web-based tool to view, edit, and format JSON.
It has various modes such as a tree editor, a code editor, and a plain text
editor.

The editor can be used as a component in your own web application. The library
can be loaded as CommonJS module, AMD module, or as a regular javascript file.

Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 9+.

### Screenshot

The web application shows two panels side by side: a code editor on the left,
and a tree editor on the right. Files and urls can be loaded via the main menu.

<a href="http://jsoneditoronline.org">
    <img alt="jsoneditor"
        src="https://raw.github.com/josdejong/jsoneditor/master/misc/screenshots/jsoneditoronline.png">
</a>


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

- [Docs](https://github.com/josdejong/jsoneditor/tree/master/docs)
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
    <link rel="stylesheet" type="text/css" href="jsoneditor/jsoneditor-min.css">
    <script type="text/javascript" src="jsoneditor/jsoneditor-min.js"></script>
</head>
<body>
    <div id="jsoneditor" style="width: 400px; height: 400px;"></div>

    <script type="text/javascript" >
        // create the editor
        var container = document.getElementById("jsoneditor");
        var editor = new jsoneditor.JSONEditor(container);

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

The code of the JSON Editor is located in the folder `jsoneditor`.
The code for the web application in `app/web`.
To build the library from sourcecode, run

    jake

in the root of the project. This will generate the files `jsoneditor.js`,
`jsoneditor.css`, and minified versions, and will create a folder `build`
containing the zipped library and the built web application.
