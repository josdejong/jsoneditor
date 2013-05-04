# JSON Editor Online
http://jsoneditoronline.org/


### Description

JSON Editor Online is a web-based tool to view, edit, and format JSON.
It shows your data side by side in a clear, editable treeview and in 
a code editor.


### Screenshot

<a href="http://jsoneditoronline.org">
    <img alt="jsoneditor"
        src="https://raw.github.com/josdejong/jsoneditor/master/misc/screenshots/jsoneditoronline.png">
</a>


### Features

- View and edit JSON side by side in a treeview and a code editor.
- Edit, add, move, remove, and duplicate fields and values.
- Change type of values.
- Sort arrays and objects.
- Colorized values, color depends of the value type.
- Search & highlight text in the treeview.
- Undo and redo all actions.
- Load and save files and urls.
- Format, compact, and inspect JSON in the code editor powered by [Ace](http://ace.ajax.org/).
- Library can be loaded as CommonJS module, AMD module, or as a regular javascript file.


### Install

with npm:

    npm install jsoneditor

with bower:

    npm install bower

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

### Documentation

- Docs: [https://github.com/josdejong/jsoneditor/tree/master/docs](https://github.com/josdejong/jsoneditor/tree/master/docs)
- Examples: [https://github.com/josdejong/jsoneditor/tree/master/examples](https://github.com/josdejong/jsoneditor/tree/master/examples)
- Source: [https://github.com/josdejong/jsoneditor](https://github.com/josdejong/jsoneditor)
- History: [https://github.com/josdejong/jsoneditor/blob/master/HISTORY.md](https://github.com/josdejong/jsoneditor/blob/master/HISTORY.md)


### Build

The code of the JSON Editor is located in the folder `jsoneditor`.
The code for the web application in `app/web`.
To build the library from sourcecode, run

    jake

in the root of the project. This will generate the files `jsoneditor.js`,
`jsoneditor.css`, and minified versions, and will create a folder `build`
containing the zipped library and the built web application.
