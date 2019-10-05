# Usage

### Install

Install via npm:

    npm install jsoneditor

## Load

To implement JSONEditor in a web application, load the javascript and css file
in the head of the HTML page:

```html
<link href="jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
<script src="jsoneditor/dist/jsoneditor.min.js"></script>
```

## Use

In the body, create a div element with an id and a size:

```html
<div id="jsoneditor" style="width: 400px; height: 400px;"></div>
```

After the page is loaded, load the editor with javascript:

```js
var container = document.getElementById("jsoneditor");
var options = {
    mode: 'tree'
};
var editor = new JSONEditor(container, options);
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
    <!-- when using the mode "code", it's important to specify charset utf-8 -->
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">

    <link href="jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
    <script src="jsoneditor/dist/jsoneditor.min.js"></script>
</head>
<body>
<p>
    <button onclick="setJSON();">Set JSON</button>
    <button onclick="getJSON();">Get JSON</button>
</p>
<div id="jsoneditor" style="width: 400px; height: 400px;"></div>

<script>
    // create the editor
    var container = document.getElementById("jsoneditor");
    var editor = new JSONEditor(container);

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
