# JSON Editor Online
http://jsoneditoronline.org/


### Description

JSON Editor Online is a web-based tool to view, edit, and format JSON.
It shows your data side by side in a clear, editable treeview and in 
a code editor.


### Screenshot

<a href="http://jsoneditoronline.org">
    <img alt="jsoneditoronline"
        src="https://raw.github.com/josdejong/jsoneditoronline/master/misc/screenshots/jsoneditoronline.png">
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


### Getting started

- Web app:    http://jsoneditoronline.org/
- Chrome app: https://chrome.google.com/webstore/detail/json-editor/lhkmoheomjbkfloacpgllgjcamhihfaj
- Wiki:       https://github.com/josdejong/jsoneditoronline/wiki/
- Downloads:  http://jsoneditoronline.org/downloads/
- Sourcecode: https://github.com/josdejong/jsoneditoronline/


### Build

The code of the JSON Editor is located in the folder `jsoneditor`.
The code for the web application in `app/web`.
To build the library from sourcecode, run

    ant

in the root of the project. This will generate a folder `build` containing
generated library and web application.
