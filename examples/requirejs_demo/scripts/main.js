var module = '../../../jsoneditor';
require([module], function (jsoneditor) {
  // create the editor
  var container = document.getElementById('jsoneditor');
  var editor = new jsoneditor.JSONEditor(container);

  // set json
  document.getElementById('setJSON').onclick = function () {
    var json = {
      'array': [1, 2, 3],
      'boolean': true,
      'null': null,
      'number': 123,
      'object': {'a': 'b', 'c': 'd'},
      'string': 'Hello World'
    };
    editor.set(json);
  };

  // get json
  document.getElementById('getJSON').onclick = function () {
    var json = editor.get();
    alert(JSON.stringify(json, null, 2));
  };
});
