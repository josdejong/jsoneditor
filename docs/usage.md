# Usage

### Install

with npm:

    npm install jsoneditor

with bower:

    bower install jsoneditor

download:

[http://jsoneditoronline.org/downloads/](http://jsoneditoronline.org/downloads/)

The library consists of three files: one javascript file, one css file and an
image. Both full and minified version are available.

## Load

To implement JSONEditor in a web application, load the javascript and css file
in the head of the HTML page:

```html
<link rel="stylesheet" type="text/css" href="jsoneditor/jsoneditor-min.css">
<script type="text/javascript" src="jsoneditor/jsoneditor-min.js"></script>
```

### Detailed error messages

Optionally, [jsonlint](https://github.com/zaach/jsonlint) can be loaded to get
more detailed error messages.

```html
<script type="text/javascript" src="jsoneditor/lib/jsonlint/jsonlint.js"></script>
```

### Code editor

The mode 'code' requires the [Ace editor](http://ace.ajax.org/) to be loaded.
Also, the content type must be specified on the page.

```html
<meta http-equiv="Content-Type" content="text/html;charset=utf-8">

<script type="text/javascript" src="jsoneditor/lib/ace/ace.js"></script>
<script type="text/javascript" src="jsoneditor/lib/ace/mode-json.js"></script>
<script type="text/javascript" src="jsoneditor/lib/ace/theme-textmate.js"></script>
<script type="text/javascript" src="jsoneditor/lib/ace/theme-jsoneditor.js"></script>
```

## Use

In the body, create an div element with an id and a size:

```html
<div id="jsoneditor" style="width: 400px; height: 400px;"></div>
```

After the page is loaded, load the editor with javascript:

```js
var container = document.getElementById("jsoneditor");
var options = {
    mode: 'tree'
};
var editor = new jsoneditor.JSONEditor(container, options);
```

To set JSON data in the editor:

```js
var json = {
    "Array": [1, 2, 3],
    "Boolean": true,
    "Null": null,
    "Number": 123,
    "Object": {"a": "b", "c": "d"},
    "String": "Hello World"
};
editor.set(json);
```

To get JSON data from the editor:

```js
var json = editor.get();
```


## Full Example

```html
<!DOCTYPE HTML>
<html>
<head>
    <link rel="stylesheet" type="text/css" href="jsoneditor/jsoneditor-min.css">
    <script type="text/javascript" src="jsoneditor/jsoneditor-min.js"></script>
</head>
<body>
<p>
    <button onclick="setJSON();">Set JSON</button>
    <button onclick="getJSON();">Get JSON</button>
</p>
<div id="jsoneditor" style="width: 400px; height: 400px;"></div>

<script type="text/javascript" >
    // create the editor
    var container = document.getElementById("jsoneditor");
    var editor = new jsoneditor.JSONEditor(container);

    // set json
    function setJSON () {
        var json = {
            "Array": [1, 2, 3],
            "Boolean": true,
            "Null": null,
            "Number": 123,
            "Object": {"a": "b", "c": "d"},
            "String": "Hello World"
        };
        editor.set(json);
    }

    // get json
    function getJSON() {
        var json = editor.get();
        alert(JSON.stringify(json, null, 2));
    }
</script>
</body>
</html>
```

For more examples, see the
[examples section](https://github.com/josdejong/jsoneditor/tree/master/examples).
